#!/usr/bin/env node
/**
 * أداة تطوير (مش جزء من المكتبة): بتعمل ملفات `icons/*.svg` بستايل «line» من أيقونات Tabler —
 * الخطوط بالأزرق، والجزء اللي ليه معنى بالمرجاني، وحركة مناسبة لكل أيقونة — مفيش أيقونة من غير مرجاني.
 *
 *   node scripts/import-tabler.mjs IconTrash IconSearch      ← أيقونات بعينها
 *   node scripts/import-tabler.mjs --all                     ← كل اللي في PICKS
 *
 * بتقرا رسم Tabler من `@tabler/icons-react` المتسطّب (في المشروع أو أي مشروع جنبه):
 *   TABLER_DIR=../easyedu-dashboard/node_modules/@tabler/icons-react node scripts/import-tabler.mjs --all
 * أو من JSON جاهز:  TABLER_JSON=.tmp/tabler-used.json
 *
 * الأيقونات المرسومة يدوي (ستايل solid) مابتتلمسش — الملف لو موجود ومش line بيتخطّى.
 * أيقونة جديدة: ضيف سطر في PICKS — [أرقام الأجزاء المرجانية، الحركة] — وشغّل الأداة.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN = '#0568E9';
const ACCENT = '#F87A60';

/**
 * [الأجزاء المرجانية (ترتيبها في رسم Tabler)، الحركة]
 * الحركة: حركات الجزء (pop bounce rise drop spin swing twinkle grow nudge nudge-back lift sink scan nudge-up-right)
 *         أو الأيقونة كلها (beat shake hop flip wiggle ring blink turn turn-back turn-90 spin-full spin-half twirl
 *         go-right go-left go-up go-down go-up-right go-down-left go-down-right)
 */
