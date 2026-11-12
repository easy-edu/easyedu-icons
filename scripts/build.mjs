#!/usr/bin/env node
/**
 * يبني المكتبة من ملفات `icons/*.svg` — من غير أي مكتبة خارجية (Node بس).
 *
 *   node scripts/build.mjs        ← dist/ + docs/index.html
 *
 * ── صيغة ملف الأيقونة ─────────────────────────────────────────────────
 * شبكة 24×24، والجزء بيتعرف من لونه بالظبط:
 *   #0568E9  الأزرق الأساسي   (الجسم)
 *   #F87A60  المرجاني         (الجزء المميّز — هو اللي بيتحرّك)
 *   #FFFFFF  فتحة             (بتتقصّ من الشكل — مش بتترسم أبيض)
 * `data-anim` على `<svg>` (اختياري، الافتراضي pop) — القايمة في ANIMS تحت.
 * `data-style="line"` = أيقونة خطوط (من scripts/import-tabler.mjs): الخطوط بالأزرق
 * والمرجاني للجزء المميّز، وسُمك الخط بيتغيّر بـ`stroke` زي Tabler. من غيرها = solid (أزرق مصمت).
 * اسم الملف = اسم أيقونة Tabler اللي بتحلّ محلّها: `receipt-2.svg` ← IconReceipt2.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = join(ROOT, 'icons');
const DIST = join(ROOT, 'dist');
const DOCS = join(ROOT, 'docs');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

export const COLORS = { main: '#0568E9', accent: '#F87A60', knock: '#FFFFFF' };
/** حركات الجزء المرجاني (`.ee-a`) والحركات اللي بتحرّك الأيقونة كلها (`.ee-g`) */
export const ANIMS = {
  part: ['pop', 'bounce', 'rise', 'drop', 'spin', 'swing', 'twinkle', 'grow', 'nudge', 'nudge-back', 'lift', 'sink', 'scan', 'nudge-up-right'],
  whole: ['ring', 'wiggle', 'blink', 'turn', 'beat', 'shake', 'hop', 'flip', 'turn-back', 'turn-90', 'spin-full', 'spin-half', 'twirl',
    'go-right', 'go-left', 'go-up', 'go-down', 'go-up-right', 'go-down-left', 'go-down-right'],
};
const ALL_ANIMS = [...ANIMS.part, ...ANIMS.whole];
const SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline']);
const KEEP = new Set([
  'd', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points',
  'opacity', 'fill-opacity', 'stroke-opacity', 'fill-rule', 'clip-rule', 'transform',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
]);

const fail = (file, msg) => {
  console.error(`✘ ${file}: ${msg}`);
  process.exit(1);
};
const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function tone(file, value) {
  if (value == null || value === 'none') return null;
  const v = value.trim().toUpperCase();
  const hex = v === 'WHITE' ? '#FFFFFF' : v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v;
  if (hex === COLORS.main) return 'M';
  if (hex === COLORS.accent) return 'A';
  if (hex === COLORS.knock) return 'K';
  fail(file, `لون مش من ألوان الهويّة: ${value} — المسموح ${Object.values(COLORS).join(' · ')}`);
}

