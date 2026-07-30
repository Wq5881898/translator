using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.Win32;

namespace Translator.Desktop;

public static class BridgeRegistrationService
{
    private const string HostName = "com.wq5881898.translator.stage2";
    private const string ExtensionId = "djbkcmlpogpnafgifiocehmkkghnhjjb";
    private const string RegistryPath =
        @"Software\Google\Chrome\NativeMessagingHosts\" + HostName;

    public static string EnsureRegistered()
    {
        var packageDirectory = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, ".."));
        var hostPath = Path.Combine(
            packageDirectory,
            "bridge-host",
            "Translator.BridgeHost.exe");
        if (!File.Exists(hostPath))
        {
            throw new FileNotFoundException(
                "Bridge Host is missing from the test package.",
                hostPath);
        }

        var manifestDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Translator",
            "bridge");
        Directory.CreateDirectory(manifestDirectory);
        var manifestPath = Path.Combine(manifestDirectory, $"{HostName}.json");
        var manifest = new
        {
            name = HostName,
            description = "Translator Stage 2 browser bridge",
            path = hostPath,
            type = "stdio",
            allowed_origins = new[] { $"chrome-extension://{ExtensionId}/" }
        };
        File.WriteAllText(
            manifestPath,
            JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true }),
            new UTF8Encoding(false));

        using var key = Registry.CurrentUser.CreateSubKey(RegistryPath, true)
            ?? throw new InvalidOperationException("Chrome bridge registry key could not be created.");
        key.SetValue("", manifestPath, RegistryValueKind.String);
        return hostPath;
    }
}
