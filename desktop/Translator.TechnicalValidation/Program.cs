using System.Text.Json;
using System.IO;
using System.Globalization;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Translator.Core;
using Translator.Desktop;

var checks = new (string Name, Func<Task> Run)[]
{
    ("text rules", ValidateTextRulesAsync),
    ("mock provider", ValidateMockAsync),
    ("native frame UTF-8 round-trip", ValidateFramingAsync),
    ("invalid native frame rejection", ValidateInvalidLengthAsync),
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
    await using var stream = new MemoryStream();
    var encoder = new PngBitmapEncoder();
    encoder.Frames.Add(BitmapFrame.Create(bitmap));
    encoder.Save(stream);
    stream.Position = 0;
    var provider = new WindowsOcrProvider();
    var health = await provider.CheckHealthAsync(CancellationToken.None);
    Assert(health.IsAvailable, health.Message);
    var result = await provider.RecognizeAsync(stream, CancellationToken.None);
    Assert(result.Text.Contains("local OCR", StringComparison.OrdinalIgnoreCase), $"Unexpected OCR result: {result.Text}");
}
static void Assert(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