export const PICKS = {
  IconAdjustments: [[3], 'bounce'],
  IconAdjustmentsHorizontal: [[3], 'nudge'],
  IconAffiliate: [[5], 'pop'],
  IconAlertCircle: [[1, 2], 'bounce'],
  IconAlertTriangle: [[0, 2], 'bounce'],
  IconApps: [[3, 4], 'spin'],
  IconArrowBackUp: [[0], 'go-left'],
  IconArrowBigDown: [[], 'go-down'],
  IconArrowBigUp: [[], 'go-up'],
  IconArrowDown: [[1, 2], 'go-down'],
  IconArrowDownLeft: [[1], 'go-down-left'],
  IconArrowDownRight: [[1], 'go-down-right'],
  IconArrowForwardUp: [[0], 'go-right'],
  IconArrowLeft: [[1, 2], 'go-left'],
  IconArrowRight: [[1, 2], 'go-right'],
  IconArrowUp: [[1, 2], 'go-up'],
  IconArrowUpRight: [[1], 'go-up-right'],
  IconArrowsDiagonal: [[0, 1], 'beat'],
  IconArrowsDiagonalMinimize2: [[0, 1], 'beat'],
  IconArrowsMaximize: [[0, 1, 4, 5], 'beat'],
  IconArrowsMinimize: [[0, 1, 4, 5], 'beat'],
  IconArrowsMove: [[0, 1, 2, 3], 'beat'],
  IconArrowsShuffle: [[1, 3], 'wiggle'],
  IconArrowsSort: [[1], 'bounce'],
  IconArrowsUpDown: [[2, 3], 'bounce'],
  IconAtom: [[0], 'spin-full'],
  IconAward: [[1, 2], 'wiggle'],
  IconBackpack: [[2], 'bounce'],
  IconBadge: [[], 'beat'],
  IconBan: [[1], 'spin'],
  IconBarbell: [[1, 5], 'go-up'],
  IconBellOff: [[2], 'ring'],
  IconBellRinging: [[2, 3], 'ring'],
  IconBlockquote: [[4, 5], 'pop'],
  IconBold: [[1], 'beat'],
  IconBolt: [[], 'beat'],
  IconBook2: [[2], 'drop'],
  IconBooks: [[4, 5, 6], 'rise'],
  IconBrandFacebook: [[], 'beat'],
  IconBrandGoogle: [[], 'beat'],
  IconBrandInstagram: [[2], 'pop'],
  IconBrandLinkedin: [[1], 'pop'],
  IconBrandTiktok: [[], 'beat'],
  IconBrandWhatsapp: [[1], 'wiggle'],
  IconBrandX: [[1], 'beat'],
  IconBrandYoutube: [[1], 'pop'],
  IconBrandZoom: [[0], 'pop'],
  IconBriefcase: [[2], 'pop'],
  IconBrowser: [[0, 2], 'pop'],
  IconBuildingBank: [[2], 'bounce'],
  IconBuildingSkyscraper: [[3, 4, 5, 6], 'pop'],
  IconBulb: [[0], 'twinkle'],
  IconCalculator: [[1], 'pop'],
  IconCalendar: [[4, 5], 'pop'],
  IconCalendarDue: [[4], 'pop'],
  IconCalendarOff: [[4], 'spin'],
  IconCalendarPlus: [[4, 5], 'spin'],
  IconCalendarTime: [[1, 5], 'pop'],
  IconCamera: [[1], 'pop'],
  IconCash: [[2], 'pop'],
  IconCashOff: [[3], 'spin'],
  IconCertificate: [[0, 1], 'swing'],
  IconChartAreaLine: [[1], 'grow'],
  IconCheck: [[], 'beat'],
  IconChecks: [[1], 'pop'],
  IconChevronDown: [[], 'go-down'],
  IconChevronLeft: [[], 'go-left'],
  IconChevronRight: [[], 'go-right'],
  IconCircleCheck: [[1], 'pop'],
  IconCircleDashed: [[0, 2, 4, 6], 'spin-full'],
  IconCircleX: [[1], 'spin'],
  IconClick: [[0, 1, 2, 3, 4], 'pop'],
  IconClipboardCheck: [[2], 'pop'],
  IconClipboardList: [[2, 4], 'pop'],
  IconClock: [[1], 'pop'],
  IconClockHour4: [[1, 2], 'pop'],
  IconClockPlus: [[1, 2], 'spin'],
  IconCloudOff: [[1], 'spin'],
  IconCloudUpload: [[1, 2], 'lift'],
  IconCode: [[2], 'pop'],
  IconCoin: [[1, 2], 'flip'],
  IconCoins: [[0, 1], 'bounce'],
  IconCompass: [[0], 'spin'],
  IconConfetti: [[0, 1, 2, 3, 4, 5, 6, 7, 8], 'twinkle'],
  IconContrast2: [[1], 'pop'],
  IconCopy: [[1], 'pop'],
  IconCopyPlus: [[2, 3], 'spin'],
  IconCornerDownLeft: [[], 'go-left'],
  IconCpu: [[1], 'pop'],
  IconCreditCard: [[2, 3], 'nudge'],
  IconCurrencyDollar: [[1], 'flip'],
  IconDeviceDesktop: [[1, 2, 3], 'bounce'],
  IconDeviceFloppy: [[1], 'pop'],
  IconDeviceMobile: [[2], 'shake'],
  IconDeviceTablet: [[1], 'pop'],
  IconDevices: [[0, 2], 'pop'],
  IconDiscount: [[0, 1, 2], 'twinkle'],
  IconDna: [[0], 'wiggle'],
  IconDots: [[1], 'bounce'],
  IconDotsVertical: [[0], 'bounce'],
  IconDownload: [[1, 2], 'sink'],
  IconEdit: [[1, 2], 'swing'],
  IconExternalLink: [[1, 2], 'nudge-up-right'],
  IconEyeOff: [[2], 'spin'],
  IconFaceId: [[4, 5, 6], 'pop'],
  IconFile: [[0], 'pop'],
  IconFileDescription: [[2, 3], 'pop'],
  IconFileSpreadsheet: [[2, 3, 4], 'pop'],
  IconFileText: [[2, 3, 4], 'pop'],
  IconFileTypePdf: [[2, 3, 4, 5], 'pop'],
  IconFilter: [[], 'go-down'],
  IconFingerprint: [[1, 2], 'pop'],
  IconFlag: [[0], 'wiggle'],
  IconFlagCheck: [[2], 'pop'],
  IconFlame: [[], 'beat'],
  IconFlask: [[1], 'wiggle'],
  IconFolder: [[], 'beat'],
  IconFolderPlus: [[1, 2], 'spin'],
  IconFolders: [[0], 'lift'],
  IconGripVertical: [[1, 4], 'beat'],
  IconHandClick: [[4, 5, 6, 7], 'twinkle'],
  IconHash: [[2, 3], 'pop'],
  IconHeading: [[0], 'pop'],
  IconHeadset: [[2, 3], 'pop'],
  IconHeart: [[], 'beat'],
  IconHeartbeat: [[1], 'beat'],
  IconHelpCircle: [[1, 2], 'bounce'],
  IconHistory: [[0], 'turn-back'],
  IconHourglass: [[0, 1], 'spin-half'],
  IconHourglassEmpty: [[0], 'spin-half'],
  IconHourglassHigh: [[0], 'spin-half'],
  IconId: [[1], 'pop'],
  IconInfinity: [[], 'beat'],
  IconItalic: [[2], 'pop'],
  IconKey: [[1], 'turn'],
  IconLanguage: [[3, 4], 'pop'],
  IconLanguageHiragana: [[3, 4], 'pop'],
  IconLayoutDashboard: [[3], 'pop'],
  IconLayoutList: [[1], 'lift'],
  IconLayoutSidebar: [[1], 'nudge'],
  IconLibrary: [[2, 3, 4], 'pop'],
  IconLibraryPhoto: [[2, 3, 4], 'pop'],
  IconLink: [[0], 'pop'],
  IconLinkOff: [[2], 'spin'],
  IconList: [[3, 4, 5], 'pop'],
  IconListCheck: [[0, 1, 2], 'pop'],
  IconListDetails: [[4, 5], 'pop'],
  IconListNumbers: [[3, 4], 'pop'],
  IconLoader2: [[], 'spin-full'],
  IconLock: [[1], 'shake'],
  IconLockOpen: [[2], 'lift'],
  IconMail: [[1], 'pop'],
  IconMailCheck: [[2], 'pop'],
  IconMailForward: [[2, 3], 'nudge'],
  IconMailOff: [[2], 'spin'],
  IconMailOpened: [[0], 'lift'],
  IconMailPlus: [[1, 2], 'spin'],
  IconMapPin: [[0], 'hop'],
  IconMenu2: [[1], 'nudge'],
  IconMessage: [[0, 1], 'pop'],
  IconMessage2: [[0, 1], 'pop'],
  IconMessageCircle: [[], 'wiggle'],
  IconMessageCircleExclamation: [[1, 2], 'bounce'],
  IconMessageCircleQuestion: [[1, 2], 'bounce'],
  IconMessagePlus: [[3, 4], 'spin'],
  IconMessageStar: [[3], 'twinkle'],
  IconMessages: [[1], 'pop'],
  IconMicrophone: [[1], 'pop'],
  IconMinus: [[], 'beat'],
  IconMoodSmile: [[3], 'wiggle'],
  IconMoon: [[], 'wiggle'],
  IconMoonStars: [[1, 2], 'twinkle'],
  IconMusic: [[0, 1], 'bounce'],
  IconNotes: [[1, 2, 3], 'pop'],
  IconPackage: [[4], 'pop'],
  IconPencil: [[1], 'wiggle'],
  IconPencilCheck: [[2], 'pop'],
  IconPercentage: [[0, 1], 'pop'],
  IconPhone: [[], 'shake'],
  IconPhoto: [[0], 'twinkle'],
  IconPhotoSearch: [[2, 3], 'pop'],
  IconPhotoUp: [[4, 5], 'lift'],
  IconPilcrow: [[2], 'pop'],
  IconPin: [[1], 'wiggle'],
  IconPlant2: [[1, 2], 'rise'],
  IconPlayerPause: [[1], 'beat'],
  IconPlayerPlay: [[], 'beat'],
  IconPlayerSkipForward: [[1], 'nudge'],
  IconPlayerStop: [[], 'beat'],
  IconPlugConnected: [[4, 5], 'pop'],
  IconPlus: [[1], 'turn-90'],
  IconPresentation: [[4], 'grow'],
  IconPrinter: [[2], 'sink'],
  IconQrcode: [[1, 3, 5], 'pop'],
  IconReceipt: [[], 'hop'],
  IconReceiptOff: [[5], 'spin'],
  IconRefresh: [[1], 'spin-full'],
  IconRepeat: [[1], 'beat'],
  IconReportAnalytics: [[2, 3, 4], 'grow'],
  IconRestore: [[2], 'turn-back'],
  IconRobot: [[7, 8], 'wiggle'],
  IconRocket: [[2], 'go-up-right'],
  IconRosetteDiscountCheck: [[1], 'pop'],
  IconRotateClockwise: [[], 'spin-full'],
  IconScale: [[3, 4], 'wiggle'],
  IconScan: [[0], 'scan'],
  IconSearch: [[1], 'wiggle'],
  IconSearchOff: [[1], 'spin'],
  IconSeedling: [[0, 1], 'rise'],
  IconSend: [[0], 'go-up-right'],
  IconSeparator: [[0, 2], 'pop'],
  IconShare: [[1, 2], 'pop'],
  IconShare3: [[], 'go-right'],
  IconShieldCheck: [[1], 'pop'],
  IconShieldExclamation: [[1, 2], 'bounce'],
  IconShieldLock: [[1, 2], 'bounce'],
  IconShoppingCart: [[0, 1], 'go-right'],
  IconShoppingCartOff: [[4], 'spin'],
  IconShoppingCartX: [[3, 4], 'spin'],
  IconSitemap: [[2], 'bounce'],
  IconSpeakerphone: [[0], 'pop'],
  IconStack2: [[0], 'lift'],
  IconStar: [[], 'twirl'],
  IconSun: [[1], 'twinkle'],
  IconTag: [[0], 'wiggle'],
  IconTarget: [[0], 'pop'],
  IconTargetArrow: [[3, 4], 'pop'],
  IconToggleRight: [[0], 'nudge'],
  IconTrash: [[0, 4], 'lift'],
  IconTrendingDown: [[1], 'go-down-right'],
  IconTrendingUp: [[1], 'go-up-right'],
  IconTrophy: [[4, 5], 'hop'],
  IconTypography: [[2], 'pop'],
  IconUnlink: [[0, 4, 5, 6], 'twinkle'],
  IconUpload: [[1, 2], 'lift'],
  IconUser: [[0], 'bounce'],
  IconUserCheck: [[2], 'pop'],
  IconUserCircle: [[1], 'bounce'],
  IconUserEdit: [[2], 'swing'],
  IconUserHeart: [[2], 'pop'],
  IconUserOff: [[2], 'spin'],
  IconUserQuestion: [[2, 3], 'bounce'],
  IconUserSearch: [[2, 3], 'pop'],
  IconUserX: [[2, 3], 'spin'],
  IconUsersGroup: [[0, 1], 'rise'],
  IconVideo: [[0], 'nudge'],
  IconVolume: [[0, 1], 'pop'],
  IconVolumeOff: [[3], 'spin'],
  IconWaveSine: [[], 'wiggle'],
  IconWifiOff: [[4], 'spin'],
  IconWorld: [[1, 2], 'turn'],
  IconWorldPlus: [[5, 6], 'spin'],
  IconWorldWww: [[6, 7, 8], 'pop'],
  IconZoomIn: [[1, 2], 'spin'],
};

