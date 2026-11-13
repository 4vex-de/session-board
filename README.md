# Session Board

Author: Marco Hallmeier · License: MIT

![Session Board](assets/icon.png)

A plugin for the Claude Code desktop app. `/session-board` opens a live panel with your sessions of the last 7 days:

- **▶ Running** · **⚠ Needs decision** · **✋ Ready for review** · **✓ Done**
- The counts at the top are filters; click one to show only those sessions, click **All** to show everything.
- Sessions are grouped like your sidebar groups; within a group, what needs you comes first.
- **Open** opens the session in the app. The list refreshes every minute, **↻ Refresh** does it at once.
- Text follows your system language (German or English).

## Install

Session Board is not (yet) listed in the official plugin directory. This repository is its own plugin
marketplace, so you install it straight from here. You need the `claude` command
([Claude Code setup](https://code.claude.com/docs/en/setup)); run the commands in a terminal
(PowerShell, Terminal), one at a time.

### Option 1: from GitHub (recommended)

Claude Code fetches the files itself, nothing to download by hand.

```
claude plugin marketplace add 4vex-de/session-board
```

```
claude plugin install session-board@4vex-de
```

Then start a new session in the desktop app and type `/session-board`.

### Option 2: from a downloaded copy

Use this if you want to look at the files first or cannot reach GitHub from Claude Code.

1. Download [session-board-main.zip](https://github.com/4vex-de/session-board/archive/refs/heads/main.zip)
   (or **Code → Download ZIP** on this page).
2. Unzip it to a folder you keep, for example `Documents\session-board-main`. It contains the folders
   `.claude-plugin`, `hooks`, `types` and `assets`.
3. Add that folder as a marketplace and install (use your own path):

```
claude plugin marketplace add "C:\Users\<you>\Documents\session-board-main"
```

```
claude plugin install session-board@4vex-de
```

Then start a new session in the desktop app and type `/session-board`.

### Update and remove

```
claude plugin marketplace update 4vex-de
```

```
claude plugin update session-board@4vex-de
```

With Option 2, unzip the new download into the same folder first. To remove the plugin:

```
claude plugin uninstall session-board@4vex-de
```

```
claude plugin marketplace remove 4vex-de
```

## Requirements and limits

- Desktop app only: the session list comes from the app's own session tools, which a terminal session does not have.
- Tested on Windows. macOS and Linux are supported in the code but not yet tested.
- The status (needs decision, ready for review, done) is read from the app's local session files. Their format is
  not documented; if it changes, the list shows **● Idle** instead of a status. Running and Open keep working.

## Privacy

Nothing leaves your computer and nothing is stored. Details: [PRIVACY.md](PRIVACY.md).

## Support

Please open an issue: https://github.com/4vex-de/session-board/issues

---

## Deutsch

`/session-board` öffnet eine Live-Liste der Sitzungen der letzten 7 Tage: läuft gerade, braucht Entscheidung,
bitte prüfen, erledigt. Die Zahlen oben filtern, „↻ Aktualisieren“ lädt sofort neu, „Öffnen“ öffnet die Sitzung.

**Installieren** (noch nicht im offiziellen Plugin-Verzeichnis): Dieses Repository ist selbst ein Marketplace.
Im Terminal (PowerShell) nacheinander:

```
claude plugin marketplace add 4vex-de/session-board
```

```
claude plugin install session-board@4vex-de
```

Danach im Desktop-Programm eine neue Sitzung starten und `/session-board` eingeben. Ohne direkten GitHub-Zugriff:
[ZIP herunterladen](https://github.com/4vex-de/session-board/archive/refs/heads/main.zip), in einen bleibenden Ordner
entpacken und statt `4vex-de/session-board` den Ordnerpfad in Anführungszeichen angeben. Aktualisieren, Entfernen:
siehe „Update and remove“ oben.

Lokale Entwicklung: Das Plugin lädt direkt aus diesem Ordner (lokaler Marketplace `4vex-de`). Änderungen wirken nach
`/reload-plugins` oder in einer neuen Sitzung; eine neue Versionsnummer zieht
`claude plugin update session-board@4vex-de` nach. Das Icon erzeugt `werkzeuge/icon-erzeugen.ps1`.