/** SVG ← قايمة أشكال: [tag, attrs(kebab), fill, stroke] */
function parse(file, src) {
  const root = /<svg\b([^>]*)>/.exec(src);
  if (!root) fail(file, 'مفيش <svg>');
  const vb = /viewBox="([^"]+)"/.exec(root[1]);
  if (vb && vb[1].trim().split(/[\s,]+/).join(' ') !== '0 0 24 24') fail(file, `الـviewBox لازم 0 0 24 24 (لقيت ${vb[1]})`);
  const anim = /data-anim="([^"]+)"/.exec(root[1])?.[1] ?? 'pop';
  const style = /data-style="line"/.test(root[1]) ? 'line' : 'solid';
  if (!ALL_ANIMS.includes(anim)) fail(file, `حركة مش معروفة: ${anim} — المتاح: ${ALL_ANIMS.join(', ')}`);

  const body = src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(defs|clipPath|mask|title|desc|metadata)\b[\s\S]*?<\/\1>/g, '');
  const shapes = [];
  for (const m of body.matchAll(/<([a-zA-Z]+)\b([^>]*?)\/?>/g)) {
    const tag = m[1];
    if (tag === 'svg' || tag === 'g') continue;
    if (!SHAPES.has(tag)) fail(file, `عنصر مش مدعوم: <${tag}> — حوّله لـpath`);
    const attrs = {};
    for (const a of m[2].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    if (attrs.style) fail(file, 'فيه style= — صدّر من Figma بـ"Presentation attributes"');
    const fill = tone(file, attrs.fill ?? (attrs.stroke ? 'none' : COLORS.main));
    const stroke = tone(file, attrs.stroke);
    const kept = Object.fromEntries(Object.entries(attrs).filter(([k]) => KEEP.has(k)));
    // جسم بلون + حدّ بلون تاني (مثلًا أزرق بحدّ أبيض) ← شكلين
    if (fill && stroke && fill !== stroke) {
      shapes.push([tag, withoutStroke(kept), fill, null]);
      shapes.push([tag, kept, null, stroke]);
    } else shapes.push([tag, fill ? kept : kept, fill, stroke]);
  }
  if (!shapes.length) fail(file, 'الأيقونة فاضية');
  const hasAccent = shapes.some((s) => s[2] === 'A' || s[3] === 'A');
  if (!hasAccent && style === 'solid') console.warn(`  ⚠ ${file}: مفيش جزء مرجاني`);
  if (!hasAccent && !ANIMS.whole.includes(anim)) fail(file, `مفيش جزء مرجاني والحركة «${anim}» بتحرّكه هو — اختار حركة للأيقونة كلها: ${ANIMS.whole.join(', ')}`);
  return { anim, style, shapes };
}
const withoutStroke = (a) => Object.fromEntries(Object.entries(a).filter(([k]) => !k.startsWith('stroke')));

/**
 * الشكل المضغوط اللي بيتكتب في dist: { a: حركة, b: شجرة }.
 * الشجرة: شكل = [tag, attrs] · مجموعة مرجانية = { a: [...] } · مجموعة مقصوصة = { k: فتحات, c: [...] }.
 * الفتحة بتقصّ اللي اترسم **قبلها** بس (زي ما الرسّام شايفها): بؤبؤ العين المرسوم بعد
 * فتحتها بيفضل ظاهر جوّاها.
 */
function compact({ anim, style, shapes }) {
  const node = ([tag, attrs, fill, stroke]) => {
    const p = {};
    for (const [k, v] of Object.entries(attrs)) p[camel(k)] = isNaN(+v) || v === '' ? v : +v;
    p.fill = fill ?? 'none';
    if (stroke) p.stroke = stroke;
    return [tag, p];
  };
  let level = [];
  let cuts = [];
  const flush = () => {
    if (cuts.length) level = [{ k: cuts, c: level }];
    cuts = [];
  };
  for (const s of shapes) {
    const part = s[2] ?? s[3];
    if (part === 'K') { cuts.push(node(s)); continue; }
    flush();
    const n = node(s);
    const last = level[level.length - 1];
    if (part === 'A') {
      if (last && last.a) last.a.push(n);
      else level.push({ a: [n] });
    } else level.push(n);
  }
  flush();
  return style === 'line' ? { a: anim, s: 1, b: level } : { a: anim, b: level };
}

/**
 * حدود تقريبية لشكل (لمركز الحركة على الموبايل): الويب عنده `transform-box: fill-box`
 * والموبايل لأ، فالمركز بيتحسب هنا مرّة. الـpath بنقطه ونقط التحكّم (حدود أوسع شوية —
 * المركز هو اللي يهمّ)، والقوس ببدايته ونهايته ومنتصفهم ± نصف القطر.
 */