/**
 * أيقونات خط واحد (الصح، الأسهم الصغيرة، القلب…) مفيهاش جزء تلوّنه — هنا رسمها مقسوم:
 * M = أزرق · A = مرجاني · T = ظل مرجاني خفيف جوّه الشكل (بيترسم تحت الخط).
 * الأرقام من رسم Tabler نفسه، متقسّم عند نقطة في نصّه.
 */
const T = (d) => [d, 'T'];
export const CUSTOM = {
  IconCheck: [['M5 12l5 5', 'A'], ['M10 17l10 -10', 'M']],
  IconChevronDown: [['M6 9l6 6', 'M'], ['M12 15l6 -6', 'A']],
  IconChevronLeft: [['M15 6l-6 6', 'M'], ['M9 12l6 6', 'A']],
  IconChevronRight: [['M9 6l6 6', 'M'], ['M15 12l-6 6', 'A']],
  IconCornerDownLeft: [['M18 6v6a3 3 0 0 1 -3 3h-10', 'M'], ['M9 11l-4 4l4 4', 'A']],
  IconMinus: [['M5 12h7', 'M'], ['M12 12h7', 'A']],
  IconInfinity: [
    ['M9.828 9.172a4 4 0 1 0 0 5.656a10 10 0 0 0 2.172 -2.828a10 10 0 0 1 2.172 -2.828', 'M'],
    ['M14.172 9.172a4 4 0 1 1 0 5.656a10 10 0 0 1 -2.172 -2.828a10 10 0 0 0 -2.172 -2.828', 'A'],
  ],
  IconRotateClockwise: [['M4.05 11a8 8 0 1 1 .5 4', 'M'], ['M4.05 20v-5h5', 'A']],
  IconLoader2: [['M12 3a9 9 0 0 0 0 18', 'M'], ['M12 21a9 9 0 0 0 9 -9', 'A']],
  IconWaveSine: [
    ['M21 12h-2c-.894 0 -1.662 -.857 -1.761 -2c-.296 -3.45 -.749 -6 -2.749 -6s-2.5 3.582 -2.5 8', 'M'],
    ['M11.99 12c0 4.418 -.5 8 -2.5 8s-2.452 -2.547 -2.749 -6c-.1 -1.147 -.867 -2 -1.763 -2h-2', 'A'],
  ],
  IconReceipt: [
    ['M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2', 'M'],
    ['M9 7h6m-6 4h6', 'M'],
    ['M13 15h2', 'A'],
  ],
  IconMessageCircle: [
    ['M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1', 'M'],
    ['M8 12h.01m3.99 0h.01m3.99 0h.01', 'A'],
  ],
  IconPhone: [
    ['M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2', 'M'],
    ['M15 3a6 6 0 0 1 6 6m-6 -2a2 2 0 0 1 2 2', 'A'],
  ],
  IconMoon: [
    ['M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008', 'M'],
    ['M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2', 'A'],
  ],
};
// الأشكال المقفولة: ظلّ مرجاني خفيف جوّه + الخط الأزرق
for (const name of ['IconArrowBigDown', 'IconArrowBigUp', 'IconBadge', 'IconBolt', 'IconFlame', 'IconHeart', 'IconStar',
  'IconPlayerPlay', 'IconPlayerStop', 'IconFolder', 'IconFilter', 'IconShare3', 'IconBrandFacebook', 'IconBrandGoogle', 'IconBrandTiktok']) {
  CUSTOM[name] = 'tint';
}

