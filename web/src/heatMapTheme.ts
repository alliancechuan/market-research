/**
 * 大屏热力图：
 * - 市场放贷：整国面填，在贷越小越浅绿、越大越深绿（不透明分档）
 * - 已合作：满饱和面填 + 白/深蓝双描边 + 较大数字徽章（数字=已投平台数）
 * - 未合作有数据：同色阶但降饱和，突出合作国
 *
 * 注意：Cursor fill.* 多为带 alpha 的半透明色，不能直接当 choropleth 端点，
 * 否则会整图压成死黑（此前「仅红」全黑的根因）。
 */
import type { CanvasHostTheme } from "./shims/cursor-canvas";

function stripAlpha(hex: string): string {
  const h = hex.replace("#", "");
  return `#${h.slice(0, 6)}`;
}

function hexRgb(h: string): [number, number, number] {
  const s = h.replace("#", "").slice(0, 6);
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function rgbStr(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = Math.min(1, Math.max(0, t));
  return rgbStr(pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u, pa[2] + (pb[2] - pa[2]) * u);
}

function ink(theme: CanvasHostTheme): string {
  return stripAlpha(theme.palette.foreground);
}

/** 无数据陆地（须浅于热力最低档，否则肯尼亚等会“隐身”） */
const GRAY_EMPTY = "#F0F0F0";
/** 面填专用：不透明浅灰 → 墨色（5 档，大屏一眼可辨） */
const GRAY_STOPS = ["#D0D0D0", "#A8A8A8", "#787878", "#4A4A4A", "#1A1A1A"] as const;
/** 市场在贷：小→浅绿，大→深绿（5 档，避开荧光/半透明） */
const LOAN_GREEN_STOPS = ["#C8E6C9", "#81C784", "#43A047", "#2E7D32", "#1B5E20"] as const;
/** 已合作描边：外白内深蓝，避免被绿色面填吃掉 */
export const INVESTED_STROKE_HALO = "#FFFFFF";
export const INVESTED_STROKE_CORE = "#0D47A1";
export const INVESTED_BADGE_FILL = "#0D47A1";

/** 连续灰阶（0→1），低端远离 emptyLand 的半透明 token */
export function heatGray(t: number, _theme?: CanvasHostTheme): string {
  const x = Math.min(1, Math.max(0, t));
  const n = GRAY_STOPS.length - 1;
  const i = Math.min(n - 1, Math.floor(x * n));
  const local = x * n - i;
  return lerpHex(GRAY_STOPS[i], GRAY_STOPS[i + 1], local);
}

/** 分档灰阶：把连续强度压成 5 类，拉开印尼/肯尼亚与印度的视觉差 */
export function heatGrayClass(t: number, _theme?: CanvasHostTheme): string {
  const x = Math.min(1, Math.max(0, t));
  const idx = Math.min(GRAY_STOPS.length - 1, Math.floor(x * GRAY_STOPS.length));
  return GRAY_STOPS[Math.max(0, idx)];
}

/** 市场在贷连续色：0=浅绿 … 1=深绿 */
export function heatColorLoan(t: number, _theme?: CanvasHostTheme): string {
  const x = Math.min(1, Math.max(0, t));
  const n = LOAN_GREEN_STOPS.length - 1;
  const i = Math.min(n - 1, Math.floor(x * n));
  const local = x * n - i;
  return lerpHex(LOAN_GREEN_STOPS[i], LOAN_GREEN_STOPS[i + 1], local);
}

/** 市场在贷分档色（热力面填 · 满饱和，用于已合作国） */
export function heatColorLoanClass(t: number, _theme?: CanvasHostTheme): string {
  const x = Math.min(1, Math.max(0, t));
  const idx = Math.min(LOAN_GREEN_STOPS.length - 1, Math.floor(x * LOAN_GREEN_STOPS.length));
  return LOAN_GREEN_STOPS[Math.max(0, idx)];
}

/** 未合作国：同色阶向浅灰靠拢，降低存在感 */
export function heatColorLoanMuted(t: number, _theme?: CanvasHostTheme): string {
  return lerpHex(heatColorLoanClass(t), GRAY_EMPTY, 0.48);
}

export function heatStopsLoan(_theme?: CanvasHostTheme): string[] {
  return [...LOAN_GREEN_STOPS];
}

/** 兼容旧名：市场面填 */
export function heatColorRemoved(t: number, theme: CanvasHostTheme): string {
  return heatColorLoanClass(t, theme);
}

/** 已投符号色：浅灰 → 主题蓝（非绿） */
export function heatColorAdded(t: number, theme: CanvasHostTheme): string {
  const x = Math.min(1, Math.max(0, t));
  const tip = stripAlpha(theme.accent.primary);
  return lerpHex("#D9E6F0", tip, 0.25 + x * 0.75);
}

export function heatStopsGray(_theme?: CanvasHostTheme): string[] {
  return [...GRAY_STOPS];
}

export function heatStopsAccent(theme: CanvasHostTheme): string[] {
  return [0, 0.25, 0.5, 0.75, 1].map((t) => heatColorAdded(t, theme));
}

export function heatStopsRemoved(theme: CanvasHostTheme): string[] {
  return heatStopsLoan(theme);
}

export function heatStopsAdded(theme: CanvasHostTheme): string[] {
  return heatStopsAccent(theme);
}

/** log10 归一化：适合跨 3 个数量级的放贷规模 */
export function logHeatNorm(value: number, minPositive: number, max: number): number {
  if (!(value > 0)) return 0;
  const lo = Math.log10(Math.max(minPositive, 1e-9));
  const hi = Math.log10(Math.max(max, minPositive * 1.01));
  if (hi <= lo) return 1;
  return Math.min(1, Math.max(0, (Math.log10(value) - lo) / (hi - lo)));
}

export function mapChrome(theme: CanvasHostTheme) {
  const black = ink(theme);
  const accent = stripAlpha(theme.accent.primary);
  return {
    mapBg: theme.bg.chrome,
    ocean: theme.bg.editor,
    /** 无数据陆地：不透明浅灰，勿用半透明 fill token */
    emptyLand: GRAY_EMPTY,
    landStroke: theme.stroke.tertiary,
    outline: theme.stroke.secondary,
    graticule: theme.stroke.tertiary,
    panelBg: theme.bg.elevated,
    panelBorder: theme.stroke.tertiary,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    textTertiary: theme.text.tertiary,
    link: theme.text.link,
    accent,
    ink: black,
    removed: black,
    added: accent,
    removedSoft: "#F0F0F0",
    addedSoft: "#E8F0F6",
    fillSoft: "#F0F0F0",
    /** 已合作双描边 / 徽章 */
    investedHalo: INVESTED_STROKE_HALO,
    investedStroke: INVESTED_STROKE_CORE,
    investedBadge: INVESTED_BADGE_FILL,
    buttonBg: theme.bg.elevated,
    buttonBorder: theme.stroke.secondary,
  };
}