function bounds(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } };
  for (const [tag, a] of list) {
    const n = (k) => +(a[k] ?? 0);
    if (tag === 'rect') { add(n('x'), n('y')); add(n('x') + n('width'), n('y') + n('height')); }
    else if (tag === 'circle') { add(n('cx') - n('r'), n('cy') - n('r')); add(n('cx') + n('r'), n('cy') + n('r')); }
    else if (tag === 'ellipse') { add(n('cx') - n('rx'), n('cy') - n('ry')); add(n('cx') + n('rx'), n('cy') + n('ry')); }
    else if (tag === 'line') { add(n('x1'), n('y1')); add(n('x2'), n('y2')); }
    else if (tag === 'polygon' || tag === 'polyline') { const v = (a.points ?? '').trim().split(/[\s,]+/).map(Number); for (let i = 0; i + 1 < v.length; i += 2) add(v[i], v[i + 1]); }
    else if (tag === 'path') {
      const tokens = (a.d ?? '').match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? [];
      let i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0;
      const num = () => +tokens[i++];
      const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
      while (i < tokens.length) {
        if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
        const lower = cmd.toLowerCase();
        const rel = cmd !== cmd.toUpperCase();
        if (lower === 'z') { cx = sx; cy = sy; continue; }
        if (i + ARGS[lower] > tokens.length || /[a-zA-Z]/.test(tokens[i] ?? 'x')) { if (!ARGS[lower]) continue; break; }
        const bx = rel ? cx : 0, by = rel ? cy : 0;
        if (lower === 'h') { cx = bx + num(); add(cx, cy); continue; }
        if (lower === 'v') { cy = by + num(); add(cx, cy); continue; }
        if (lower === 'a') {
          // القوس: البداية والنهاية، ومنتصفهم ± نصف القطر (الانتفاخ في أي ناحية)
          const rx = num(), ry = num(); i += 3; const px = cx, py = cy; cx = bx + num(); cy = by + num();
          const mx = (px + cx) / 2, my = (py + cy) / 2;
          add(px, py); add(cx, cy);
          if (Math.abs(cx - px) >= Math.abs(cy - py)) { add(mx, my - ry); add(mx, my + ry); } else { add(mx - rx, my); add(mx + rx, my); }
          continue;
        }
        const pts = ARGS[lower] / 2;
        for (let k = 0; k < pts; k++) { const px = bx + num(), py = by + num(); add(px, py); if (k === pts - 1) { cx = px; cy = py; } }
        if (lower === 'm') { sx = cx; sy = cy; cmd = rel ? 'l' : 'L'; }
      }
    }
  }
  return Number.isFinite(x0) ? [x0, y0, x1, y1] : [2, 2, 22, 22];
}

/** نقطة الحركة: مركز الجزء (أو الأيقونة)، أو تحته/فوقه للحركات اللي ليها نقطة ثابتة — زي styles.css */
function origin({ anim, shapes }) {
  const whole = ANIMS.whole.includes(anim);
  const list = shapes.filter((s) => (whole ? (s[2] ?? s[3]) !== 'K' : s[2] === 'A' || s[3] === 'A')).map(([t, a]) => [t, a]);
  const [x0, y0, x1, y1] = bounds(list);
  const cx = (x0 + x1) / 2;
  const at = ['grow', 'rise', 'hop'].includes(anim) ? y1 : ['swing', 'ring'].includes(anim) ? y0 : (y0 + y1) / 2;
  return [+cx.toFixed(2), +at.toFixed(2)];
}

// ── القراءة ──────────────────────────────────────────────────────────────
const files = readdirSync(ICONS).filter((f) => f.endsWith('.svg')).sort();
const icons = files.map((f) => {
  const slug = f.slice(0, -4);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(f, 'اسم الملف لازم kebab-case زي receipt-2.svg');
  const raw = readFileSync(join(ICONS, f), 'utf8');
  const parsed = parse(f, raw);
  return { slug, name: `Icon${pascal(slug)}`, parsed, data: { ...compact(parsed), o: origin(parsed) } };
});

// أسماء الملفات ثابتة — الكتابة فوقها بتكفي (من غير مسح)
mkdirSync(DIST, { recursive: true });
mkdirSync(DOCS, { recursive: true });

