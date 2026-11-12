# @easy-edu/icons

Two-tone brand icons for **Easy Edu**, every one with its own hover motion:

- **solid** — primary-blue body + coral accent, for the main sections (home, wallet, students, settings…)
- **line** — blue strokes + a coral accent on the part that carries the meaning
  (the trash lid, the plus, the check…), for everything else

Every icon the dashboard and the mobile app use is here (plus `…Filled` names for the active states),
for React (web) and React Native — **no third-party icon package needed**. Names match Tabler's, so switching
a project is just the import path.

أيقونات إيزي إديو: جسم أزرق وجزء مرجاني بيتحرّك مع الـhover — للويب والموبايل، من غير أي مكتبة أيقونات تانية.

## Install

```bash
npm i @easy-edu/icons
```

| Platform | Also needs |
|---|---|
| React (web) | — |
| React Native / Expo | `react-native-svg` |

## Use

```tsx
// web — once, in the root layout (hover motion + dark mode)
import '@easy-edu/icons/styles.css';

import { IconHome, IconWallet, IconChevronDown } from '@easy-edu/icons';

<IconHome size={24} />                 // brand icon (blue + coral, animated)
<IconWallet mono className="size-4" /> // one color (currentColor) for quiet places
<IconHomeFilled />                     // active-state names map to the solid icon
```

```tsx
// React Native / Expo
import { IconHome } from '@easy-edu/icons/native';

<IconHome size={26} color={theme.primary} />
```

Icons keep Tabler's names (and the `Icon` / `TablerIcon` / `IconProps` types), so switching is just the import path:
`'@tabler/icons-react'` → `'@easy-edu/icons'`. An icon that isn't here yet fails the build — add it first (below).

### Props (brand icons)

| Prop | Default | |
|---|---|---|
| `size` | `24` | number or CSS length |
| `color` | brand blue | body color |
| `accentColor` | brand coral | accent color |
| `mono` | `false` | single color (`currentColor`), accent at 60% |
| `animate` | `true` | hover motion (web) |
| `title` | — | accessible label (otherwise `aria-hidden`) |

### Theming (web)

```css
.toolbar  { --ee-line: currentColor; }      /* line icons in the text color here (default: brand blue) */
.platform { --ee-brand: #7C3AED; }          /* a teacher's own brand color */
.sidebar  { --ee-icon-accent: #F59E0B; }    /* one area only */
```

`.dark` / `[data-theme="dark"]` lightens the blue automatically.

### Press motion (React Native)

Phones have no hover, so on mobile each icon plays the **same motion on press** (same keyframes, 0.6s, same curve).
Press the icon itself with `play` (a counter — every increase plays once), or let a button / card / tab play every
icon inside it by bumping `IconPress`:

```tsx
import { IconPress } from '@easy-edu/icons/native';

const [presses, setPresses] = useState(0);
<Pressable onPressIn={() => setPresses((n) => n + 1)}>
  <IconPress.Provider value={presses}>
    <IconBell size={22} />  {/* rings when the row is pressed */}
  </IconPress.Provider>
</Pressable>
```

The motion origin (the part's centre, its top for `swing`/`ring`, its bottom for `grow`/`rise`/`hop`) is computed at
build time — React Native SVG has no `transform-box`. `animate={false}` turns it off; "Reduce motion" skips it.
Needs `react-native` (Animated, part of RN) and `react-native-svg`.

### Hover motion

The coral part animates when the pointer is over the icon **or** over the link / button / menu item
that contains it, and on keyboard focus. It is skipped for users who prefer reduced motion.
Add `data-ee-hover` to any other element to make it a trigger.

## Add a new icon / أيقونة جديدة

**Line (from Tabler)** — add a row to `PICKS` in `scripts/import-tabler.mjs` (which parts are coral + the motion),
then `node scripts/import-tabler.mjs IconSomething`.

**Solid (hand-drawn):**

1. Draw it on a **24×24** frame (Figma) using only these fills:
   - `#0568E9` — body (blue)
   - `#F87A60` — accent (coral) — the part that moves
   - `#FFFFFF` — cut-out (becomes transparent; cuts only what is drawn **before** it)
2. Export as **SVG** (Presentation attributes, no outline text) and save it in `icons/`
   named after the Tabler icon it replaces: `receipt-2.svg` → `IconReceipt2`.
3. Optional: pick a motion on the root `<svg data-anim="…">`:
   part: `pop` (default) · `bounce` · `rise` · `drop` · `spin` · `swing` · `twinkle` · `grow` · `nudge` · `nudge-back` ·
   `lift` · `sink` · `scan` · `nudge-up-right` — whole icon: `ring` · `wiggle` · `blink` · `turn` · `beat` · `shake` · `hop` ·
   `flip` · `turn-back` · `turn-90` · `spin-full` · `spin-half` · `twirl` · `go-right|left|up|down|up-right|down-left|down-right`.
4. `npm run build` and open `docs/index.html` to check it.
5. Bump `version` in `package.json`, commit, then tag: `git tag v0.2.0 && git push --tags` — GitHub Actions publishes to npm.

## Release

Publishing runs from GitHub Actions with npm **Trusted Publishing** (no tokens). The very first version
is published by hand (`npm publish`), then the trusted publisher is added on npmjs.com.

## License

MIT © Easy Edu
