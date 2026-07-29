import { access, readFile } from 'node:fs/promises';

const manifestPath = '.output/chrome-mv3/manifest.json';
const requiredFiles = [
  manifestPath,
  '.output/chrome-mv3/sidepanel.html',
  '.output/chrome-mv3/options.html',
  'PRIVACY.md',
  'THIRD_PARTY_NOTICES.md',
  'CHANGELOG.md',
  'docs/TEST_REPORT_STAGE_1.md',
];

await Promise.all(requiredFiles.map((path) => access(path)));

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const expectedPermissions = ['contextMenus', 'sidePanel', 'storage', 'nativeMessaging'];
const actualPermissions = [...(manifest.permissions ?? [])].sort();

if (JSON.stringify(actualPermissions) !== JSON.stringify([...expectedPermissions].sort())) {
  throw new Error(`Unexpected permissions: ${actualPermissions.join(', ')}`);
}

const expectedHosts = [
  'https://api.cognitive.microsofttranslator.com/*',
  'https://api.dictionaryapi.dev/*',
];
const actualHosts = [...(manifest.host_permissions ?? [])].sort();

if (JSON.stringify(actualHosts) !== JSON.stringify([...expectedHosts].sort())) {
  throw new Error(`Unexpected host permissions: ${actualHosts.join(', ')}`);
}

if (manifest.version !== '1.0.0') {
  throw new Error(`Unexpected release version: ${manifest.version}`);
}

console.log('Release artifact, permissions, hosts, version, and required documents verified.');