// ── الكود المشترك ────────────────────────────────────────────────────────
const dataJs = icons.map((i) => `const ${i.name}Data = ${JSON.stringify({ n: i.name, ...i.data })};`).join('\n');
const names = JSON.stringify(icons.map((i) => i.name));

const webFactory = `
const MAIN = 'var(--ee-icon-main, var(--ee-brand, ${COLORS.main}))';
const LINE = 'var(--ee-icon-main, var(--ee-line, var(--ee-brand, ${COLORS.main})))';
const ACCENT = 'var(--ee-icon-accent, var(--ee-brand-accent, ${COLORS.accent}))';
const WHOLE = ${JSON.stringify(ANIMS.whole)};
function createIcon(data) {
  const main = data.s ? LINE : MAIN;
  const paint = (v) => (v === 'M' ? main : v === 'A' ? ACCENT : v === 'K' ? '#000' : v);
  const shape = ([tag, attrs], key) => {
    const p = { key };
    for (const k in attrs) p[k] = k === 'fill' || k === 'stroke' ? paint(attrs[k]) : attrs[k];
    return h(tag, p);
  };
  const Icon = forwardRef(function EasyEduIcon(props, ref) {
    const { size = 24, color, accentColor, mono = false, animate = true, title, className, style,
      stroke = 2, strokeWidth, ...rest } = props;
    const uid = 'ee' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
    let masks = 0;
    const tree = (items) => items.map((n, i) => {
      if (Array.isArray(n)) return shape(n, i);
      if (n.a) return h('g', { key: i, className: 'ee-a' }, n.a.map(shape));
      const id = uid + 'm' + masks++;
      return h('g', { key: i, mask: 'url(#' + id + ')' },
        h('mask', { id, maskUnits: 'userSpaceOnUse', x: -4, y: -4, width: 32, height: 32 },
          h('rect', { x: -4, y: -4, width: 32, height: 32, fill: '#fff' }), n.k.map(shape)),
        tree(n.c));
    });
    const vars = {};
    if (mono) { vars['--ee-icon-main'] = 'currentColor'; vars['--ee-icon-accent'] = 'currentColor'; }
    if (color) vars['--ee-icon-main'] = color;
    if (accentColor) vars['--ee-icon-accent'] = accentColor;
    return h('svg', {
      ref, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      className: className ? 'ee-icon ' + className : 'ee-icon',
      style: style ? Object.assign(vars, style) : vars,
      'data-anim': animate ? data.a : undefined,
      'data-anim-scope': animate ? (WHOLE.includes(data.a) ? 'whole' : 'part') : undefined,
      'data-mono': mono ? '' : undefined,
      'data-style': data.s ? 'line' : undefined,
      strokeWidth: data.s ? strokeWidth ?? stroke : undefined,
      strokeLinecap: data.s ? 'round' : undefined,
      strokeLinejoin: data.s ? 'round' : undefined,
      role: title ? 'img' : undefined, 'aria-hidden': title ? undefined : true,
      ...rest,
    },
      title ? h('title', null, title) : null,
      h('g', { className: 'ee-g' }, tree(data.b)),
    );
  });
  Icon.displayName = data.n;
  return Icon;
}`;

