import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Sitzung, Stand } from '../types'

const PANE = 'session-board'
const SERVER = 'ccd_session_mgmt'
const DAY = 24 * 3600 * 1000
const WEEK = 7 * DAY

const stand = atom({ plugin: 'session-board', key: 'stand' } as const, { at: 0, error: '', sessions: [] } as Stand, {
  shape: 'stand-3',
})

const filter = atom({ plugin: 'session-board', key: 'filter' } as const, 'alle', { shape: 'filter-1' })

const TEXTE = {
  de: {
    titel: 'Sitzungen live',
    befehl: 'Live-Liste der Sitzungen (läuft, wartet, erledigt)',
    stand: (z: string) => 'Stand ' + z + ' · letzte 7 Tage · erneuert sich jede Minute',
    lade: 'Lade …',
    fehler: 'Fehler: ',
    alle: 'Alle',
    run: 'Läuft gerade',
    blocked: 'Braucht Entscheidung',
    review: 'Bitte prüfen',
    done: 'Erledigt',
    idle: 'Steht',
    oeffnen: 'Öffnen',
    aktualisieren: '↻ Aktualisieren',
    aktualisiert: 'Aktualisiert',
    befehlFehlt: 'Bitte /session-board eingeben',
    leer: 'Keine Sitzung in dieser Auswahl.',
    ohneGruppe: 'Ohne Gruppe',
    offen: (n: number) => ' · ' + n + ' aktiv/offen',
    oeffnenFehler: 'Öffnen fehlgeschlagen: ',
    geoeffnet: 'Live-Liste geöffnet.',
    nichtGezeichnet: 'Nicht gezeichnet: ',
    keineAntwort: 'keine Antwort',
  },
  en: {
    titel: 'Sessions live',
    befehl: 'Live list of sessions (running, waiting, done)',
    stand: (z: string) => 'As of ' + z + ' · last 7 days · refreshes every minute',
    lade: 'Loading …',
    fehler: 'Error: ',
    alle: 'All',
    run: 'Running',
    blocked: 'Needs decision',
    review: 'Ready for review',
    done: 'Done',
    idle: 'Idle',
    oeffnen: 'Open',
    aktualisieren: '↻ Refresh',
    aktualisiert: 'Refreshed',
    befehlFehlt: 'Please run /session-board',
    leer: 'No session in this view.',
    ohneGruppe: 'No group',
    offen: (n: number) => ' · ' + n + ' active/open',
    oeffnenFehler: 'Could not open: ',
    geoeffnet: 'Live list opened.',
    nichtGezeichnet: 'Not drawn: ',
    keineAntwort: 'no answer',
  },
}

type Sprache = keyof typeof TEXTE
type Umgebung = { system: 'windows' | 'mac' | 'linux'; basen: string[]; sprache: Sprache }

type Roh = {
  sessionId: string
  title: string
  isRunning?: boolean
  lastActivityAt: string
  group?: { name: string } | null
  link?: string
}

function zeit(ms: number, sprache: Sprache): string {
  const d = new Date(ms)
  const zwei = (n: number) => String(n).padStart(2, '0')
  const uhr = zwei(d.getHours()) + ':' + zwei(d.getMinutes())
  return sprache === 'de'
    ? zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '. ' + uhr
    : zwei(d.getMonth() + 1) + '/' + zwei(d.getDate()) + ' ' + uhr
}

