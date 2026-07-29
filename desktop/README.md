# Translator Stage 2 · Batch A

This directory contains the first technical-validation batch for the Windows companion.

## Scope

- .NET 10 WPF desktop foundation;
- multi-monitor region selection prototype;
- screenshot kept in memory and disposed after local OCR;
- Windows local OCR adapter;
- versioned translation Provider and Mock Provider;
- Chrome Native Messaging frame protocol and host health response;
- automated technical validation.

This is not the Stage 2 product UI and does not yet provide the full browser-bridge translation path, global shortcut, favorites, installer, or cloud Provider.

## Projects

- `Translator.Core`: stable OCR, translation, text and bridge contracts.
- `Translator.Desktop`: region selection, local OCR and editable result prototype.
- `Translator.BridgeHost`: Chrome Native Messaging stdio host prototype.
- `Translator.TechnicalValidation`: dependency-free executable checks.

## Build and validate

```powershell
dotnet restore desktop\Translator.Stage2.slnx --configfile NuGet.Config
dotnet build desktop\Translator.Stage2.slnx --no-restore --configuration Release
dotnet run --project desktop\Translator.TechnicalValidation --no-build --configuration Release
```

## Privacy boundary

`ScreenRegionCapture` returns a `MemoryStream`. The stream is passed only to `IOcrProvider`, never to `ITranslationProvider`, Native Messaging, disk, clipboard, logs, or the network. The caller owns and disposes it with `using`.

## Native Messaging

The extension and Host share protocol version `1.0`. The template in `desktop/bridge` must be filled with the published Host path and the unpacked extension ID during the later installer/bridge integration batch. Chrome requires the `nativeMessaging` permission and a registered host with an exact `allowed_origins` extension ID.