const nativeFactory = `
const TAGS = { path: Path, rect: Rect, circle: Circle, ellipse: Ellipse, line: Line, polygon: Polygon, polyline: Polyline };
const MAIN = '${COLORS.main}';
const ACCENT = '${COLORS.accent}';
const WHOLE = ${JSON.stringify(ANIMS.whole)};
/*
 * حركات الويب نفسها (styles.css) كإطارات: [وقت ٠–١, { x, y, r (درجة), s, sx, sy, o }].
 * أي قناة مش مكتوبة في إطار = وضعها الطبيعي (زي transform في CSS)، والبداية والنهاية
 * طبيعيين إلا لو اتكتبوا.
 */
const MOTIONS = {
  pop: [[0.4, { s: 1.28 }]],
  bounce: [[0.3, { y: -3 }], [0.55, { y: 0.5 }], [0.75, { y: -1 }]],
  rise: [[0.4, { y: -1.5, sy: 1.12 }]],
  drop: [[0, { y: -3, o: 0.4 }], [0.6, { y: 0.6 }]],
  spin: [[1, { r: 180 }]],
  swing: [[0.25, { r: 16 }], [0.55, { r: -10 }], [0.8, { r: 4 }]],
  twinkle: [[0.4, { s: 1.3, r: 25 }]],
  grow: [[0, { sy: 0.45 }], [0.6, { sy: 1.12 }]],
  nudge: [[0.4, { x: 2.5 }]],
  'nudge-back': [[0.4, { x: -2.5 }]],
  lift: [[0.4, { y: -2.5 }]],
  sink: [[0.4, { y: 2.5 }]],
  scan: [[0.3, { y: -5 }], [0.7, { y: 5 }]],
  'nudge-up-right': [[0.4, { x: 2.5, y: -2.5 }]],
  ring: [[0.15, { r: 14 }], [0.35, { r: -12 }], [0.55, { r: 7 }], [0.75, { r: -3 }]],
  wiggle: [[0.25, { r: -9 }], [0.55, { r: 7 }], [0.8, { r: -2 }]],
  blink: [[0.45, { sy: 0.12 }]],
  turn: [[0.5, { r: 40 }]],
  beat: [[0.35, { s: 1.16 }], [0.65, { s: 0.96 }]],
  shake: [[0.2, { x: -1.5 }], [0.4, { x: 1.5 }], [0.6, { x: -1 }], [0.8, { x: 1 }]],
  hop: [[0.35, { y: -3, sy: 1.04 }], [0.6, { sy: 0.94 }], [0.8, { y: -0.8 }]],
  flip: [[0.25, { sx: 0 }], [0.5, { sx: -1 }], [0.75, { sx: 0 }]],
  'turn-back': [[1, { r: -360 }]],
  'turn-90': [[1, { r: 90 }]],
  'spin-full': [[1, { r: 360 }]],
  'spin-half': [[1, { r: 180 }]],
  twirl: [[0.45, { r: 60, s: 1.18 }], [1, { r: 72 }]],
  'go-right': [[0.4, { x: 3 }]],
  'go-left': [[0.4, { x: -3 }]],
  'go-up': [[0.4, { y: -3 }]],
  'go-down': [[0.4, { y: 3 }]],
  'go-up-right': [[0.4, { x: 2.5, y: -2.5 }]],
  'go-down-left': [[0.4, { x: -2.5, y: 2.5 }]],
  'go-down-right': [[0.4, { x: 2.5, y: 2.5 }]],
};
const REST = { x: 0, y: 0, r: 0, s: 1, sx: 1, sy: 1, o: 1 };
// نفس منحنى الويب: cubic-bezier(0.34, 1.4, 0.64, 1) — على كل جزء بين إطارين زي CSS
const CURVE = Easing.bezier(0.34, 1.4, 0.64, 1);
const AG = Animated.createAnimatedComponent(G);

/**
 * الموبايل مالوش hover: الحركة مع الضغط — على الأيقونة نفسها («play») أو على الزرار
 * أو الكارت اللي هي جوّاه، بعدّاد في «IconPress» بيزيد مع كل ضغطة.
 */
const IconPress = createContext(0);

let reduceMotion = false;
try {
  AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion = v; }).catch(() => {});
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => { reduceMotion = v; });
} catch (e) {}

function motionProps(progress, data) {
  const frames = MOTIONS[data.a] ?? MOTIONS.pop;
  const times = [0, ...frames.map((f) => f[0]).filter((t) => t > 0 && t < 1), 1];
  const at = (t) => { const f = frames.find((x) => x[0] === t); return f ? { ...REST, ...f[1] } : REST; };
  const channel = (k) => {
    const out = times.map((t) => at(t)[k]);
    return out.every((v) => v === REST[k]) ? null : progress.interpolate({ inputRange: times, outputRange: out, easing: CURVE });
  };
  const s = channel('s');
  const sx = channel('sx');
  const sy = channel('sy');
  const props = { originX: data.o ? data.o[0] : 12, originY: data.o ? data.o[1] : 12 };
  const x = channel('x');
  const y = channel('y');
  const r = channel('r');
  const o = channel('o');
  if (x) props.translateX = x;
  if (y) props.translateY = y;
  if (r) props.rotation = r;
  if (o) props.opacity = o;
  if (s || sx) props.scaleX = s && sx ? Animated.multiply(s, sx) : s ?? sx;
  if (s || sy) props.scaleY = s && sy ? Animated.multiply(s, sy) : s ?? sy;
  return props;
}

function createIcon(data) {
  const whole = WHOLE.includes(data.a);
  const Icon = forwardRef(function EasyEduIcon(props, ref) {
    const { size = 24, color = MAIN, accentColor, mono = false, animate = true, play = 0, stroke = 2, strokeWidth, ...rest } = props;
    const uid = 'ee' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const accent = mono ? color : accentColor ?? ACCENT;
    const pressed = useContext(IconPress);
    const progress = useRef(null);
    if (!progress.current) progress.current = new Animated.Value(0);
    const motion = useRef(null);
    if (animate && !motion.current) motion.current = motionProps(progress.current, data);
    const trigger = pressed + play;
    const last = useRef(trigger);
    useEffect(() => {
      if (trigger === last.current) return;
      last.current = trigger;
      if (!animate || reduceMotion) return;
      progress.current.stopAnimation();
      progress.current.setValue(0);
      Animated.timing(progress.current, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: false })
        .start(() => progress.current.setValue(0));
    }, [trigger, animate]);

    const paint = (v, cut) => (v === 'M' ? color : v === 'A' ? accent : v === 'K' ? (cut ? '#000' : 'none') : v);
    const shape = ([tag, attrs], key) => {
      const p = { key };
      for (const k in attrs) p[k] = k === 'fill' || k === 'stroke' ? paint(attrs[k], true) : attrs[k];
      return h(TAGS[tag], p);
    };
    const defs = [];
    const tree = (items) => items.map((n, i) => {
      if (Array.isArray(n)) return shape(n, i);
      if (n.a) {
        const moving = animate && !whole && motion.current;
        return h(moving ? AG : G, { key: i, opacity: mono ? 0.6 : 1, ...(moving ? motion.current : null) }, n.a.map(shape));
      }
      const id = uid + 'm' + defs.length;
      defs.push(h(Mask, { key: id, id, maskUnits: 'userSpaceOnUse', x: -4, y: -4, width: 32, height: 32 },
        h(Rect, { x: -4, y: -4, width: 32, height: 32, fill: '#fff' }), n.k.map(shape)));
      return h(G, { key: i, mask: 'url(#' + id + ')' }, tree(n.c));
    });
    const body = tree(data.b);
    const line = data.s ? { strokeWidth: strokeWidth ?? stroke, strokeLinecap: 'round', strokeLinejoin: 'round' } : null;
    const movingWhole = animate && whole && motion.current;
    return h(Svg, { ref, width: size, height: size, viewBox: '0 0 24 24', fill: 'none', ...line, ...rest },
      defs.length ? h(Defs, null, defs) : null,
      h(movingWhole ? AG : G, movingWhole ? motion.current : null, body),
    );
  });
  Icon.displayName = data.n;
  return Icon;
}`;

