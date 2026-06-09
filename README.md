# Lingrid

![Lingrid logo](assets/icon-128.png)

Lingrid is a lightweight, modern, local-first PO / CSV multilingual side-by-side matrix editor.

Its core objective is not to replicate traditional single-language PO editors, but to import multiple language files into a single window, allowing users to view, search, edit, and save multilingual translations corresponding to a single source text in a matrix layout.

```text
source                zh-CN        en              ja             tag
Start Game            开始游戏      Start Game      ゲーム開始      #ui
Options               选项          Options         オプション      #review
```

## Project Overview

- **Project Name**: Lingrid
- **One-sentence description**: A lightweight and modern PO / CSV multilingual matrix editor.
- **Problem Solved**: Traditional PO editors are usually single-file and single-language oriented. Lingrid prioritizes game and software localization workflows where one source text corresponds to multiple language translations, requiring side-by-side viewing and editing.
- **Target Audience**: Indie game developers, small software teams, localization managers, freelance translators, and anyone managing multilingual PO/CSV files.
- **Current Status**: Phase 1 (v0.1) runnable prototype. Core editor features, lightweight AI suggestions, batch find/replace, and Electron packaging scripts for desktop build are ready.

## Phase 1 (v0.1) Capabilities

- Support `.po` and `.csv` as editable source file inputs.
- Support `.pot` as read-only source/template inputs.
- Support appending/importing multiple files iteratively rather than all at once.
- Automatically merge imported files into a unified multilingual matrix view.
- Support adjusting column order and width, and set display names for language columns.
- Edit translations directly inside the matrix cells.
- Select a cell to edit in a larger 1-to-1 Poedit-like detail editor panel.
- Save changes directly back to the original source `.po` / `.csv` files.
- Save project state separately in a project JSON file (containing open files, column order, tags, and CSV mappings). Note that search, filters, sorting, and force-fill toggle remain session-only and are not written to the project JSON.
- Support saving projects, saving projects as new files, and saving current language PO as new files.
- Search by source, any target language translations, and tags.
- Filter by completion status, changed/dirty status, and tags.
- Two-tier Obsidian-style tags: Source Tags (shared across all languages for a source entry) and Word Tags (bound to a specific language cell, rendered as a colored vertical bar in the top-right corner of the matrix cell).
- Tag filters (both Source and Word tags) provide `All` and `Empty` options: checking `All` selects all tags and empty items, while `Empty` targets untagged entries/cells.
- Basic statistics: entry count, completion rates per language, untranslated counts, tag counts, and changed counts.
- Lightweight AI / Translation API suggestions: configure endpoint, key, model, and prompt to fetch translation suggestions for the active cell.
- Simple batch find and replace.
- Excel-like matrix multi-selection, bulk copy-paste, bulk fill, and `Ctrl/Cmd+Z` undo / `Ctrl/Cmd+Shift+Z` redo; Source Tag cells support the same operations.
- UI supports switching interface language between Chinese, Japanese, and English.

## File Processing Boundaries

- Editable source inputs in Phase 1 (v0.1) are `.po` and `.csv`, allowing direct overwrites to the source files.
- `.pot` files are read-only templates/sources; they cannot be edited and are never overwritten by the saving process.
- PO files are not simplified internally into plain tables. When reading and writing, metadata such as `msgctxt`, `msgid`, `msgid_plural`, `msgstr[n]`, comments, references, flags, previous source, and obsolete entries are fully preserved.
- The matrix is just a UI projection of the PO documents. Saving preserves the original entry order and formatting to avoid generating unnecessary diffs.
- CSV parsing does not attempt to support all arbitrary table layouts. Users must map source column, language columns, and optional id/key columns during import.
- The project JSON file only stores project metadata, not the actual translations.
- Source and Word tags are stored in the project JSON and are not written into the source `.po` or `.csv` files.

## Non-Goals (Out of Scope for Phase 1)

The following features are NOT planned for Phase 1 (v0.1):

- Excel (`.xlsx`) import/export.
- Terminology databases (glossaries).
- Translation memory (TM).
- Multi-user collaboration/syncing.
- Direct Git integration.
- Complex QA verification suites.
- Complex project management tools.
- Platform-level features matching Crowdin, Lokalise, or Weblate.

