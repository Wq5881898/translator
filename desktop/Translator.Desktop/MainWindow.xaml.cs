using System.Windows;
using Translator.Core;

namespace Translator.Desktop;

public partial class MainWindow : Window
{
    private readonly BrowserBridgeTranslationProvider _translation = new();
    private readonly EnglishOcrProvider _ocr = new();

    public MainWindow() => InitializeComponent();

    private async void CaptureButton_Click(object sender, RoutedEventArgs e)
    {
        RecognizedText.Clear();
        TranslatedText.Clear();
        SetBusy(true, "Select a region. Press Esc to cancel.");
        Hide();
        try
        {
            await Task.Delay(150);
            using var image = ScreenRegionCapture.CaptureWithOverlay();
            Show();
            Activate();
            if (image is null)
            {
                StatusText.Text = "Capture cancelled. No image was saved.";
                return;
            }

            StatusText.Text = "Running packaged English OCR…";
            var result = await _ocr.RecognizeAsync(image, CancellationToken.None);
            var cleanedText = TextRules.CleanEnglishOcrArtifacts(
                TextRules.ExtractEnglishOcrContent(result.Text));
            var assessment = TextRules.AssessEnglishOcr(cleanedText, result.Confidence);
            if (!assessment.IsReliable)
            {
                RecognizedText.Clear();
                StatusText.Text =
                    $"No reliable English text was detected. {assessment.Message} " +
                    "The possible non-English OCR output was ignored; select a clear English region and try again.";
                return;
            }

            RecognizedText.Text = cleanedText;
            var confidenceText = result.Confidence is null
                ? string.Empty
                : $" at {result.Confidence.Value:P0} confidence";
            StatusText.Text =
                $"English OCR completed in {result.Duration.TotalMilliseconds:F0} ms using {result.Provider}{confidenceText}. " +
                "The in-memory image has been disposed.";
        }
        catch (Exception exception)
        {
            Show();
            Activate();
            StatusText.Text = $"OCR validation failed: {exception.Message}";
        }
        finally
        {
            SetBusy(false);
        }
    }

    private async void TranslateButton_Click(object sender, RoutedEventArgs e)
    {
        TranslatedText.Clear();
        SetBusy(true, "Checking the Chrome translation bridge...");
        try
        {
            var health = await _translation.CheckHealthAsync(CancellationToken.None);
            if (!health.IsAvailable)
            {
                StatusText.Text =
                    $"Translation could not start: {health.Message} " +
                    "Run bridge\\install-bridge.ps1, fully restart Chrome, and retry.";
                return;
            }

            StatusText.Text =
                "Chrome bridge connected. Translating locally; first-time language-pack setup may take up to 35 seconds...";
            var result = await _translation.TranslateAsync(
                new TranslationRequest(Guid.NewGuid().ToString("N"), RecognizedText.Text),
                CancellationToken.None);
            TranslatedText.Text = result.TranslatedText;
            StatusText.Text =
                $"Translation completed using {result.Provider}. Type: {result.TextKind}.";
        }
        catch (Exception exception)
        {
            StatusText.Text = $"Translation failed: {exception.Message}";
        }
        finally
        {
            SetBusy(false);
        }
    }

    private void SetBusy(bool busy, string? status = null)
    {
        CaptureButton.IsEnabled = !busy;
        TranslateButton.IsEnabled = !busy;
        if (status is not null)
        {
            StatusText.Text = status;
        }
    }
}
