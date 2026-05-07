# Markdown Viewer

Desktop Markdown editor with real-time preview, built with Tauri + React + CodeMirror 6.

## Stack

- **Frontend:** React 18, TypeScript, Vite
- **Editor:** CodeMirror 6 with markdown syntax highlighting
- **Preview:** markdown-it (in-browser) / pulldown-cmark (Rust backend)
- **Backend:** Rust + Tauri 2
- **Desktop shell:** Tauri (Windows)

## Features

- Markdown editing with syntax highlighting and dark theme
- Real-time split-pane preview (editor | preview)
- Open local `.md` files
- Save / Save As with native file dialogs

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) 1.70+
- Windows build tools (Visual Studio Build Tools or `windows-rs` dependencies)

## Setup

```powershell
# Install frontend dependencies
npm install

# Start the desktop app
npm run tauri dev
```

## Project structure

```
├── index.html                 # Vite entry
├── package.json               # JS dependencies
├── vite.config.ts             # Vite config (port 1420)
├── tsconfig.json              # TypeScript config
├── src/
│   ├── main.tsx               # React entry
│   ├── App.tsx                # Root component (toolbar + split layout)
│   ├── App.css                # Global styles
│   ├── Editor.tsx             # CodeMirror 6 editor component
│   ├── Preview.tsx            # markdown-it preview component
│   └── vite-env.d.ts          # Vite types
└── src-tauri/
    ├── Cargo.toml             # Rust dependencies
    ├── tauri.conf.json         # Tauri window & build config
    ├── build.rs               # Tauri build hook
    ├── capabilities/
    │   └── default.json       # Permissions (core, dialog, fs)
    ├── icons/                 # App icons (generated)
    └── src/
        ├── main.rs            # Rust entry point
        └── lib.rs             # Tauri commands (parse_markdown, read_file, save_file)
```

## Tauri commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `parse_markdown` | `markdown: &str` | `String` | Render Markdown to HTML (pulldown-cmark) |
| `read_file` | `path: &str` | `Result<String, String>` | Read file contents |
| `save_file` | `path: &str, content: &str` | `Result<(), String>` | Write content to file |

## Build

```Bash
npm install
npm run tauri build
```

Output in `src-tauri/target/release/bundle/`.