// ── Solid: جسم Tabler المصمت (Filled) بالأزرق + المرجاني ─────────────────────
/** خطوط ورموز — مالهاش شكل مصمت يتقري، فبتفضل line (أزرق + مرجاني) */
const LINE_ONLY = new Set(['IconCheck', 'IconChevronDown', 'IconChevronRight', 'IconPlus', 'IconList', 'IconListCheck',
  'IconListDetails', 'IconMenu2', 'IconDots', 'IconDotsVertical', 'IconLink', 'IconDownload', 'IconExternalLink', 'IconClick',
  'IconWorld', 'IconBrandFacebook', 'IconBrandGoogle', 'IconBrandTiktok', 'IconBrandX', 'IconArrowBigDown', 'IconArrowBigUp',
  'IconBadge', 'IconFilter', 'IconPlayerPlay', 'IconPlayerStop', 'IconChartAreaLine', 'IconConfetti', 'IconLayoutSidebar']);

/** الشكل المصمت فيه كذا قطعة — الأرقام دي (من ترتيب رسم Filled) هي اللي بتتلوّن مرجاني */
const FILLED_ACCENT = {
  IconTrash: [1], IconUser: [0], IconMail: [1], IconFile: [1], IconFileText: [1], IconFileDescription: [1],
  IconBellRinging: [0, 1], IconCalendar: [1], IconSun: [0, 1, 2, 3, 4, 5, 6, 7], IconBulb: [0, 1, 2, 3, 4],
  IconVideo: [0], IconToggleRight: [0], IconEdit: [1], IconCopy: [1], IconMessages: [0], IconLibrary: [1],
  IconSitemap: [2], IconApps: [3], IconAward: [0, 1], IconAdjustments: [1], IconBarbell: [0, 1], IconLayoutList: [1],
  IconPlayerPause: [1], IconPlayerSkipForward: [1], IconMailOpened: [3],
};

