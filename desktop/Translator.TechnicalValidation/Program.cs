using System.Text.Json;
using System.IO;
using System.Globalization;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Runtime.InteropServices;
using System.Text;
using System.Drawing;
using System.Diagnostics;
using Translator.Core;
using Translator.Desktop;

if (args is ["--image", var imagePath])
{
    await using var image = File.OpenRead(imagePath);
    var provider = new EnglishOcrProvider();
    var result = await provider.RecognizeAsync(image, CancellationToken.None);
    Console.WriteLine(result.Text);
    return string.IsNullOrWhiteSpace(result.Text) ? 1 : 0;
}

if (args is ["--capture-window", var titleFragment])
{
    var windowBounds = FindVisibleWindow(titleFragment)
        ?? throw new InvalidOperationException($"No visible window contains title: {titleFragment}");
    await using var image = ScreenRegionCapture.CaptureRegion(windowBounds);
    var provider = new WindowsOcrProvider();
    var result = await provider.RecognizeAsync(image, CancellationToken.None);
    Console.WriteLine($"Captured physical region: {windowBounds}");
    Console.WriteLine(result.Text);
    return result.Text.Any(character => character is >= 'A' and <= 'Z' or >= 'a' and <= 'z') ? 0 : 1;
}

var checks = new (string Name, Func<Task> Run)[]
{
    ("text rules", ValidateTextRulesAsync),
    ("mock provider", ValidateMockAsync),
    ("native frame UTF-8 round-trip", ValidateFramingAsync),
    ("invalid native frame rejection", ValidateInvalidLengthAsync),
    ("packaged English OCR on in-memory image", ValidatePackagedEnglishOcrAsync),
    ("Windows local OCR on in-memory image", ValidateWindowsOcrAsync),
};
var failed = 0;
foreach (var check in checks)
{
    try { await check.Run(); Console.WriteLine($"PASS  {check.Name}"); }
    catch (Exception exception) { failed++; Console.Error.WriteLine($"FAIL  {check.Name}: {exception}"); }
}
Console.WriteLine($"{checks.Length - failed}/{checks.Length} technical checks passed.");
return failed == 0 ? 0 : 1;

