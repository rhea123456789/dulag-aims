const paths: Record<string, string> = {
  farmer: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0',
  users: 'M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12zM3 19a5 5 0 0 1 10 0M13 19a5 5 0 0 1 8 0',
  land: 'M3 18c3.2-5 6.2-5 8.2 0S16.5 23 21 18M3 13c3.2-5 6.2-5 8.2 0M4 21h16',
  bars: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  wallet: 'M3 7h18v12H3zM3 11h18M16 14h3',
  subsidy: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z',
  chart: 'M4 19h16M6 16l4-5 3 3 5-7',
  search: 'M11 18a7 7 0 1 0-7-7 7 7 0 0 0 7 7zM20 20l-3.5-3.5M18 5l.6 1.4L20 7l-1.4.6L18 9l-.6-1.4L16 7l1.4-.6z',
  status: 'M8 3h8v3H8zM6 6h12v15H6zM9 12l2 2 4-4',
  audit: 'M8 3h8v3H8zM6 6h12v15H6zM9 12h6M9 16h4',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  office: 'M4 20V8l8-4 8 4v12M9 20v-5h6v5',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
}

export function ModuleIcon({ name }: { name: keyof typeof paths | string }) {
  const d = paths[name] ?? paths.file
  return (
    <span className="icon-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
