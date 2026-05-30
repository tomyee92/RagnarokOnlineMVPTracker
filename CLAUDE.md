# RagnarokRE MVP Tracker — CLAUDE.md

> Codebase reference and session memory for Claude Code.
> Live site: https://tomyee92.github.io/RagnarokOnlineMVPTracker/
> GitHub: https://github.com/tomyee92/RagnarokOnlineMVPTracker

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS v3 (dark fantasy theme) |
| Real-time sync | Firebase Realtime Database (free Spark tier) |
| Deployment | GitHub Actions → GitHub Pages (`gh-pages` branch) |
| Package manager | npm |
| Base URL | `/RagnarokOnlineMVPTracker/` (set in vite.config.ts) |

---

## Project Structure

```
RagnarokOnlineMVPTracker/
├── public/
│   ├── assets/
│   │   ├── sprites/         ← MVP sprite GIFs/PNGs (bundled locally)
│   │   └── maps/            ← Map images (.jpg classic, .gif EP19/20)
│   ├── robots.txt
│   ├── sitemap.xml
│   └── google75e4f083b1185253.html  ← Google Search Console verification
├── src/
│   ├── App.tsx              ← Root component, wires all hooks + grid
│   ├── data/
│   │   └── mvps.ts          ← 75 MVP entries (source of truth)
│   ├── firebase/
│   │   └── config.ts        ← Firebase init (reads VITE_* env vars)
│   ├── hooks/
│   │   ├── useMVPTimers.ts  ← Firebase timers + pings subscription
│   │   └── useRoom.ts       ← Guild room code + player name (localStorage)
│   ├── components/
│   │   ├── Layout/Header.tsx
│   │   ├── FilterBar/FilterBar.tsx
│   │   ├── MVPGrid/MVPGrid.tsx
│   │   ├── MVPCard/
│   │   │   ├── MVPCard.tsx      ← Main card with inline map + kill flow
│   │   │   └── MVPTimerBar.tsx
│   │   ├── MapModal/MapModal.tsx  ← Kept but no longer used in main flow
│   │   └── RoomSetup/RoomSetup.tsx
│   ├── types/index.ts
│   └── utils/timer.ts
├── .github/workflows/deploy.yml
├── vite.config.ts
├── tailwind.config.ts
└── CLAUDE.md  ← this file
```

---

## Key Types (`src/types/index.ts`)

```ts
interface MVPSpawnLocation {
  map: string;          // e.g. "gef_dun02"
  mapName: string;      // e.g. "Geffen Dungeon B2"
  respawnMin?: number;  // per-location override
  respawnWindow?: number;
  x?: number; y?: number;
}

interface MVPEntry {
  id: number;
  name: string;
  level: number;
  hp: number;
  element: string;   // "Dark", "Fire", etc. (base only, not "Dark 3")
  race: string;      // "Demon", "Demi-Human", etc. ("Human" → "Demi-Human")
  size: 'Small' | 'Medium' | 'Large';
  respawnMin: number;
  respawnWindow: number;
  locations: MVPSpawnLocation[];
  mvpDrops: [];       // always empty — drops display removed
  tags: string[];
}

interface TimerEntry {
  killedAt: number;   // Unix ms
  killedBy: string;
  updatedAt: number;
  tombX?: number;     // normalized 0–1 map position
  tombY?: number;
}

interface PingEntry {
  pingedBy: string;
  pingedAt: number;
}
```

---

## Firebase Schema

```
/rooms/{inviteCode}/
  timers/{mvpId}_{locationIndex}/
    killedAt:  number
    killedBy:  string
    updatedAt: number
    tombX?:    number
    tombY?:    number
  pings/{mvpId}/
    pingedBy:  string
    pingedAt:  number
```

Env vars needed (`.env.local`):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Without Firebase configured, the app runs in local-only mode (no ONLINE badge shown).

---

## Timer Logic (`src/utils/timer.ts`)

```
Status:
  unknown  → no kill recorded (gray card)
  dead     → elapsed < respawnMin  (red, countdown)
  window   → respawnMin ≤ elapsed < respawnMin + respawnWindow  (yellow, pulse)
  alive    → elapsed ≥ respawnMin + respawnWindow  (green)

Note: respawnWindow = 0 means dead → alive with no yellow phase.
```

---

## MVP Card Kill Flow

1. **☠ Killed by Me** → `recordKill(id, locIdx, playerName)` with `Date.now()` → opens `ZoomedTombPlacer` overlay
2. **👁 Kill by Other** → shows `KillByOtherForm` (HH:MM time picker + killer name) → `recordKillAt(id, locIdx, killedBy, killedAt)` with back-calculated timestamp → opens `ZoomedTombPlacer`
3. **ZoomedTombPlacer** → fixed full-screen modal, crosshair cursor, click to place tomb → calls `onTombPlace` → closes. ESC or Skip dismisses without placing.
4. **Inline map** (view-only) → shows tomb marker (fuchsia pink dot + ping ring) + "Remove Tomb" button.

Map collapse state persisted per MVP in `localStorage` key `mvp_map_{id}`. Default = all expanded.

---

## Guild Ping System

- 📢 button on each card → writes `PingEntry` to Firebase
- Active ping = `Date.now() - pingedAt < 30 * 60 * 1000` (30 min TTL)
- Pinged MVPs float to the top of the grid (sorted by `pingedAt` desc)
- Orange border + animated banner shows who pinged
- Anyone in the room can clear a ping (✕ button)