// أسماء بديلة (icons/aliases.json): نسخ Filled اللي مشاريعنا بتستخدمها = الـsolid بتاعنا نفسه
const known = new Set(icons.map((i) => i.name));
const aliases = Object.entries(JSON.parse(readFileSync(join(ICONS, 'aliases.json'), 'utf8'))).filter(([k]) => k !== '_');
for (const [alias, target] of aliases) {
  if (!known.has(target)) fail('aliases.json', `${alias} ← ${target}: الأيقونة دي مش موجودة`);
  if (known.has(alias)) fail('aliases.json', `${alias} موجودة كملف — امسح السطر من aliases.json`);
}
const allNames = JSON.stringify([...icons.map((i) => i.name), ...aliases.map(([a]) => a)]);
const exportsList = icons.map((i) => `${i.name} = /*#__PURE__*/ createIcon(${i.name}Data)`);
const esmAliases = aliases.map(([a, t]) => `export const ${a} = ${t};`).join('\n');
const cjsAliases = aliases.map(([a, t]) => `exports.${a} = exports.${t};`).join('\n');
const banner = `/** ${pkg.name} v${pkg.version} — مولَّد من icons/*.svg بـscripts/build.mjs، متعدّلش هنا */\n`;

// ── الويب ────────────────────────────────────────────────────────────────
writeFileSync(join(DIST, 'index.mjs'), `${banner}import { createElement as h, forwardRef, useId } from 'react';
${webFactory}
${dataJs}
export const ${exportsList.join(',\n  ')};
${esmAliases}
export const brandIconNames = ${allNames};
export { createIcon };
`);
writeFileSync(join(DIST, 'index.cjs'), `${banner}'use strict';
const { createElement: h, forwardRef, useId } = require('react');
${webFactory}
${dataJs}
${icons.map((i) => `exports.${i.name} = createIcon(${i.name}Data);`).join('\n')}
${cjsAliases}
exports.brandIconNames = ${allNames};
exports.createIcon = createIcon;
`);

