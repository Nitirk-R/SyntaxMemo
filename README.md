# SyntaxMemo

A personal memory bank for programming syntax.

## Overview

Developers frequently encounter useful code patterns, API methods, and language syntax across documentation, tutorials, and articles. Remembering the exact syntax across multiple programming languages is difficult, and bookmarking entire webpages often leads to cluttered, forgotten links.

SyntaxMemo is a lightweight, local-first Chrome extension that lets you save code snippets directly from webpages, organize them, and retrieve them quickly when needed.

## Features

- **Context Menu Capture**: Select code on any webpage, right-click, and choose **Save to SyntaxMemo**.
- **Automatic Provenance**: Automatically saves the source page URL and page title alongside each captured snippet.
- **Automatic Title Generation**: Derives a clean default title from the first line of code if no title is specified.
- **Multi-Field Search**: Search across snippet titles, code, personal notes, tags, and languages.
- **Language Filtering**: Filter your snippet collection by programming language.
- **Full Library Management**: Create snippets manually, edit existing entries, copy code to the clipboard, and delete snippets with confirmation.
- **Local-First Storage**: All data stays stored locally in your browser.

## Screenshots

*Screenshots of the popup and dashboard will be added here.*

## Installation

SyntaxMemo is currently distributed as an unpacked developer extension.

### 1. Clone or download the repository

```bash
git clone https://github.com/your-username/SyntaxMemo.git
```

Alternatively, download the ZIP archive from GitHub and extract it to a directory on your computer.

### 2. Load the extension in Chrome

1. Open Google Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the project folder (`SyntaxMemo`) containing `manifest.json`.
5. SyntaxMemo will appear in your Chrome toolbar.

## Usage

### Capturing Code from Webpages
1. Highlight any code or text on a webpage.
2. Right-click the selection.
3. Click **Save to SyntaxMemo**.

### Opening the Library
- Click the SyntaxMemo toolbar icon to open the quick-access popup.
- Click **Dashboard** in the popup header to open the full library in a dedicated browser tab.

### Managing Snippets
- **View & Copy**: Click any snippet row in the sidebar to view its details. Click **Copy** in the footer (or double-click the code block) to copy code to your clipboard.
- **Create**: Click **New Snippet** in the dashboard header to add an entry manually.
- **Edit**: Click **Edit** in the detail footer to modify the title, language, code, tags, or notes.
- **Delete**: Click **Delete** in the detail footer and confirm the prompt to remove the snippet.
- **Filter**: Use the search input in the sidebar to search keywords, or click any language filter (`All`, `python`, `javascript`, etc.) to filter by language.

## Technology Stack

- **Chrome Extensions Manifest V3**
- **Vanilla JavaScript (ES Modules)** — Zero frameworks, zero build tools
- **Vanilla HTML5 & CSS3** — Modern CSS variables with system dark and light theme support
- **Chrome APIs**:
  - `chrome.storage.local` for on-disk local persistence
  - `chrome.contextMenus` for webpage text selection capture
  - `chrome.tabs` for opening the dashboard tab

## Privacy and Storage

- **Local Storage Only**: All snippets, notes, and metadata are stored exclusively on your local computer via Chrome's `chrome.storage.local` API.
- **No External Servers**: SyntaxMemo does not communicate with external servers, cloud services, or third-party analytics.
- **No Account Required**: The extension works completely offline without registration, accounts, or telemetry.