/** أيقونة = شكل مصمت لأيقونة تانية + الإضافة المرجاني من رسمها هي (✓ · ✕ · + · الشَرطة…) */
const BASE = {
  IconBellOff: ['IconBell', null], IconCalendarDue: ['IconCalendar', [0]], IconCalendarOff: ['IconCalendar', [0]],
  IconCalendarPlus: ['IconCalendar', [0]], IconCalendarTime: ['IconCalendar', [0]], IconClockPlus: ['IconClock', null],
  IconCloudOff: ['IconCloud', null], IconCloudUpload: ['IconCloud', null], IconEyeOff: ['IconEye', null],
  IconFlagCheck: ['IconFlag', null], IconFolderPlus: ['IconFolder', null], IconMailCheck: ['IconMail', null],
  IconMailForward: ['IconMail', null], IconMailOff: ['IconMail', null], IconMailPlus: ['IconMail', null],
  IconMessageCircleExclamation: ['IconMessageCircle', null], IconMessageCircleQuestion: ['IconMessageCircle', null],
  IconMessagePlus: ['IconMessage', null], IconMessageStar: ['IconMessage', null], IconPencilCheck: ['IconPencil', null],
  IconPhotoSearch: ['IconPhoto', null], IconPhotoUp: ['IconPhoto', null], IconReceiptOff: ['IconReceipt', null],
  IconSearchOff: ['IconSearch', null], IconShieldExclamation: ['IconShield', null], IconShoppingCartOff: ['IconShoppingCart', null],
  IconShoppingCartX: ['IconShoppingCart', null], IconUserCheck: ['IconUser', null], IconUserEdit: ['IconUser', null],
  IconUserHeart: ['IconUser', null], IconUserOff: ['IconUser', null], IconUserQuestion: ['IconUser', null],
  IconUserSearch: ['IconUser', null], IconUserX: ['IconUser', null], IconHourglassHigh: ['IconHourglass', null],
  IconFileSpreadsheet: ['IconFile', null], IconFileTypePdf: ['IconFile', null], IconLibraryPhoto: ['IconLibrary', null],
};

