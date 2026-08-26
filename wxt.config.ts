import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Translator',
    description: 'A lightweight local-first translation companion for English learning.',
    version: '1.1.7',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmMNWdHsn9sIcROxD00Okwhbux/5wTIWc+UeCQp+OUPRCFE54gLCimx0+WY3VxiraxRe2sWL/5/X5nOiLqLLRcqwrRJyVvW1XquPGxlql/0r8HqjKtHdI5Ng9HPo0NR729hvCKi2QnXpQzdvI5vR6Qh5KcrnLxfU60hBFr/4gGDZVW074SwcDAH5Co+EcSCfo2tNIGCOPPb18Be+ZvEqEjDIxrMMVtk6ViI+oLzXO94QPq0xCP7itf/Zfy+7GUZ1Iik9EzMza4CpqmSqxQEsnBJNnstzb2Yh84Z2MgjXGNcnkWRcArjrikUxQWBnGpUIjNvT7qwVzy9ne5SxKk2kC1wIDAQAB',
    permissions: ['contextMenus', 'sidePanel', 'storage', 'nativeMessaging', 'offscreen'],
    host_permissions: [
      'https://api.cognitive.microsofttranslator.com/*',
      'https://api.dictionaryapi.dev/*',
      'https://api.datamuse.com/*',
    ],
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
