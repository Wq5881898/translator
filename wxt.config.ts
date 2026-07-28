import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Translator',
    description: 'A lightweight translation companion for English learning.',
    version: '0.1.0',
    permissions: ['contextMenus', 'sidePanel'],
    action: {
      default_title: 'Open Translator',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
  },
});
