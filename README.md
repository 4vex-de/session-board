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

At the prompt of a terminal session:

```
/plugin install session-board --marketplace 4vex-de/session-board
```

From a shell:

```
claude plugin install session-board --marketplace 4vex-de/session-board
```

In the desktop app: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with
`4vex-de/session-board`, then **Add plugin**. Start a new session and type `/session-board`.

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

Lokale Entwicklung: Das Plugin lädt direkt aus diesem Ordner (lokaler Marketplace `4vex-de`). Änderungen wirken nach
`/reload-plugins` oder in einer neuen Sitzung; eine neue Versionsnummer zieht
`claude plugin update session-board@4vex-de` nach. Das Icon erzeugt `werkzeuge/icon-erzeugen.ps1`.
