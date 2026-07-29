namespace Translator.Core;

public sealed record OcrResult(string Text, TimeSpan Duration, string Provider);

public interface IOcrProvider
{
    string Id { get; }
    Task<ProviderHealth> CheckHealthAsync(CancellationToken cancellationToken);
    Task<OcrResult> RecognizeAsync(Stream imageStream, CancellationToken cancellationToken);
}
