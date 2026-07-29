using System.Diagnostics;
using System.IO;
using Tesseract;
using Translator.Core;

namespace Translator.Desktop;

public sealed class PackagedEnglishOcrProvider : IOcrProvider
{
    private readonly string _dataPath;

    public PackagedEnglishOcrProvider(string? dataPath = null)
    {
        _dataPath = dataPath ?? Path.Combine(AppContext.BaseDirectory, "tessdata");
    }

    public string Id => "packaged-english-ocr";

    public Task<ProviderHealth> CheckHealthAsync(CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        var modelPath = Path.Combine(_dataPath, "eng.traineddata");
        return Task.FromResult(File.Exists(modelPath)
            ? new ProviderHealth(true, "Packaged English OCR is ready.")
            : new ProviderHealth(false, "The packaged English OCR model is missing."));
    }

    public async Task<Translator.Core.OcrResult> RecognizeAsync(Stream imageStream, CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        var health = await CheckHealthAsync(token);
        if (!health.IsAvailable)
        {
            throw new InvalidOperationException(health.Message);
        }

        using var buffer = new MemoryStream();
        await imageStream.CopyToAsync(buffer, token);
        token.ThrowIfCancellationRequested();

        var watch = Stopwatch.StartNew();
        using var engine = new TesseractEngine(_dataPath, "eng", EngineMode.LstmOnly);
        engine.SetVariable("preserve_interword_spaces", "1");
        using var image = Pix.LoadFromMemory(buffer.ToArray());
        using var page = engine.Process(image, PageSegMode.Auto);
        var text = TextRules.Normalize(page.GetText());
        watch.Stop();

        return new Translator.Core.OcrResult(text, watch.Elapsed, Id);
    }
}
