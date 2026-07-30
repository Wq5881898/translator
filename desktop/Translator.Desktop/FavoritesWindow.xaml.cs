using System.Text;
using System.IO;
using System.Windows;
using Microsoft.Win32;
using Translator.Core;

namespace Translator.Desktop;

public partial class FavoritesWindow : Window
{
    private List<FavoriteEntry> _favorites = [];

    public FavoritesWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await ReloadAsync();
    }

    private async Task ReloadAsync()
    {
        _favorites = (await SharedFavoriteStore.LoadAsync()).ToList();
        FavoritesGrid.ItemsSource = null;
        FavoritesGrid.ItemsSource = _favorites;
        CountText.Text = $"{_favorites.Count} saved locally";
    }

    private async void Remove_Click(object sender, RoutedEventArgs e)
    {
        if (FavoritesGrid.SelectedItem is not FavoriteEntry selected) return;
        _favorites.RemoveAll(item => item.Id == selected.Id);
        await SharedFavoriteStore.SaveAsync(_favorites);
        await ReloadAsync();
        StatusText.Text = "Favorite removed.";
    }

    private async void Import_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFileDialog { Filter = "CSV files (*.csv)|*.csv" };
        if (dialog.ShowDialog(this) != true) return;
        try
        {
            var imported = FavoritesCsv.Parse(await File.ReadAllTextAsync(dialog.FileName));
            _favorites = _favorites
                .Concat(imported)
                .GroupBy(item => item.Id, StringComparer.Ordinal)
                .Select(group => group.First())
                .ToList();
            await SharedFavoriteStore.SaveAsync(_favorites);
            await ReloadAsync();
            StatusText.Text = "Favorites imported.";
        }
        catch (Exception exception)
        {
            StatusText.Text = $"Import failed: {exception.Message}";
        }
    }

    private async void Export_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new SaveFileDialog
        {
            Filter = "CSV files (*.csv)|*.csv",
            FileName = $"translator-favorites-{DateTime.Now:yyyy-MM-dd}.csv"
        };
        if (dialog.ShowDialog(this) != true) return;
        try
        {
            await File.WriteAllTextAsync(
                dialog.FileName,
                FavoritesCsv.Serialize(_favorites),
                new UTF8Encoding(true));
            StatusText.Text = "Favorites exported.";
        }
        catch (Exception exception)
        {
            StatusText.Text = $"Export failed: {exception.Message}";
        }
    }
}