## Tech Stack & Architecture

- **Language**: TypeScript first.
- **App Shell**: Desktop app packaged via Electron.
- **UI Framework**: React, shadcn/ui, Tailwind CSS.
- **Design Guidelines**: Inspired by Linear: modern, minimalist, high density, and low noise.
- **Separation of Concerns**: Core logic (PO/CSV adapters, matrix merging, saving, searching/filtering, statistics, tags, AI suggestions) lives in a testable core layer decoupled from React.
- **Security**: The Renderer does not directly access the Node file system. Native file dialogs, file reading/writing, and secure API key storage are handled through preload/main process APIs in Electron.

## Directory Structure

```text
.
├── AGENTS.md
├── README.md
├── README.zh-CN.md
├── REQUIREMENTS.md
├── DESIGN.md
├── agent-log/
├── assets/                 # Brand and icon source assets
│   ├── icon-source.png     # Original 1254x1254 source image
│   └── icon-{16,32,48,64,128,180,192,256,512,1024}.png
├── public/                 # Browser static assets (copied by Vite to dist/)
│   ├── favicon.ico
│   ├── favicon-{16,32}.png
│   ├── apple-touch-icon.png
│   ├── icon-{192,512}.png
│   └── site.webmanifest
├── fixtures/
├── ts/
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── renderer/
│   ├── core/
│   ├── adapters/
│   └── tests/
└── electron/
    ├── tsconfig.json
    ├── main/
    └── preload/
```

## Getting Started

Install dependencies and start the browser-based development preview:

```bash
npm install
npm run dev
```

## Online Demo

GitHub Pages web version:

```text
https://ddonlien.github.io/lingrid/
```

Deployments to GitHub Pages are managed automatically via GitHub Actions upon pushes to `main`. Electron build/packaging is handled in Phase 2 (P2) and does not affect the web version.

The web-based preview supports overwriting local files directly if the browser supports the File System Access API. Saving only writes to files with actual changes, validates `readwrite` permissions before writing, and performs a post-write read verification. In browsers without this API, saving falls back to downloading updated file copies, showing a notice that the original files were not overwritten.

The Electron version automatically reopens PO/POT/CSV source files based on the paths stored in the project JSON. Missing or unreadable files are skipped with a warning.

In the web preview, due to browser sandboxing, reopening a project requires selecting the project JSON first, then clicking `Authorize Project Folder` to authorize the project directory. The app then recursively finds and restores source files matching the JSON paths. Sandboxed browser constraints do not apply to the desktop Electron app.

Different language PO files can have mismatched entries. The matrix displays the union of all entries, but missing cells are disabled by default and excluded from stats. You can toggle `Force Fill` in the toolbar; when editing a missing cell under Force Fill, saving will clone the PO metadata from existing entries and append the cell to the target PO file.

If you encounter saving issues in the browser, check the `Diagnostics` log in the top menu. Clear the log, perform your actions, and copy the log. It records browser capabilities, loading, directory scans, file permissions, serialization sizes, write attempts, and verification results without storing translation texts or API keys.

To start the desktop development server in Electron:

```bash
npm run build
npm run dev:electron
```

To package the Electron desktop app:

```bash
npm run package:electron
npm run dist:electron
```

`package:electron` packages the unpacked application for testing. `dist:electron` packages the installers for distribution in `release/`. App icons are pre-configured. macOS production releases require Developer ID certificates and notarization.

Running tests and validation:

```bash
npm test
npm run build
```

Currently, `npm` is preferred since the local Node.js v20 conflicts with global `pnpm` v11.

## Documentation

- **Agent Collaboration Protocol**: `AGENTS.md`
- **Requirements & Acceptance Checklist**: `REQUIREMENTS.md`
- **Design System & Visual Spec**: `DESIGN.md`
- **Agent Logs**: `agent-log/`

## Design Principles

- **Side-by-side editing priority**: Multilingual alignment is the primary goal.
- **Reliable file saving**: Integrity of user files takes precedence over feature count.
- **Explicit file flows**: The main save button acts directly on source files.
- **State isolation**: The project JSON stores only project state, never replacing `.po` / `.csv` source data.
- **Local-first**: Lightweight, local storage, no SaaS databases.
- **AI as assistance**: AI translations are suggestions, not automatic pipelines.