/**
 * أيقونات مصمتة مالهاش جزء يتلوّن في رسمها — إضافة صغيرة مرسومة هنا:
 * [d, 'A' خط مرجاني | 'AF' شكل مرجاني مصمت | 'K' فتحة]
 */
const SOLID_EXTRA = {
  IconHeart: [['M16.5 8.2m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0', 'AF']],
  IconStar: [['M12 12.6m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0', 'AF']],
  IconBolt: [['M19.6 4.4m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0', 'AF']],
  IconFlame: [['M12 16.4m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0', 'AF']],
  IconFolder: [['M13.5 13h4', 'A']],
  IconReceipt: [['M9 7h6m-6 4h6', 'K'], ['M13 15h2', 'A']],
  IconMessageCircle: [['M8 12h.01m3.99 0h.01m3.99 0h.01', 'A']],
  IconPhone: [['M15 3a6 6 0 0 1 6 6m-6 -2a2 2 0 0 1 2 2', 'A']],
  IconMoon: [['M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2', 'AF']],
  IconShare3: [['M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7', 'K']],
};

function loadFilled(name) {
  if (process.env.TABLER_FILLED_JSON) {
    return JSON.parse(readFileSync(process.env.TABLER_FILLED_JSON, 'utf8'))[name] ?? null;
  }
  const dirs = [process.env.TABLER_DIR, join(ROOT, 'node_modules/@tabler/icons-react'), join(ROOT, '../easyedu-dashboard/node_modules/@tabler/icons-react')].filter(Boolean);
  for (const dir of dirs) {
    const file = join(dir, 'dist/esm/icons', `${name}Filled.mjs`);
    if (!existsSync(file)) continue;
    const nodes = /const __iconNode = (\[.*?\]);\n/s.exec(readFileSync(file, 'utf8'));
    return JSON.parse(nodes[1]).map(([t, a]) => { const { key, ...r } = a; return [t, r]; });
  }
  return null;
}

