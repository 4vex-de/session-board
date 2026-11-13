export type Sitzung = {
  id: string
  title: string
  group: string
  running: boolean
  last: string
  link: string
  status: string
  hint: string
  bg: number
}

export type Stand = { at: number; error: string; sessions: Sitzung[] }

declare module 'claude-code' {
  interface PluginState {
    'session-board': { stand: Shaped<Stand>; filter: Shaped<string> }
  }
}
