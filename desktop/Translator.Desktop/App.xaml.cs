namespace Translator.Desktop;

public partial class App : System.Windows.Application
{
    protected override void OnStartup(System.Windows.StartupEventArgs e)
    {
        if (e.Args.Contains("--register-bridge", StringComparer.OrdinalIgnoreCase))
        {
            try
            {
                BridgeRegistrationService.EnsureRegistered();
                Environment.ExitCode = 0;
            }
            catch
            {
                Environment.ExitCode = 1;
            }
            Shutdown(Environment.ExitCode);
            return;
        }

        base.OnStartup(e);
    }
}
