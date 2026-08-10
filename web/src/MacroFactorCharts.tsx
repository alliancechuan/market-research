import { useMemo, useState, type MouseEvent } from "react";
import { useHostTheme, Text, Stack, Grid } from "./shims/cursor-canvas";
import { mapChrome } from "./heatMapTheme";
import { FX_HISTORY, resolveFxSeries, type FxHistoryCountry } from "./data/fxHistory";

/** 与 Atlas CountryMacroSnap 对齐的最小字段（避免循环依赖） */
export type MacroChartSnap = {
  gdpPerCapitaUsd?: string;
  incomePerCapita?: string;
  sectorMix?: string;
  currentAccount?: string;
  fxReserves?: string;
  fxTrend?: string;
  fxHint?: string;
  fxVolInYear?: string;
  privCreditOrConsumer?: string;
  debtToGdp?: string;
  householdDebtToGdp?: string;
  consumerConfidence?: string;
};

const HH_DEBT_CEIL_LO = 45;
const HH_DEBT_CEIL_HI = 55;
const GOV_DEBT_WATCH = 60;
const TERTIARY_HIGH = 65;
const PRIMARY_HIGH = 30;

function firstNumber(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseSector(sectorMix?: string): { agri: number; mfg: number; svc: number } | null {
  if (!sectorMix) return null;
  const agri = sectorMix.match(/农业[^0-9]*([\d.]+)/)?.[1];
  const mfg = sectorMix.match(/制造[^0-9]*([\d.]+)/)?.[1];
  const svc = sectorMix.match(/服务[^0-9]*([\d.]+)/)?.[1];
  if (!agri || !mfg || !svc) return null;
  return { agri: Number(agri), mfg: Number(mfg), svc: Number(svc) };
}

function splitValue(raw: string): string {
  const i = raw.indexOf("·");
  return i > 0 ? raw.slice(0, i) : raw;
}

/** 从字段串提取括号内年月，如（2025-12）/（2026-06） */
function extractAsOf(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.match(/（(\d{4}-\d{2})[^）]*）/);
  return m ? m[1] : null;
}

function parseCaGdp(currentAccount?: string): number | null {
  if (!currentAccount) return null;
  const m = currentAccount.match(/CA\/GDP约?\s*(-?[\d.]+)\s*%/i);
  return m ? Number(m[1]) : null;
}

function parseReservesUsdBn(fxReserves?: string): number | null {
  if (!fxReserves) return null;
  // 优先「亿美元」，避免「AED - 10亿」等本币口径误读
  const usdYi = fxReserves.match(/约?\s*([\d.]+)\s*亿美元/);
  if (usdYi) return Number(usdYi[1]);
  const yi = fxReserves.match(/约?\s*([\d.]+)\s*亿(?!美元)/);
  if (yi && /美元|USD|外汇储备/i.test(fxReserves)) return Number(yi[1]);
  return null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** 汇兑韧性示意分：连续项，避免多国撞同一档 */
function fxResilienceParts(ca: number | null, resBn: number | null, vol: number | null) {
  // CA/GDP：约每 1pct → ±3 分，截断
  const caPts = ca == null ? 0 : clamp(ca * 3, -28, 22);
  // 外储：log10 亿美元；10→−8，50→0，150→+8，1000→+18，10000→+28
  let resPts = 0;
  if (resBn != null && resBn > 0) {
    resPts = clamp((Math.log10(resBn) - Math.log10(50)) * 12, -22, 30);
  }
  // 年内波动：±8% 中性，越大越扣
  let volPts = 0;
  if (vol != null) {
    volPts = clamp(8 - vol, -18, 8);
  }
  const known = [ca, resBn, vol].filter((x) => x != null).length;
  // 缺项时略压向中性，避免「全缺也像中等」
  const base = known === 0 ? 40 : 50;
  const score = Math.round(clamp(base + caPts + resPts + volPts, 0, 100));
  return { score, caPts, resPts, volPts, known };
}

function parseHhDebt(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/([\d.]+)\s*%/);
  return m ? Number(m[1]) : null;
}

function parseGovDebt(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/([\d.]+)\s*%/);
  return m ? Number(m[1]) : null;
}

