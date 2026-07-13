# PixelOS

A pixel-meets-glass WebOS built for Hack Club Stardance. Pure HTML, CSS, and JavaScript — zero dependencies, no build step.

## Apps

| App | Description |
|-----|-------------|
| **Lo-Fi Cafe** | Direct audio streams from SomaFM + YouTube/Spotify embed |
| **Glass Diary** | Handwriting-font notepad with lined-paper styling, auto-saves to VFS as `~/Diary/YYYY-MM-DD.txt`, built-in calendar to browse entries by date |
| **Pixel Editor** | 16×16 pixel art canvas with pen/eraser/flood fill, save/load `.pxl` files to VFS, PNG export |
| **Nexus Browser** | Wikipedia API viewer — search and read articles in-app |
| **Calculator** | Basic arithmetic + scientific mode |
| **File Explorer** | Browse the virtual filesystem, open `.txt` files in Notepad, delete/rename |
| **Snake** | Classic snake game with high-score tracking + notification |
| **Timer** | Stopwatch + countdown with custom hr:min:sec inputs, lap recording |
| **Notepad** | VFS-integrated text editor with Save As dialog (browse directories, overwrite protection) |
| **Terminal** | Unix-style shell (`ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `echo`, `neofetch`) |

## System Features

- **Virtual Filesystem** — persistent localStorage-based filesystem shared across all apps (File Explorer, Notepad, Terminal, Diary, Pixel Editor)
- **Notification System** — toast notifications with bell icon in top bar, badge counter, dropdown history
- **Window Manager** — drag, resize, minimize, z-index stacking
- **Top Bar** — Start menu, running-app taskbar (click to focus), notification bell, theme toggle, clock with blinking colon
- **Dock** — bottom app launcher with pixel-art sprites
- **Start Menu** — launch any app from the Start button
- **Day/Night Theme** — toggle with accent color, glass blur, particle effects, pixel rain
- **Customizable Settings** — accent color, effects toggle, glass blur intensity
- **Desktop Widgets** — analog clock + live calendar
- **Responsive** — mobile-friendly layout

## Usage

Open `index.html` in any browser. No build step, no install.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GurnoorLog/PixelOS)
