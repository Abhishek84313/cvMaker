# Browser Extension Integration

## Overview
This extension allows users to extract job offer details directly from job portals (e.g., LinkedIn, Indeed) and send them seamlessly into the desktop application's CV Maker workspace.

<p align="center">
  <img src="./images/extensionScreenshot.png" width="50%" alt="Screenshot extension" width="800" />
</p>


---

## Architecture & Data Flow
```
[Web Page] ──(Content Script)──> [Local HTTP Server (Port 9123)]
                            │
                (Main Electron Process)
                            │
                          (IPC)
                            ▼
                [Renderer / Zustand Store]
```

1. **Extraction**: The extension scrapes structured job metadata (`JobOfferPayload`) from the active tab.
2. **Bridge**: It sends a `POST` request to `http://127.0.0.1:9123/api/job`.
3. **Dispatch**: The local Node.js HTTP server in the Main process receives the payload and forwards it to the active `BrowserWindow` via IPC (`JOB_RECEIVED_FROM_EXTENSION`).
4. **State Management**: The frontend listener updates `incomingJob` in `useUiStore` and navigates to the CV Maker tab.

---

## Technical Choices & Rationale
- **Why a local HTTP server?** Browsers restrict direct IPC communication with external native apps. Running a lightweight local HTTP server on `127.0.0.1` acts as a secure local bridge.
- **CORS Handling**: `HttpServerService` handles `OPTIONS` preflight requests and enforces standard local origin checks.

---

## Testing & Local Development (Firefox)

Currently, the extension is configured for **Firefox**.

### 1. Load Extension in Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside the `./navigator_extension/` directory.

### 2. Test the Flow
1. Ensure the Electron desktop app is running (`npm run dev`).
2. Navigate to a supported job offer page in Firefox.
3. Trigger the extension with the shortcut `ctrl+shift+y` (or `cmd+shift+y` on mac)
4. Verify in Electron DevTools console (`Ctrl + Shift + I`) that `Received job from extension:` is logged and the UI switches to the CV Maker view.

---

## Payload Schema (`JobOfferPayload`)
```typescript
interface JobOfferPayload {
  title: string;
  company: string;
  location?: string;
  description: string;
  url: string;
}
```

---
## Scraper Architecture & Adapters

To reliably extract job offer details across various websites, the extension uses a modular adapter-based architecture located in `./navigator_extension/firefox/adapters/`.

### Directory Overview
- `./navigator_extension/firefox/adapters/`
  - **Purpose**: Houses site-specific scrapers tailored to popular job boards (e.g., LinkedIn, Indeed, Welcome to the Jungle).
  - **Future Scope**: As the extension evolves, new adapters will be added here to target specific DOM structures and ensure precise metadata parsing. Each adapter implements a common interface, isolating site-specific DOM breaking changes to single files.

### Generic Scraper (`generic.js`)
- **Fallback Mechanism**: Acts as the primary fallback when no platform-specific adapter matches the active tab URL, or if a platform adapter fails to parse the page.
- **Extraction Strategy**:
  1. Parses Structured Data (`<script type="application/ld+json">`) looking for `JobPosting` schemas (Schema.org).
  2. Extracts Open Graph and Twitter meta tags (`og:title`, `og:description`, etc.).
  3. Falls back to standard HTML heuristics (`document.title`, primary headers) or selected user text.