/** 消费/私营贷款存量解析；允许单边；兼容「私人部门信贷」等别名 */
function parseCreditAmounts(priv?: string): {
  consumerMn: number | null;
  privateMn: number | null;
} {
  if (!priv) return { consumerMn: null, privateMn: null };
  const cons = priv.match(/消费信贷约?\s*([\d.]+)/);
  const privLoan = priv.match(/(?:私营部门贷款|私人部门信贷|私人信贷|私人部门贷款)约?\s*([\d.]+)/);
  let consumerMn = cons ? Number(cons[1]) : null;
  let privateMn = privLoan ? Number(privLoan[1]) : null;
  if (privateMn != null) {
    const idx = priv.search(/私营部门贷款|私人部门信贷|私人信贷|私人部门贷款/);
    const privSeg = idx >= 0 ? priv.slice(idx) : priv;
    const firstSeg = privSeg.split("；")[0] ?? "";
    if (/千/.test(firstSeg) && !/百万/.test(firstSeg)) {
      privateMn = privateMn / 1000;
    }
  }
  return { consumerMn, privateMn };
}

/** @deprecated 双边才返回；新逻辑用 parseCreditAmounts */
function parseCreditPair(priv?: string): { consumerMn: number; privateMn: number } | null {
  const { consumerMn, privateMn } = parseCreditAmounts(priv);
  if (consumerMn == null || privateMn == null) return null;
  return { consumerMn, privateMn };
}

function Panel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div
      style={{
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 10px 8px",
        border: `1px solid ${c.panelBorder}`,
        borderRadius: 6,
        background: c.panelBg,
      }}
    >
      <div style={{ borderBottom: `1px solid ${c.panelBorder}`, paddingBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </div>
      {children}
      {footer ? <div style={{ fontSize: 11, color: c.textSecondary, lineHeight: 1.4 }}>{footer}</div> : null}
    </div>
  );
}

function HBar({
  label,
  pct,
  color,
  note,
}: {
  label: string;
  pct: number;
  color: string;
  note?: string;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 40px", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: c.textTertiary }}>{label}</span>
      <div style={{ height: 8, background: theme.fill.quaternary, borderRadius: 0 }}>
        <div style={{ width: `${w}%`, height: "100%", background: color }} />
      </div>
      <span style={{ fontSize: 11, color: c.text, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
        {pct.toFixed(0)}%{note ? "" : ""}
      </span>
    </div>
  );
}

export function IncomeSectorCharts({ snap, countryLabel }: { snap: MacroChartSnap; countryLabel: string }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const sec = parseSector(snap.sectorMix);
  const gdpPc = firstNumber(snap.gdpPerCapitaUsd);
  if (!sec && gdpPc == null) {
    return (
      <Text size="small" tone="tertiary">
        三产/人均GDP字段不足，暂无法作图。
      </Text>
    );
  }
  const tot = sec ? sec.agri + sec.mfg + sec.svc : 0;
  const pA = tot ? (sec!.agri / tot) * 100 : 0;
  const pM = tot ? (sec!.mfg / tot) * 100 : 0;
  const pS = tot ? (sec!.svc / tot) * 100 : 0;
  const highValue =
    pS >= TERTIARY_HIGH ? "服务占比已过附加值偏高阈值" : pS >= 50 ? "服务占主导、制造仍有空间" : "仍偏初级/制造驱动";
  const primaryRisk = pA >= PRIMARY_HIGH;

  return (
    <Grid columns={2} gap={8}>
      <Panel
        title={`${countryLabel} · 产业结构`}
        subtitle="分项占比（TE 绝对值折算）"
        footer={
          <>
            {highValue}
            {primaryRisk ? `；农业占比偏高（≥${PRIMARY_HIGH}%阈值）` : ""}。服务阈值对照 {TERTIARY_HIGH}%。
          </>
        }
      >
        {sec ? (
          <Stack gap={6}>
            <HBar label="农业" pct={pA} color={theme.fill.primary} />
            <HBar label="制造" pct={pM} color={c.accent} />
            <HBar label="服务" pct={pS} color={c.added} />
          </Stack>
        ) : (
          <Text size="small" tone="tertiary">
            无三产分项
          </Text>
        )}
      </Panel>
      <Panel
        title={`${countryLabel} · 收入能力`}
        subtitle="人均GDP（美元）"
        footer={
          gdpPc != null
            ? gdpPc >= 12000
              ? "过成熟阈值 12000"
              : gdpPc >= 2000
                ? "介于新兴与成熟阈值之间"
                : "低于准入关注阈值 2000"
            : "—"
        }
      >
        {gdpPc != null ? (
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: c.text }}>{Math.round(gdpPc).toLocaleString()}</div>
            <div style={{ marginTop: 10, height: 8, background: theme.fill.quaternary }}>
              <div
                style={{
                  width: `${Math.min(100, (gdpPc / 12000) * 100)}%`,
                  height: "100%",
                  background: gdpPc >= 12000 ? c.added : c.accent,
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: c.textTertiary, marginTop: 4 }}>相对成熟阈值 12000 的进度</div>
          </div>
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
      </Panel>
    </Grid>
  );
}

function formatFxValue(v: number): string {
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 100) return v.toFixed(1);
  if (v >= 10) return v.toFixed(2);
  return v.toFixed(3);
}

/** A 股习惯：红涨绿跌；方向按「本币对美元强弱」（报价升≠本币涨） */
const FX_UP = "#E53935";
const FX_DOWN = "#1B8F4A";

function fxLocalStrengthChgPct(series: FxHistoryCountry): number {
  const pts = series.points;
  if (!pts.length) return 0;
  const first = pts[0]!.v;
  const last = pts[pts.length - 1]!.v;
  if (!first) return 0;
  const quoteChg = ((last - first) / first) * 100;
  // 本币/USD 上升 = 本币贬；美国卡 USD/EUR 上升 = 美元升
  return series.quote === "usd_per_eur" ? quoteChg : -quoteChg;
}

function FxChgBadge({ strengthChg }: { strengthChg: number }) {
  const flat = Math.abs(strengthChg) < 0.05;
  const up = strengthChg > 0;
  const color = flat ? undefined : up ? FX_UP : FX_DOWN;
  const arrow = flat ? "–" : up ? "▲" : "▼";
  const sign = flat ? "" : up ? "+" : "";
  const word = flat ? "持平" : up ? "本币升" : "本币贬";
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, fontSize: 12, fontWeight: 600, color: color }}>
      <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>
        {arrow}
      </span>
      <span>
        {sign}
        {Math.abs(strengthChg).toFixed(1)}%
      </span>
      <span style={{ fontWeight: 400, opacity: 0.85 }}>{word}</span>
    </span>
  );
}