// ── الموبايل ─────────────────────────────────────────────────────────────
const svgImports = 'Svg, { Circle, Defs, Ellipse, G, Line, Mask, Path, Polygon, Polyline, Rect }';
writeFileSync(join(DIST, 'native.mjs'), `${banner}import { createContext, createElement as h, forwardRef, useContext, useEffect, useId, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import ${svgImports} from 'react-native-svg';
${nativeFactory}
${dataJs}
export const ${exportsList.join(',\n  ')};
${esmAliases}
export const brandIconNames = ${allNames};
export { IconPress };
`);
writeFileSync(join(DIST, 'native.cjs'), `${banner}'use strict';
const { createContext, createElement: h, forwardRef, useContext, useEffect, useId, useRef } = require('react');
const { AccessibilityInfo, Animated, Easing } = require('react-native');
const svg = require('react-native-svg');
const Svg = svg.default ?? svg.Svg;
const { Circle, Defs, Ellipse, G, Line, Mask, Path, Polygon, Polyline, Rect } = svg;
${nativeFactory}
${dataJs}
${icons.map((i) => `exports.${i.name} = createIcon(${i.name}Data);`).join('\n')}
${cjsAliases}
exports.brandIconNames = ${allNames};
exports.IconPress = IconPress;
`);

// ── الأنواع (مستقلة — من غير Tabler) ────────────────────────────────────
const extras = `  /** المقاس بالبكسل أو أي طول CSS — الافتراضي 24 */
  size?: number | string;
  /** لون الجسم — الافتراضي الأزرق (أو \`--ee-icon-main\`) */
  color?: string;
  /** لون الجزء المميّز — الافتراضي المرجاني (أو \`--ee-icon-accent\`) */
  accentColor?: string;
  /** لون واحد (currentColor) — للأماكن الهادية زي القوايم الرمادي */
  mono?: boolean;
  /** سُمك الخط لأيقونات line — الافتراضي 2 */
  stroke?: number | string;
  /** وصف للقارئ الصوتي (من غيره الأيقونة مخفية عنه) */
  title?: string;`;
