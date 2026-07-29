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

    public static EnglishTextAssessment AssessEnglishOcr(string text, float? confidence = null)
    {
        var normalized = Normalize(text);
        if (normalized.Length == 0)
        {
            return new EnglishTextAssessment(false, "No text was recognized.");
        }

        if (confidence is < 0.45f)
        {
            return new EnglishTextAssessment(
                false,
                $"The OCR confidence was only {confidence.Value:P0}.");
        }

        var letters = normalized.Where(IsLatinLetter).ToArray();
        if (letters.Length < 2)
        {
            return new EnglishTextAssessment(false, "No reliable English letters were detected.");
        }

        var words = normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => new string(word.Where(IsLatinLetter).ToArray()))
            .Where(word => word.Length > 0)
            .ToArray();
        var suspiciousSingles = words.Count(word =>
            word.Length == 1 &&
            !word.Equals("a", StringComparison.OrdinalIgnoreCase) &&
            !word.Equals("i", StringComparison.OrdinalIgnoreCase));
        if (words.Length >= 4 && suspiciousSingles > Math.Max(1, words.Length / 3))
        {
            return new EnglishTextAssessment(false, "The result contains too many isolated letters.");
        }

        if (letters.Length >= 8)
        {
            var vowelCount = letters.Count(character =>
                "aeiouyAEIOUY".Contains(character));
            if ((double)vowelCount / letters.Length < 0.12)
            {
                return new EnglishTextAssessment(false, "The result does not look like English text.");
            }
        }

        return new EnglishTextAssessment(true, "Reliable English text detected.");
    }

    private static bool IsLatinLetter(char character) =>
        character is >= 'A' and <= 'Z' or >= 'a' and <= 'z';

    public static TextKind Classify(string text)
    {
        var words = Normalize(text).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 1 && !".!?".Contains(words[0][^1])) return TextKind.Word;
        return words.Length <= 12 ? TextKind.Sentence : TextKind.Paragraph;
    }
}

public sealed record EnglishTextAssessment(bool IsReliable, string Message);

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