const FX_HISTORY_RANGE_HINT = "随机游走示意 · 约 5 年";

function seriesSpanLabel(series: FxHistoryCountry): string {
  if (series.synthetic) return "约 5 年";
  const pts = series.points;
  if (pts.length < 2) return "区间";
  const a = Date.parse(pts[0]!.d);
  const b = Date.parse(pts[pts.length - 1]!.d);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "区间";
  const y = (b - a) / (365.25 * 24 * 3600 * 1000);
  return y >= 1.5 ? `约 ${y.toFixed(1)} 年` : `约 ${(y * 12).toFixed(0)} 个月`;
}

function seriesDateRange(series: FxHistoryCountry): string {
  const pts = series.points;
  if (pts.length < 2) return FX_HISTORY.meta.range;
  return `${pts[0]!.d}..${pts[pts.length - 1]!.d}`;
}

/** 共同货币区说明：避免西非多国「曲线长一样」被当成示意 bug */
function sharedCcyNote(ccy: string): string | null {
  const u = ccy.toUpperCase();
  if (u === "XOF") return "西非法郎共同区（多国同币，曲线会高度相似）";
  if (u === "XAF") return "中非法郎共同区（多国同币，曲线会高度相似）";
  if (u === "NAD") return "与兰特联动较紧（南非兰特区关联）";
  return null;
}