const declare = [...icons.map((i) => i.name), ...aliases.map(([a]) => a)].map((n) => `export declare const ${n}: Icon;`).join('\n');
writeFileSync(join(DIST, 'index.d.ts'), `${banner}import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'stroke'> {
${extras}
  /** حركة الـhover (الافتراضي true) */
  animate?: boolean;
}
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
/** نفس أسماء Tabler عشان التحويل يبقى تغيير سطر الـimport بس */
export type TablerIcon = Icon;
export type BrandIcon = Icon;
export type BrandIconProps = IconProps;
${declare}
export declare const brandIconNames: readonly string[];
export declare function createIcon(data: unknown): Icon;
`);
writeFileSync(join(DIST, 'native.d.ts'), `${banner}import type { Context, ForwardRefExoticComponent } from 'react';
import type { SvgProps } from 'react-native-svg';
export interface IconProps extends Omit<SvgProps, 'stroke'> {
${extras}
  strokeWidth?: number | string;
  /** الحركة مع الضغط (الافتراضي true) — نفس حركة الـhover في الويب */
  animate?: boolean;
  /** عدّاد: كل زيادة = الحركة تشتغل مرّة (للضغط على الأيقونة نفسها) */
  play?: number;
}
export type Icon = ForwardRefExoticComponent<IconProps>;
export type TablerIcon = Icon;
export type BrandIcon = Icon;
export type BrandIconProps = IconProps;
${declare}
export declare const brandIconNames: readonly string[];
/**
 * عدّاد ضغطات للأيقونات اللي جوّه: الزرار أو الكارت بيزوّده مع «onPressIn»
 * فكل أيقونة جوّاه بتعمل حركتها — زي الـhover على الزرار في الويب.
 */
export declare const IconPress: Context<number>;
`);
copyFileSync(join(ROOT, 'src', 'styles.css'), join(DIST, 'styles.css'));

// ── صفحة العرض ───────────────────────────────────────────────────────────
const toSvg = ({ slug, data }) => {
  const kebabPaint = {
    M: data.s ? 'var(--ee-icon-main, var(--ee-line, var(--ee-brand, #0568E9)))' : 'var(--ee-icon-main, var(--ee-brand, #0568E9))',
    A: 'var(--ee-icon-accent, var(--ee-brand-accent, #F87A60))',
    K: '#000',
  };
  const attrs = ([tag, p]) => `<${tag} ${Object.entries(p)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${k === 'fill' || k === 'stroke' ? kebabPaint[v] ?? v : v}"`)
    .join(' ')}/>`;
  let masks = 0;
  const tree = (items) => items.map((n) => {
    if (Array.isArray(n)) return attrs(n);
    if (n.a) return `<g class="ee-a">${n.a.map(attrs).join('')}</g>`;
    const id = `ee-${slug}-m${masks++}`;
    return `<g mask="url(#${id})"><mask id="${id}" maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32"><rect x="-4" y="-4" width="32" height="32" fill="#fff"/>${n.k.map(attrs).join('')}</mask>${tree(n.c)}</g>`;
  }).join('');
  const scope = ANIMS.whole.includes(data.a) ? 'whole' : 'part';
  return `<svg class="ee-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" data-anim="${data.a}" data-anim-scope="${scope}"${data.s ? ' data-style="line" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' : ''}><g class="ee-g">${tree(data.b)}</g></svg>`;
};
const template = readFileSync(join(ROOT, 'src', 'docs.html'), 'utf8');
const cards = icons
  .sort((x, y) => (x.data.s ? 1 : 0) - (y.data.s ? 1 : 0) || x.name.localeCompare(y.name))
  .map((i) => `<button class="card" data-name="${i.name}" data-slug="${i.slug}" data-anim-name="${i.data.a}" data-style="${i.data.s ? 'line' : 'solid'}">${toSvg(i)}<span>${i.name}</span><small>${i.data.s ? 'line' : 'solid'} · ${i.data.a}</small></button>`)
  .join('\n');
writeFileSync(
  join(DOCS, 'index.html'),
  template
    .replace('/*STYLES*/', readFileSync(join(ROOT, 'src', 'styles.css'), 'utf8'))
    .replace('<!--CARDS-->', cards)
    .replaceAll('{{VERSION}}', pkg.version)
    .replaceAll('{{COUNT}}', String(icons.length + aliases.length))
    .replaceAll('{{SOLID}}', String(icons.filter((i) => !i.data.s).length))
    .replaceAll('{{LINE}}', String(icons.filter((i) => i.data.s).length)),
);

console.log(`✔ ${icons.length} أيقونة + ${aliases.length} اسم Filled ← dist/ (ويب + موبايل) و docs/index.html`);