const STROKE = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const CUT = 'stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

/** الشكل المصمت لو ينفع — وإلا null (تفضل line) */
function solidBody(name) {
  if (LINE_ONLY.has(name)) return null;
  const [accent] = PICKS[name];
  const outline = loadNodes(name).nodes;
  let body;
  let overlay = [];
  const own = loadFilled(name);
  if (own && FILLED_ACCENT[name]) {
    body = own.map(([t, a], i) => [t, a, FILLED_ACCENT[name].includes(i) ? 'A' : 'M']);
  } else if (own) {
    body = own.map(([t, a]) => [t, a, 'M']);
    overlay = SOLID_EXTRA[name] ?? accent.map((i) => [outline[i][1].d, 'A', outline[i][1]]);
  } else if (BASE[name]) {
    const [baseName, keep] = BASE[name];
    const base = loadFilled(baseName);
    if (!base) return null;
    body = base.filter((_, i) => !keep || keep.includes(i)).map(([t, a]) => [t, a, 'M']);
    overlay = accent.map((i) => [outline[i][1].d, 'A', outline[i][1]]);
  } else return null;
  if (!overlay.length && !body.some((b) => b[2] === 'A')) return null;

  const attrs = (a) => Object.entries(a).filter(([k]) => k !== 'fill' && k !== 'stroke').map(([k, v]) => attr(k, v)).join('');
  const lines = body.map(([t, a, part]) => `  <${t}${attrs(a)} fill="${part === 'A' ? ACCENT : MAIN}"/>`);
  // الفتحات الأول (بتقصّ الجسم بس)، وبعدها الإضافات المرجاني فوقها
  for (const [d, part] of overlay) {
    if (part !== 'AF') lines.push(`  <path d="${d}" stroke="#FFFFFF" fill="none" ${part === 'K' ? STROKE : CUT}/>`);
    else lines.push(`  <path d="${d}" stroke="#FFFFFF" fill="none" stroke-width="3"/>`);
  }
  for (const [d, part, a] of overlay) {
    if (part === 'K') continue;
    const dotFill = a?.fill === 'currentColor';
    lines.push(part === 'AF'
      ? `  <path d="${d}" fill="${ACCENT}"/>`
      : `  <path d="${d}" stroke="${ACCENT}" fill="${dotFill ? ACCENT : 'none'}" ${STROKE}/>`);
  }
  return lines.join('\n');
}