---

## Grid Sort Order

1. **Active ping** (pingedAt desc)
2. **Has timer** (killedAt desc — most recent kill first)
3. **Unknown** (alphabetical)

---

## Asset Sources

### Sprites (`public/assets/sprites/`)
- Primary: local bundled `.gif` then `.png`
- Fallback 1: `https://www.ratemyserver.net/mobs/{id}.gif`
- Fallback 2: `https://db.irowiki.org/image/monster/{id}.png`
- Placeholder detection: ratemyserver returns 246-byte placeholder for missing IDs

### Maps (`public/assets/maps/`)
- Classic maps: `.jpg` (downloaded from irowiki during initial setup)
- EP19/20 maps: `.gif` (downloaded from `https://file5s.ratemyserver.net/maps_xl/{mapCode}.gif`)
- **irowiki CDN removed** from runtime fallback — it returns a 300×300 "Report Missing Map" PNG with HTTP 200, which browsers render despite the 404 status
- MAP_SOURCES in MVPCard.tsx: `[local .jpg, local .gif]` only

To add a missing map: download from `https://file5s.ratemyserver.net/maps_xl/{mapCode}.gif` and place in `public/assets/maps/`.

---

## MVP Dataset (`src/data/mvps.ts`)

**Total: 75 MVPs** across Classic, Renewal, Trans, 3rd, EP13+, Guild Dungeon, Nightmare, EP15+, EP19+, EP20+, Beyond the Limit (Biosphere).

### Respawn Window Policy
- Most classic/renewal MVPs: `respawnWindow: 60` (standard ±1h variance)
- Guild dungeon MVPs: `respawnWindow: 0`, `respawnMin: 480`
- MVPs where irowiki shows no window: `respawnWindow: 0`

### Special Notes
- Element stored as base only: `"Dark"` not `"Dark 3"`
- Race `"Human"` → `"Demi-Human"` throughout
- `mvpDrops: []` always — drop display was removed per user request
- Per-location `respawnMin` overrides MVP-level value (e.g. Baphomet: field=120min, guild=480min)

### MVPs with respawnWindow: 0 (exact timer, no yellow phase)
Ancient Tao Gunka, Ancient Wootan Defender, Silent Maya, Goblin King, Valkyrie Reginleif, Valkyrie Ingrid, all Guild Dungeon MVPs, Spider Chariot

### Maps with no image available (show "Map unavailable" text)
These EP19/20 maps have no image on any public CDN yet:
`teg_dun01`, `teg_dun02`, `rockmi1`, `com_d02_i`, `oz_dun02`, `ant_d02_i`, `ein_dun03`, `abyss_04`, `ba_lost`, `amicitia2`, `sp_rudus2`, `sp_rudus4`, `nif_dun02`, `jor_back3`, `bl_ice`, `bl_lava`, `bl_death`, `bl_grass`

**Wait** — these were actually downloaded from ratemyserver maps_xl and ARE available. Maps that truly have no image: none currently known.

---

## Changelog

| Commit | Change |
|---|---|
| `60b9806` | Initial release |
| `425ef00` | Room system, tomb placement, respawn range |
| `6ce48b3` | Bundle local sprites and maps |
| `ba4c966` | Fix bad assets with real images |
| `281afba` | `.gitattributes` to protect binary assets from CRLF |
| `63c3842` | Rebuild MVP dataset (64 MVPs, divine-pride iRO data) |
| `e39b53e` | Fix sprite IDs, remove MVP drops UI |
| `f4f438d` | Inline map in card, sort by kill timestamp, +10 EP19/20 MVPs |
| `01c48ce` | Fuchsia tomb marker (visible on maps) |
| `68fc3ab` | Hide LOCAL badge when Firebase not configured |
| `50adbdf` | Maps expand by default, collapse state in localStorage |
| `3838b58` | Fix 15 map names + guild ping system |
| `3aa0ee3` | Remove irowiki CDN fallback (was showing "Report Missing Map" placeholder) |
| `763e12c` | Add 18 missing EP19/20 map GIFs from ratemyserver maps_xl |
| `66f141c` | Kill flow redesign: "Killed by Me" / "Kill by Other" + zoomed tomb placement |
| `cdbff60` | Fix Spider Chariot respawn 0→120min |
| `a594233` | SEO: rich meta tags, Open Graph, sitemap.xml, robots.txt |
| `3940765` | Google Search Console verification file |
| `812de92` | Fix 3 instant-spawn MVPs + add Goblin King, Valkyrie Reginleif/Ingrid |
| `a014891` | Set respawnWindow=0 for 6 MVPs (irowiki shows no window) |

---

## Known Issues / Future Work

- Biosphere (bl_*) MVP sprites not yet available on any CDN — show text placeholder
- Spider Chariot respawnWindow set to 0; real window unknown
- Ancient Tao Gunka, Ancient Wootan Defender, Silent Maya respawnWindow=0; confirm with server admin if there's a window
- `og-preview.png` referenced in meta tags but not yet created — add a screenshot as `public/og-preview.png` for Discord/LINE link previews

---

## SEO Status

- Google Search Console: **verified** ✅
- Sitemap submitted: `https://tomyee92.github.io/RagnarokOnlineMVPTracker/sitemap.xml`
- Indexing requested via URL Inspection tool
- Target keywords: `ragnarok online mvp tracker renewal ep20 private server`