/** Cursor 面板风格：细线 + 浅填充；悬停显示时点刻度；涨跌用 A 股红绿箭头 */
function FxTrendPanel({
  countryLabel,
  series,
}: {
  countryLabel: string;
  series: FxHistoryCountry;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const pts = series.points;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const strengthChg = fxLocalStrengthChgPct(series);
  const flat = Math.abs(strengthChg) < 0.05;
  const up = strengthChg > 0;
  const stroke = flat ? c.accent : up ? FX_UP : FX_DOWN;
  const fill = flat ? "rgba(80,140,180,0.10)" : up ? "rgba(229,57,53,0.10)" : "rgba(27,143,74,0.10)";

  const W = 640;
  const H = 120;
  const padX = 6;
  const padY = 12;
  const ys = useMemo(() => pts.map((p) => p.v), [pts]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo || Math.abs(lo) * 0.02 || 1;
  const xAt = (i: number) => padX + (i / Math.max(1, pts.length - 1)) * (W - padX * 2);
  const yAt = (v: number) => padY + (1 - (v - lo) / span) * (H - padY * 2);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${xAt(pts.length - 1).toFixed(1)},${(H - padY).toFixed(1)} L${xAt(0).toFixed(1)},${(H - padY).toFixed(1)} Z`;

  const activeIdx = hoverIdx ?? pts.length - 1;
  const active = pts[activeIdx]!;
  const spanLabel = seriesSpanLabel(series);

  const shared = sharedCcyNote(series.ccy);
  const subtitle = series.synthetic
    ? `示意 · ${series.pair} · ${FX_HISTORY_RANGE_HINT}`
    : `周抽样 · ${series.pair} · ${seriesDateRange(series)}${shared ? ` · ${shared}` : ""}`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const t = (e.clientX - rect.left) / rect.width;
    const i = Math.round(t * (pts.length - 1));
    setHoverIdx(Math.max(0, Math.min(pts.length - 1, i)));
  };

  const tipLeftPct = (activeIdx / Math.max(1, pts.length - 1)) * 100;

  return (
    <Panel
      title={`${countryLabel} · 汇率走势`}
      subtitle={subtitle}
      footer={
        series.synthetic
          ? series.note
          : `${series.source ?? "Frankfurter"} · ${series.unit}${series.note ? ` · ${series.note}` : ""} · 箭头按本币强弱（红涨绿跌）· 悬停看时点`
      }
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 600, color: hoverIdx != null ? stroke : c.text }}>
            {formatFxValue(active.v)}
          </span>
          <span style={{ fontSize: 11, color: c.textTertiary, marginLeft: 8 }}>{series.unit}</span>
          {hoverIdx != null ? (
            <span style={{ fontSize: 11, color: c.textSecondary, marginLeft: 10 }}>{active.d}</span>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <FxChgBadge strengthChg={strengthChg} />
          <span style={{ fontSize: 11, color: c.textTertiary }}>{spanLabel}</span>
        </div>
      </div>
      <div
        style={{ position: "relative", width: "100%", marginTop: 4, cursor: "crosshair" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={112} preserveAspectRatio="none" aria-hidden>
          <line x1={padX} x2={W - padX} y1={H / 2} y2={H / 2} stroke={c.panelBorder} strokeWidth={1} />
          <path d={area} fill={fill} stroke="none" />
          <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          {hoverIdx != null ? (
            <>
              <line
                x1={xAt(hoverIdx)}
                x2={xAt(hoverIdx)}
                y1={padY}
                y2={H - padY}
                stroke={c.textTertiary}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={xAt(hoverIdx)} cy={yAt(pts[hoverIdx]!.v)} r={3.5} fill={stroke} stroke={c.panelBg} strokeWidth={1.5} />
            </>
          ) : null}
        </svg>
        {hoverIdx != null ? (
          <div
            style={{
              position: "absolute",
              top: 4,
              left: `${tipLeftPct}%`,
              transform: tipLeftPct > 72 ? "translateX(-100%)" : tipLeftPct < 28 ? "translateX(0)" : "translateX(-50%)",
              pointerEvents: "none",
              padding: "4px 8px",
              borderRadius: 4,
              border: `1px solid ${c.panelBorder}`,
              background: c.panelBg,
              fontSize: 11,
              color: c.textSecondary,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              zIndex: 2,
            }}
          >
            <div style={{ fontWeight: 600, color: c.text }}>{active.d}</div>
            <div>
              {formatFxValue(active.v)}
              <span style={{ color: c.textTertiary, marginLeft: 6 }}>{series.unit}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: c.textTertiary }}>
        <span>{pts[0]?.d}</span>
        <span>
          低 {formatFxValue(lo)} · 高 {formatFxValue(hi)}
        </span>
        <span>{pts[pts.length - 1]?.d}</span>
      </div>
    </Panel>
  );
}

export function FxCaCharts({
  snap,
  countryLabel,
  countryCode,
}: {
  snap: MacroChartSnap;
  countryLabel: string;
  countryCode?: string;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const ca = parseCaGdp(snap.currentAccount);
  const res = parseReservesUsdBn(snap.fxReserves);
  const vol = firstNumber(snap.fxVolInYear);
  const { score, caPts, resPts, volPts, known } = fxResilienceParts(ca, res, vol);
  const fxSeries = countryCode
    ? resolveFxSeries(countryCode, {
        fxTrend: snap.fxTrend,
        fxHint: snap.fxHint,
        fxVolInYear: snap.fxVolInYear,
      })
    : undefined;

  const notes: string[] = [];
  if (ca != null) {
    notes.push(
      ca >= 2
        ? `经常账户顺差约 ${ca}%GDP`
        : ca >= 0
          ? `经常账户大致平衡（${ca}%GDP）`
          : ca > -3
            ? `轻度逆差 ${ca}%GDP`
            : `逆差偏深 ${ca}%GDP`,
    );
  }
  if (res != null) {
    notes.push(
      res >= 1000
        ? `外储约 ${res.toLocaleString()} 亿美元，规模很大`
        : res >= 150
          ? `外储约 ${res.toLocaleString()} 亿美元`
          : res >= 50
            ? `外储约 ${res.toLocaleString()} 亿美元，中等`
            : `外储约 ${res.toLocaleString()} 亿美元，偏薄`,
    );
  }
  if (vol != null) {
    notes.push(vol >= 15 ? `年内汇率波动约 ±${vol}%，偏大` : `年内汇率波动约 ±${vol}%`);
  }
  if (known < 2) notes.push("分项不足，示意分仅供对照");

  const stress =
    score >= 75
      ? "示意：外部缓冲相对厚，极端冲击下本币稳定空间更大"
      : score >= 55
        ? "示意：有一定缓冲，极端冲击仍需锁汇/限兑预案"
        : score >= 40
          ? "示意：缓冲一般，融资与汇兑需并排盯"
          : "示意：缓冲偏弱，极端情形本币稳定压力大";

  const partRow = (label: string, pts: number, has: boolean) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.textTertiary }}>
      <span style={{ width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: theme.fill.quaternary, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: c.panelBorder,
          }}
        />
        {has ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: pts >= 0 ? "50%" : `${50 - Math.min(50, Math.abs(pts) * 1.6)}%`,
              width: `${Math.min(50, Math.abs(pts) * 1.6)}%`,
              background: pts >= 0 ? c.added : c.removed,
            }}
          />
        ) : null}
      </div>
      <span style={{ width: 36, textAlign: "right", color: !has ? c.textTertiary : pts >= 0 ? c.added : c.removed }}>
        {has ? `${pts >= 0 ? "+" : ""}${Math.round(pts)}` : "—"}
      </span>
    </div>
  );

  const caAsOf = extractAsOf(snap.currentAccount);
  const resAsOf = extractAsOf(snap.fxReserves);
  const volAsOf = extractAsOf(snap.fxVolInYear);
  const fxLevelAsOf = extractAsOf(snap.fxTrend) || extractAsOf(snap.fxHint);

  return (
    <Stack gap={8}>
      {fxSeries ? (
        <FxTrendPanel countryLabel={countryLabel} series={fxSeries} />
      ) : (
        <Panel title={`${countryLabel} · 汇率走势`} subtitle="暂无可用序列" footer={snap.fxTrend || snap.fxHint || "—"}>
          <Text size="small" tone="tertiary">
            缺公开周序列，且宏观卡未同时给出对美元水平与年内波动，无法示意。
          </Text>
        </Panel>
      )}
      <Grid columns={3} gap={8}>
        <Panel
          title={`${countryLabel} · 经常账户`}
          subtitle={`时段 · CA/GDP${caAsOf ? ` · ${caAsOf}` : ""}`}
          footer={ca != null ? (ca >= 0 ? "顺差/平衡偏稳" : "逆差") : "—"}
        >
          <div style={{ fontSize: 22, fontWeight: 600, color: ca != null && ca < 0 ? c.removed : c.added }}>
            {ca != null ? `${ca}%` : "—"}
          </div>
          <div style={{ marginTop: 8, height: 6, background: theme.fill.quaternary, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 1,
                background: c.panelBorder,
              }}
            />
            {ca != null ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: ca < 0 ? `${50 - Math.min(45, Math.abs(ca) * 10)}%` : "50%",
                  width: `${Math.min(45, Math.abs(ca) * 10)}%`,
                  background: ca < 0 ? c.removed : c.added,
                }}
              />
            ) : null}
          </div>
        </Panel>
        <Panel
          title={`${countryLabel} · 外汇储备`}
          subtitle={`时点 · 亿美元${resAsOf ? ` · ${resAsOf}` : ""}`}
          footer={
            snap.fxTrend || snap.fxHint
              ? `汇率水平（时点）${fxLevelAsOf ? ` · ${fxLevelAsOf}` : ""}：${snap.fxTrend || snap.fxHint}`
              : "—"
          }
        >
          <div style={{ fontSize: 22, fontWeight: 600, color: c.text }}>{res != null ? res.toLocaleString() : "—"}</div>
          <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 6 }}>
            波动（时段·年内）{snap.fxVolInYear ? `${splitValue(snap.fxVolInYear)}${volAsOf ? ` · ${volAsOf}` : ""}` : "—"}
          </div>
        </Panel>
        <Panel
          title={`${countryLabel} · 汇兑韧性`}
          subtitle={`示意分 ${score}/100 · 非评级 · 混用时段+时点`}
          footer={stress}
        >
          <div style={{ height: 8, background: theme.fill.quaternary, marginTop: 4 }}>
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                background: score >= 75 ? c.added : score >= 55 ? c.accent : c.removed,
              }}
            />
          </div>
          <Stack gap={4} style={{ marginTop: 8 }}>
            {partRow("经常账户", caPts, ca != null)}
            {partRow("外储规模", resPts, res != null)}
            {partRow("汇率波动", volPts, vol != null)}
          </Stack>
          <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 8, lineHeight: 1.4 }}>
            {notes.slice(0, 3).join("；")}
          </div>
        </Panel>
      </Grid>
    </Stack>
  );
}

export function CreditDebtCharts({ snap, countryLabel }: { snap: MacroChartSnap; countryLabel: string }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const { consumerMn, privateMn } = parseCreditAmounts(snap.privCreditOrConsumer);
  const pair =
    consumerMn != null && privateMn != null && privateMn > 0
      ? { consumerMn, privateMn }
      : null;
  const hh = parseHhDebt(snap.householdDebtToGdp);
  const gov = parseGovDebt(snap.debtToGdp);

  let consShare = 0;
  if (pair) {
    consShare = (pair.consumerMn / pair.privateMn) * 100;
  }

  const hhNearCeil = hh != null && hh >= HH_DEBT_CEIL_LO;
  const govHigh = gov != null && gov >= GOV_DEBT_WATCH;
  const hasAnyCredit = consumerMn != null || privateMn != null;

  let creditFooter = "暂无消费/私营信贷存量口径";
  if (pair) {
    creditFooter = `消费约占私营贷款 ${consShare.toFixed(0)}%（单位已粗对齐）。相对关系用于看零售杠杆浓度。`;
  } else if (consumerMn != null) {
    creditFooter = `仅录入消费信贷约 ${consumerMn.toLocaleString()}（缺私营贷款对照）`;
  } else if (privateMn != null) {
    creditFooter = `仅录入私营/私人部门贷款约 ${privateMn.toLocaleString()}（缺消费信贷分项）`;
  }

  return (
    <Grid columns={2} gap={8}>
      <Panel
        title={`${countryLabel} · 信贷结构`}
        subtitle="时段 · 消费信贷 / 私营部门贷款"
        footer={creditFooter}
      >
        {pair ? (
          <Stack gap={8}>
            <HBar label="消费" pct={Math.min(100, consShare)} color={c.removed} />
            <HBar label="其他*" pct={Math.min(100, Math.max(0, 100 - consShare))} color={c.accent} />
            <div style={{ fontSize: 10, color: c.textTertiary }}>*其他≈私营贷款−消费口径</div>
          </Stack>
        ) : hasAnyCredit ? (
          <Stack gap={6}>
            <div style={{ fontSize: 22, fontWeight: 600, color: c.text }}>
              {(consumerMn ?? privateMn)!.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: c.textTertiary }}>
              {consumerMn != null ? "消费信贷存量（单边）" : "私营/私人部门贷款（单边）"}
            </div>
          </Stack>
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
      </Panel>
      <Panel
        title={`${countryLabel} · 负债率`}
        subtitle={`时点 · 居民阈值 ${HH_DEBT_CEIL_LO}–${HH_DEBT_CEIL_HI}% · 政府观察线 ${GOV_DEBT_WATCH}%`}
        footer={
          hhNearCeil
            ? "居民杠杆接近/进入新兴市场过热带，需防触顶"
            : hh != null
              ? `居民杠杆 ${hh}% 距过热带仍有空间，整体未触顶`
              : "居民杠杆暂缺"
        }
      >
        <Stack gap={8}>
          <HBar label="居民" pct={hh ?? 0} color={hhNearCeil ? c.removed : c.added} note={hh == null ? "—" : undefined} />
          <HBar label="政府" pct={Math.min(100, gov ?? 0)} color={govHigh ? c.removed : c.accent} />
          <div style={{ fontSize: 10, color: c.textTertiary }}>
            信心 {snap.consumerConfidence ?? "—"}
            {govHigh ? "；政府债务已过观察线" : ""}
          </div>
        </Stack>
      </Panel>
    </Grid>
  );
}
