using System.Windows;

namespace Translator.Desktop;

public partial class ShortcutSettingsWindow : Window
{
    public ShortcutSettings SelectedSettings { get; private set; }

    public ShortcutSettingsWindow(ShortcutSettings current)
    {
        InitializeComponent();
        ModifiersBox.ItemsSource = Enum.GetValues<ShortcutModifiers>();
        KeyBox.ItemsSource = Enumerable.Range('A', 26).Select(value => ((char)value).ToString());
        ModifiersBox.SelectedItem = current.Modifiers;
        KeyBox.SelectedItem = current.Key.ToUpperInvariant();
        SelectedSettings = current;
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (ModifiersBox.SelectedItem is not ShortcutModifiers modifiers ||
            KeyBox.SelectedItem is not string key)
        {
            return;
        }

        SelectedSettings = new ShortcutSettings(modifiers, key);
        DialogResult = true;
    }
}
