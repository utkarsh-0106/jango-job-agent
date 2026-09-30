# Jango Job Agent

A Chrome Manifest V3 extension for autofilling job application forms.

## Architecture

```
extension/
├── src/
│   ├── background/        # Service worker
│   ├── content/           # Content script (DOM detection + autofill)
│   ├── popup/             # React-based popup UI
│   ├── field-detector/    # Generic form field detection
│   ├── autofill/          # Autofill execution engine
│   ├── profile/           # Profile storage (abstraction + Chrome impl)
│   ├── messaging/         # Chrome extension messaging
│   ├── shared/            # Shared types & constants
│   └── utils/             # Confidence scoring utilities
├── tests/                 # Unit tests (Vitest)
├── public/                # Static assets
└── manifest.json          # MV3 manifest
```

## Development

```bash
cd extension
npm install
npm run dev      # Watch mode build
npm run build    # Production build
npm run test     # Run tests
npm run typecheck # TypeScript check
```

## Loading in Chrome

1. Run `npm run build` in `extension/`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `extension/dist/`

## Permissions

- `activeTab` - Access current tab on user action
- `storage` - Store profile locally
- `scripting` - Inject content script on demand

No host permissions - content script injected via `scripting.executeScript()` when user clicks popup buttons.

## Profile

Profile stored in `chrome.storage.local` under key `jango:profile`. See `profile/profile.example.json` for structure.