const slugOf = (name) =>
  name.slice(4).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])([0-9])/g, '$1-$2').toLowerCase();

function loadNodes(name) {
  if (process.env.TABLER_JSON) {
    const all = JSON.parse(readFileSync(process.env.TABLER_JSON, 'utf8'));
    if (!all[name]) throw new Error(`${name} مش في ${process.env.TABLER_JSON}`);
    return { slug: all[name].slug, nodes: all[name].nodes };
  }
  const dirs = [process.env.TABLER_DIR, join(ROOT, 'node_modules/@tabler/icons-react'), join(ROOT, '../easyedu-dashboard/node_modules/@tabler/icons-react')].filter(Boolean);
  for (const dir of dirs) {
    const file = join(dir, 'dist/esm/icons', `${name}.mjs`);
    if (!existsSync(file)) continue;
    const src = readFileSync(file, 'utf8');
    const nodes = /const __iconNode = (\[.*?\]);\n/s.exec(src);
    const slug = /createReactComponent\("\w+", "([^"]+)"/.exec(src);
    return { slug: slug[1], nodes: JSON.parse(nodes[1]).map(([t, a]) => { const { key, ...r } = a; return [t, r]; }) };
  }
  throw new Error(`مش لاقي ${name} — سطّب @tabler/icons-react أو حدّد TABLER_DIR`);
}

const attr = (k, v) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;

function toSvg(name) {
  const [accent, anim] = PICKS[name];
  const { slug, nodes } = loadNodes(name);
  const solid = solidBody(name);
  if (solid) {
    return {
      slug,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" data-anim="${anim}" data-source="tabler:${slug}-filled">\n${solid}\n</svg>\n`,
    };
  }
  const custom = CUSTOM[name];
  if (custom) {
    const parts = custom === 'tint' ? [...nodes.map(([, a]) => T(a.d)), ...nodes.map(([, a]) => [a.d, 'M'])] : custom;
    const body = parts
      .map(([d, part]) =>
        part === 'T'
          ? `  <path d="${d}" fill="${ACCENT}" fill-opacity="0.3" stroke="none"/>`
          : `  <path d="${d}" stroke="${part === 'A' ? ACCENT : MAIN}" fill="none"/>`)
      .join('\n');
    return {
      slug,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" data-style="line" data-anim="${anim}" data-source="tabler:${slug}">\n${body}\n</svg>\n`,
    };
  }
  const body = nodes
    .map(([tag, a], i) => {
      const color = accent.includes(i) ? ACCENT : MAIN;
      const rest = Object.entries(a).filter(([k]) => k !== 'fill' && k !== 'stroke').map(([k, v]) => attr(k, v)).join('');
      const fill = a.fill === 'currentColor' ? color : 'none';
      return `  <${tag}${rest} stroke="${color}" fill="${fill}"/>`;
    })
    .join('\n');
  return {
    slug,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" data-style="line" data-anim="${anim}" data-source="tabler:${slug}">\n${body}\n</svg>\n`,
  };
}

const args = process.argv.slice(2);
const names = args.includes('--all') ? Object.keys(PICKS) : args;
if (!names.length) {
  console.error('استخدام: node scripts/import-tabler.mjs IconTrash … | --all');
  process.exit(1);
}
let wrote = 0;
let kept = 0;
for (const name of names) {
  if (!PICKS[name]) {
    console.error(`✘ ${name} مش في PICKS — ضيفه بالأجزاء المرجانية والحركة`);
    process.exit(1);
  }
  const { slug, svg } = toSvg(name);
  const file = join(ROOT, 'icons', `${slug}.svg`);
  if (existsSync(file) && !readFileSync(file, 'utf8').includes('data-source="tabler:')) {
    kept++;
    continue;
  }
  writeFileSync(file, svg);
  wrote++;
}
console.log(`✔ ${wrote} أيقونة line${kept ? ` · ${kept} مرسومة يدوي اتسابت` : ''}`);
