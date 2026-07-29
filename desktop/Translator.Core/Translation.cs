namespace Translator.Core;

public enum TextKind { Word, Sentence, Paragraph }
public sealed record TranslationRequest(string RequestId, string Text, string SourceLanguage = "en", string TargetLanguage = "zh-CN");
public sealed record TranslationResult(string RequestId, string OriginalText, string TranslatedText, TextKind TextKind, string Provider, string? Phonetic = null);
public sealed record ProviderHealth(bool IsAvailable, string Message);

public interface ITranslationProvider
{
    string Id { get; }
    Task<ProviderHealth> CheckHealthAsync(CancellationToken cancellationToken);
    Task<TranslationResult> TranslateAsync(TranslationRequest request, CancellationToken cancellationToken);
}

public static class TextRules
{
    public const int MaximumLength = 5_000;
    public static string Normalize(string text) => string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    public static string ValidateAndNormalize(string text)
    {
        var normalized = Normalize(text);
        if (normalized.Length == 0) throw new ArgumentException("Enter or recognize some English text first.", nameof(text));
        if (normalized.Length > MaximumLength) throw new ArgumentException($"Text cannot exceed {MaximumLength} characters.", nameof(text));
        if (!normalized.Any(c => c is >= 'A' and <= 'Z' or >= 'a' and <= 'z')) throw new ArgumentException("The text must contain English letters.", nameof(text));
        return normalized;
    }

    public static TextKind Classify(string text)
    {
        var words = Normalize(text).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 1 && !".!?".Contains(words[0][^1])) return TextKind.Word;
        return words.Length <= 12 ? TextKind.Sentence : TextKind.Paragraph;
    }
}

public sealed class MockTranslationProvider : ITranslationProvider
{
    public string Id => "mock";
    public Task<ProviderHealth> CheckHealthAsync(CancellationToken cancellationToken) =>
        Task.FromResult(new ProviderHealth(true, "Mock provider is ready."));

    public Task<TranslationResult> TranslateAsync(TranslationRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var text = TextRules.ValidateAndNormalize(request.Text);
        return Task.FromResult(new TranslationResult(request.RequestId, text, $"[模拟翻译] {text}", TextRules.Classify(text), Id));
    }
}