function feld(text: string, name: string): string {
  const m = new RegExp('"' + name + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(text)
  if (!m) return ''
  try {
    return JSON.parse('"' + m[1] + '"') as string
  } catch {
    return m[1]
  }
}

function spracheAus(kennung: string): Sprache {
  return kennung.trim().toLowerCase().startsWith('de') ? 'de' : 'en'
}

let timer: { cancel: () => void } | undefined
let pfade: Record<string, string> = {}
let wurzeln: string[] | undefined
let umgebung: Umgebung | undefined
let laden: (() => Promise<void>) | undefined

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'session-board',
      description: TEXTE.de.befehl + ' / ' + TEXTE.en.befehl,
    })

    return next(e)
  })

  on('command.run', { command: 'session-board' }, async $ => {
    const umgebungErmitteln = async (): Promise<Umgebung> => {
      try {
        const r = await $.process.run(['cmd.exe', '/d', '/c', 'echo %LOCALAPPDATA%'])
        const pfad = r.stdout.trim()
        if (r.exitCode === 0 && pfad !== '' && !pfad.includes('%')) {
          let sprache: Sprache = 'de'
          try {
            const reg = await $.process.run(['reg', 'query', 'HKCU\\Control Panel\\International', '/v', 'LocaleName'])
            const m = /LocaleName\s+REG_SZ\s+(\S+)/.exec(reg.stdout)
            if (m) sprache = spracheAus(m[1])
          } catch {
            // Sprache bleibt Deutsch
          }
          return { system: 'windows', basen: [pfad.replace(/\\/g, '/') + '/Claude-Data'], sprache }
        }
      } catch {
        // kein Windows
      }
      const r = await $.process.run(['sh', '-c', 'printf "%s|%s|%s" "$(uname)" "$HOME" "${LC_ALL:-${LANG:-}}"'])
      const [name, home, lang] = r.stdout.split('|')
      if (name.trim() === 'Darwin') {
        let sprache = spracheAus(lang ?? '')
        try {
          const loc = await $.process.run(['defaults', 'read', '-g', 'AppleLocale'])
          if (loc.exitCode === 0) sprache = spracheAus(loc.stdout)
        } catch {
          // Sprache aus LANG
        }
        return {
          system: 'mac',
          basen: [home + '/Library/Application Support/Claude', home + '/Library/Application Support/Claude-Data'],
          sprache,
        }
      }
      return { system: 'linux', basen: [home + '/.config/Claude', home + '/.config/Claude-Data'], sprache: spracheAus(lang ?? '') }
    }

    umgebung ??= await umgebungErmitteln()
    const t = TEXTE[umgebung.sprache]
    const opened = await $.ui.open({ id: PANE, title: t.titel })

    // Interne Ablage der Desktop-App, kein dokumentiertes Format: fehlt sie oder ein Feld, gilt der Status als unbekannt.
    const wurzelnFinden = async (basen: string[]): Promise<string[]> => {
      const gefunden: string[] = []
      for (const basis of basen) {
        if (!(await $.fs.exists(basis))) continue
        if (await $.fs.exists(basis + '/claude-code-sessions')) gefunden.push(basis + '/claude-code-sessions')
        for (const a of await $.fs.list(basis)) {
          const kandidat = basis + '/' + a.name + '/claude-code-sessions'
          if (a.kind === 'dir' && (await $.fs.exists(kandidat))) gefunden.push(kandidat)
        }
      }
      return gefunden
    }

    const indexieren = async () => {
      try {
        wurzeln ??= await wurzelnFinden(umgebung?.basen ?? [])
        const map: Record<string, string> = {}
        for (const root of wurzeln) {
          for (const a of await $.fs.list(root)) {
            if (a.kind !== 'dir') continue
            for (const b of await $.fs.list(root + '/' + a.name)) {
              if (b.kind !== 'dir') continue
              const ordner = root + '/' + a.name + '/' + b.name
              for (const f of await $.fs.list(ordner)) {
                if (f.kind === 'file' && f.name.endsWith('.json')) map[f.name.slice(0, -5)] = ordner + '/' + f.name
              }
            }
          }
        }
        pfade = map
      } catch {
        pfade = {}
      }
    }

    const statusLesen = async (id: string) => {
      const pfad = pfade[id]
      if (!pfad) return { status: '', hint: '' }
      try {
        const text = await $.fs.read(pfad)
        return { status: feld(text, 'status_category'), hint: feld(text, 'needs_action') }
      } catch {
        return { status: '', hint: '' }
      }
    }

    const load = async () => {
      try {
        const res = await $.mcp.call(SERVER, 'list_sessions', { limit: 60 })
        const block = res.content.find(b => b.type === 'text') as { text?: string } | undefined
        if (res.isError || !block?.text) {
          throw new Error(block?.text ?? t.keineAntwort)
        }
        const list = JSON.parse(block.text) as Roh[]
        await indexieren()
        const now = await $.clock.now()
        const sessions: Sitzung[] = []
        for (const s of list) {
          if (now - Date.parse(s.lastActivityAt) >= WEEK) continue
          const st = await statusLesen(s.sessionId)
          sessions.push({
            id: s.sessionId,
            title: s.title,
            group: s.group?.name ?? '',
            running: !!s.isRunning,
            last: s.lastActivityAt,
            link: s.link ?? 'claude://claude.ai/epitaxy/' + s.sessionId,
            status: st.status,
            hint: st.hint,
          })
        }
        await update($, stand, () => ({ at: now, error: '', sessions }))
      } catch (err) {
        await update($, stand, old => ({ ...old, error: String(err) }))
      }
    }

    laden = load
    await load()
    timer?.cancel()
    timer = $.clock.every(60000, () => {
      void load()
    })

    return { text: opened.isPlaced ? t.geoeffnet : t.nichtGezeichnet + opened.reason }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const s = await read($, stand)
    const gewaehlt = await read($, filter)
    const sprache: Sprache = umgebung?.sprache ?? 'de'
    const t = TEXTE[sprache]

    const art = (x: Sitzung) =>
      x.running
        ? 'run'
        : x.status === 'blocked'
          ? 'blocked'
          : x.status === 'review_ready'
            ? 'review'
            : x.status === 'completed'
              ? 'done'
              : 'idle'
    const ART = {
      run: { icon: '▶', color: 'success', rang: 0 },
      blocked: { icon: '⚠', color: 'warning', rang: 1 },
      review: { icon: '✋', color: 'suggestion', rang: 2 },
      done: { icon: '✓', color: 'inactive', rang: 3 },
      idle: { icon: '●', color: 'inactive', rang: 4 },
    } as const
    const zahl = (k: keyof typeof ART) => s.sessions.filter(x => art(x) === k).length

    const waehlen = (k: string) => {
      void update($, filter, alt => (alt === k ? 'alle' : k))
    }

    const oeffnen = async (link: string) => {
      const system = umgebung?.system ?? 'windows'
      const argv =
        system === 'windows'
          ? ['rundll32', 'url.dll,FileProtocolHandler', link]
          : system === 'mac'
            ? ['open', link]
            : ['xdg-open', link]
      try {
        const r = await $.process.run(argv)
        if (r.exitCode !== 0) $.ui.toast(t.oeffnenFehler + r.stderr)
      } catch (err) {
        $.ui.toast(t.oeffnenFehler + String(err))
      }
    }

    const kachel = (k: keyof typeof ART) => (
      <Button key={'filter-' + k} variant={gewaehlt === k ? 'primary' : undefined} onPress={() => waehlen(k)}>
        <Text bold color={ART[k].color}>
          {ART[k].icon} {zahl(k)}
        </Text>
        <Text> {t[k]}</Text>
      </Button>
    )

    const zeile = (x: Sitzung) => {
      const a = ART[art(x)]
      return (
        <Box key={x.id} flexDirection="column">
          <Box flexDirection="row" gap={1}>
            <Button key={'oeffnen-' + x.id} label={t.oeffnen} onPress={() => oeffnen(x.link)} />
            <Text color={a.color}>{a.icon}</Text>
            <Text>{x.title}</Text>
            <Text dimColor>{zeit(Date.parse(x.last), sprache)}</Text>
          </Box>
          {x.hint !== '' && <Text dimColor>      → {x.hint.slice(0, 160)}</Text>}
        </Box>
      )
    }

    const sichtbar = gewaehlt === 'alle' ? s.sessions : s.sessions.filter(x => art(x) === gewaehlt)
    const gruppen: Record<string, Sitzung[]> = {}
    for (const x of sichtbar) (gruppen[x.group] ??= []).push(x)
    const namen = Object.keys(gruppen).sort((a, b) =>
      a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, sprache),
    )

    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>{s.at ? t.stand(zeit(s.at, sprache)) : t.lade}</Text>
        {s.error !== '' && (
          <Text color="error">
            {t.fehler}
            {s.error}
          </Text>
        )}
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Button key="filter-alle" variant={gewaehlt === 'alle' ? 'primary' : undefined} onPress={() => waehlen('alle')}>
            {t.alle} {s.sessions.length}
          </Button>
          {kachel('run')}
          {kachel('blocked')}
          {kachel('review')}
          {kachel('done')}
          <Button
            key="aktualisieren"
            label={t.aktualisieren}
            onPress={async () => {
              if (!laden) {
                $.ui.toast(t.befehlFehlt)
                return
              }
              await laden()
              $.ui.toast(t.aktualisiert)
            }}
          />
        </Box>
        {sichtbar.length === 0 && <Text dimColor>{t.leer}</Text>}
        {namen.map(n => {
          const liste = [...gruppen[n]].sort(
            (a, b) => ART[art(a)].rang - ART[art(b)].rang || Date.parse(b.last) - Date.parse(a.last),
          )
          const offen = liste.filter(x => ['run', 'blocked', 'review'].includes(art(x))).length
          return (
            <Box key={'gruppe-' + n} flexDirection="column">
              <Text bold>
                {n === '' ? t.ohneGruppe : n} ({liste.length}){offen > 0 ? t.offen(offen) : ''}
              </Text>
              {liste.map(zeile)}
            </Box>
          )
        })}
      </Box>
    )
  })
}
