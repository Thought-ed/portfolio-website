## hi  
nothing much here  
its a webpage for my roblox portfolio  
and this is the repo for it  
cool

## cursor intro controls
- toggle the automated desktop pointer sequence via the `CURSOR_INTRO_ENABLED` flag near the top of `script.js`.
- set `RECORD_CURSOR_PATH` to `true` when you want to capture a new path; move your real mouse around and call `downloadCursorPath()` in the console to grab the JSON.
- drop the exported JSON into `cursor-path.json` (already tracked) — the script will fetch and normalize it automatically, falling back to the inline path if the file is missing.
- append `?cursorPreview=1` to the URL (or run locally) to reveal the “Preview cursor” button; click it anytime to see the scripted pointer path without replaying the whole intro.
