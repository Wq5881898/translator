using System.Diagnostics;
using System.IO;
using Translator.Core;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;
using Windows.Storage.Streams;

namespace Translator.Desktop;

public sealed class WindowsOcrProvider : IOcrProvider
{
    public string Id => "windows-local-ocr";
    public Task<ProviderHealth> CheckHealthAsync(CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        var engine = OcrEngine.TryCreateFromUserProfileLanguages();
        return Task.FromResult(engine is null
            ? new ProviderHealth(false, "Install an English Windows language/OCR feature.")
            : new ProviderHealth(true, $"Windows OCR ready ({engine.RecognizerLanguage.LanguageTag})."));
    }

    public async Task<Translator.Core.OcrResult> RecognizeAsync(Stream imageStream, CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        var engine = OcrEngine.TryCreateFromUserProfileLanguages()
            ?? throw new InvalidOperationException("Windows local OCR is unavailable. Install an English Windows language/OCR feature.");
        var watch = Stopwatch.StartNew();
        using var randomAccess = new InMemoryRandomAccessStream();
        var output = randomAccess.AsStreamForWrite();
        await imageStream.CopyToAsync(output, token);
        await output.FlushAsync(token);
        randomAccess.Seek(0);
        var decoder = await BitmapDecoder.CreateAsync(randomAccess);
        using var bitmap = await decoder.GetSoftwareBitmapAsync(BitmapPixelFormat.Bgra8, BitmapAlphaMode.Premultiplied);
        var result = await engine.RecognizeAsync(bitmap);
        watch.Stop();
        return new Translator.Core.OcrResult(TextRules.Normalize(result.Text), watch.Elapsed, Id);
    }
}
