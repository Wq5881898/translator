# Installation and Update Guide

## Chrome developer installation

1. Download and extract the release-candidate ZIP.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted directory containing `manifest.json`.
6. Pin Translator if desired and open its side panel.
7. Refresh webpages that were already open before installation.

## Edge developer installation

1. Download and extract the same release-candidate ZIP.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted directory containing `manifest.json`.
6. Refresh webpages that were already open.

The extension uses Manifest V3 and the same Chromium build for Chrome and Edge. Chrome local Translator API availability can differ between browser versions. When unavailable, Translator shows a recoverable message; Azure remains an optional user-configured fallback.

## Updating an unpacked build

1. Extract the new build to a new directory or replace the old extracted files.
2. Open the browser extensions page.
3. Click the reload icon on Translator.
4. Refresh every already-open webpage used for selection translation.

## Removing the extension

Use **Remove** from the browser extensions page. To explicitly clear Translator data before removal, open extension options and use the two-step **Clear local data** action.