static Task ValidateTextRulesAsync()
{
    Assert(TextRules.Normalize("  Hello\r\n world ") == "Hello world", "Whitespace normalization failed.");
    Assert(TextRules.Classify("Hello") == TextKind.Word, "Word classification failed.");
    Assert(TextRules.Classify("Hello world.") == TextKind.Sentence, "Sentence classification failed.");
    return Task.CompletedTask;
}
static async Task ValidateMockAsync()
{
    var provider = new MockTranslationProvider();
    Assert((await provider.CheckHealthAsync(CancellationToken.None)).IsAvailable, "Mock provider unavailable.");
    var result = await provider.TranslateAsync(new TranslationRequest("r1", "Hello world."), CancellationToken.None);
    Assert(result.RequestId == "r1" && result.Provider == "mock", "Mock result invalid.");
}
static async Task ValidateFramingAsync()
{
    var expected = new BridgeEnvelope(BridgeEnvelope.CurrentVersion, "bridge.health", "r2", DateTimeOffset.UtcNow,
        JsonSerializer.SerializeToElement(new { text = "Hello 世界" }));
    await using var stream = new MemoryStream();
    await NativeMessageFraming.WriteAsync(stream, expected, CancellationToken.None);
    stream.Position = 0;
    var actual = await NativeMessageFraming.ReadAsync(stream, CancellationToken.None);
    Assert(actual?.Payload.GetProperty("text").GetString() == "Hello 世界", "UTF-8 payload failed.");
}
static async Task ValidateInvalidLengthAsync()
{
    await using var stream = new MemoryStream(BitConverter.GetBytes(int.MaxValue));
    try { _ = await NativeMessageFraming.ReadAsync(stream, CancellationToken.None); }
    catch (InvalidDataException) { return; }
    throw new InvalidOperationException("Invalid frame was accepted.");
}
static async Task ValidateWindowsOcrAsync()
{
    await using var stream = CreateEnglishTestImage();
    var provider = new WindowsOcrProvider();
    var health = await provider.CheckHealthAsync(CancellationToken.None);
    Assert(health.IsAvailable, health.Message);
    for (var attempt = 1; attempt <= 2; attempt++)
    {
        stream.Position = 0;
        var result = await provider.RecognizeAsync(stream, CancellationToken.None);
        Assert(result.Text.Contains("local OCR", StringComparison.OrdinalIgnoreCase),
            $"Unexpected OCR result on attempt {attempt}: {result.Text}");
    }
}
static async Task ValidatePackagedEnglishOcrAsync()
{
    await using var stream = CreateEnglishTestImage();
    var provider = new PackagedEnglishOcrProvider();
    var health = await provider.CheckHealthAsync(CancellationToken.None);
    Assert(health.IsAvailable, health.Message);
    var result = await provider.RecognizeAsync(stream, CancellationToken.None);
    Assert(result.Provider == "packaged-english-ocr", $"Unexpected OCR provider: {result.Provider}");
    Assert(result.Text.Contains("Translator local OCR", StringComparison.Ordinal),
        $"Unexpected OCR result: {result.Text}");
}
static MemoryStream CreateEnglishTestImage()
{
    var visual = new DrawingVisual();
    using (var drawing = visual.RenderOpen())
    {
        drawing.DrawRectangle(System.Windows.Media.Brushes.White, null, new Rect(0, 0, 900, 180));
        var text = new FormattedText("Translator local OCR", CultureInfo.GetCultureInfo("en-US"),
            System.Windows.FlowDirection.LeftToRight, new Typeface("Arial"), 54, System.Windows.Media.Brushes.Black, 1);
        drawing.DrawText(text, new System.Windows.Point(20, 45));
    }
    var bitmap = new RenderTargetBitmap(900, 180, 96, 96, PixelFormats.Pbgra32);
    bitmap.Render(visual);
    var stream = new MemoryStream();
    var encoder = new PngBitmapEncoder();
    encoder.Frames.Add(BitmapFrame.Create(bitmap));
    encoder.Save(stream);
    stream.Position = 0;
    return stream;
}
static void Assert(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }

static Rectangle? FindVisibleWindow(string titleFragment)
{
    Rectangle? result = null;
    EnumWindows((window, parameter) =>
    {
        if (!IsWindowVisible(window)) return true;
        var length = GetWindowTextLength(window);
        if (length == 0) return true;
        var title = new StringBuilder(length + 1);
        GetWindowText(window, title, title.Capacity);
        if (!title.ToString().Contains(titleFragment, StringComparison.OrdinalIgnoreCase)) return true;
        GetWindowThreadProcessId(window, out var processId);
        try
        {
            if (!Process.GetProcessById((int)processId).ProcessName.Equals("chrome", StringComparison.OrdinalIgnoreCase))
                return true;
        }
        catch (ArgumentException)
        {
            return true;
        }
        if (!GetWindowRect(window, out var bounds)) return true;
        result = Rectangle.FromLTRB(bounds.Left, bounds.Top, bounds.Right, bounds.Bottom);
        return false;
    }, IntPtr.Zero);
    return result;
}

[DllImport("user32.dll")]
static extern bool EnumWindows(EnumWindowsCallback callback, IntPtr parameter);
[DllImport("user32.dll")]
static extern bool IsWindowVisible(IntPtr window);
[DllImport("user32.dll", CharSet = CharSet.Unicode)]
static extern int GetWindowText(IntPtr window, StringBuilder text, int maximum);
[DllImport("user32.dll")]
static extern int GetWindowTextLength(IntPtr window);
[DllImport("user32.dll")]
static extern bool GetWindowRect(IntPtr window, out NativeRectangle rectangle);
[DllImport("user32.dll")]
static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);

delegate bool EnumWindowsCallback(IntPtr window, IntPtr parameter);
[StructLayout(LayoutKind.Sequential)]
struct NativeRectangle { public int Left; public int Top; public int Right; public int Bottom; }
