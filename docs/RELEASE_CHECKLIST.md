# Stage 1 Release Checklist

## Automated

- [ ] TypeScript type-check passes.
- [ ] All Vitest tests pass.
- [ ] Manifest V3 build passes.
- [ ] Release verification confirms version, permissions, external hosts, required pages, and documents.
- [ ] Unpacked test artifact uploads successfully.

## Chrome

- [ ] Install/update instructions verified.
- [ ] Existing tabs refreshed after extension reload.
- [ ] Word, sentence, paragraph, repeated selection, and right-click fallback verified.
- [ ] Local translation and recoverable error states verified.
- [ ] Pronunciation play/stop and US/UK preference verified.
- [ ] Favorites add/remove and hidden list verified.
- [ ] CSV Excel display, import merge, duplicate prevention, and malformed-file rejection verified.
- [ ] Settings save/close and two-step local-data clearing verified.

## Edge

- [ ] Unpacked installation verified.
- [ ] Selection and side-panel smoke test verified.
- [ ] Translation availability or understandable unavailable state verified.
- [ ] Speech, favorites, CSV, and settings smoke test verified.

## Privacy and release material

- [ ] Permission list matches the documented minimum.
- [ ] Azure remains disabled by default.
- [ ] No API key exists in source or build output.
- [ ] Privacy policy, README, license, third-party notices, changelog, installation guide, and test report reviewed.
- [ ] Translation counts and screenshot OCR remain excluded from Stage 1.
