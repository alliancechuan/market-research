/**
 * 大屏与 CRM 共用的 Cursor 扁平 UI 零件（无阴影 / 无渐变 / 主题 token）。
 */
import type { CSSProperties, ReactNode } from "react";
import { useHostTheme, Text, Button, Link, Stack, Row, mergeStyle } from "./shims/cursor-canvas";
import {
  heatStopsAdded,
  heatStopsRemoved,
  heatStopsWarm,
  mapChrome,
  heatColorAdded,
  heatColorRemoved,
} from "./heatMapTheme";
import {
  displayCreditNote,
  getCountryMacro,
  synthesizeCashLoanBrief,
  buildCashLoanMacroGroups,
} from "./data/countryMacro";
import { formatCountryLanguageLine, getCountryLanguage } from "./data/countryLanguage";
import { resolveFxSeries } from "./data/fxHistory";

export function MapSection({
  title,
  children,
  dense = false,
}: {
  title: string;
  children: ReactNode;
  dense?: boolean;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div style={{ marginBottom: dense ? 10 : 16 }}>
      <div
        style={{
          fontSize: dense ? 12 : 13,
          fontWeight: 600,
          color: c.textSecondary,
          marginBottom: 6,
          borderBottom: `1px solid ${c.panelBorder}`,
          paddingBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export function MapKV({
  k,
  v,
  dense = false,
}: {
  k: string;
  v: string;
  dense?: boolean;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        fontSize: dense ? 12 : 13,
        lineHeight: 1.55,
        marginBottom: dense ? 2 : 4,
      }}
    >
      <span style={{ color: c.textTertiary, minWidth: dense ? 88 : 96, flexShrink: 0 }}>{k}</span>
      <span style={{ color: c.text, wordBreak: "break-word" }}>{v}</span>
    </div>
  );
}

export function MapDetailShell({
  title,
  subtitle,
  onClose,
  closeLabel = "返回全球",
  children,
  overlay = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
  /** 全屏地图：浮在地图右侧，不挤占底图宽度 */
  overlay?: boolean;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div
      style={
        overlay
          ? {
              position: "absolute",
              top: 56,
              right: 12,
              bottom: 12,
              width: "min(760px, max(50vw, 420px))",
              maxWidth: "56vw",
              zIndex: 4,
              overflow: "auto",
              border: `1px solid ${c.panelBorder}`,
              borderRadius: 8,
              background: c.panelBg,
              padding: 20,
              fontSize: 15,
              lineHeight: 1.55,
            }
          : {
              flex: "1 1 420px",
              minWidth: 360,
              maxWidth: 640,
              maxHeight: 560,
              overflow: "auto",
              border: `1px solid ${c.panelBorder}`,
              borderRadius: 8,
              background: c.panelBg,
              padding: 16,
            }
      }
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: overlay ? 20 : 15, fontWeight: 600, color: c.text }}>{title}</div>
          {subtitle ? (
            <div
              style={{
                fontSize: overlay ? 13 : 11,
                color: c.textTertiary,
                marginTop: 4,
                lineHeight: 1.45,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <Button variant="secondary" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}

export function MapFloatingBar({ children }: { children: ReactNode }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        left: 12,
        top: 12,
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      {children}
      {/* spacer for typed children that need chrome colors via context */}
      <span style={{ display: "none" }} data-map-chrome={c.text} />
    </div>
  );
}

export function MapChip({ children }: { children: ReactNode }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <span
      style={{
        fontSize: 12,
        color: c.text,
        background: c.panelBg,
        borderRadius: 6,
        padding: "6px 10px",
        border: `1px solid ${c.panelBorder}`,
      }}
    >
      {children}
    </span>
  );
}

export function MapSvgFrame({
  width,
  height,
  fill = false,
  children,
}: {
  width: number;
  height: number;
  /** 铺满父容器（投屏全屏） */
  fill?: boolean;
  children: ReactNode;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={fill ? "100%" : "auto"}
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        background: c.mapBg,
        borderRadius: fill ? 0 : 8,
        border: fill ? "none" : `1px solid ${c.panelBorder}`,
        ...(fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }
          : null),
      }}
    >
      <rect width={width} height={height} fill={c.mapBg} />
      {children}
    </svg>
  );
}

export function MapTooltip({
  left,
  top,
  accent,
  children,
}: {
  left: number;
  top: number;
  accent?: "removed" | "added" | "neutral";
  children: ReactNode;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const border =
    accent === "removed" ? c.removed : accent === "added" ? c.added : c.panelBorder;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        background: c.panelBg,
        color: c.text,
        border: `1px solid ${border}`,
        padding: "8px 10px",
        borderRadius: 6,
        fontSize: 12,
        pointerEvents: "none",
        minWidth: 170,
      }}
    >
      {children}
    </div>
  );
}

/** 离散色阶（禁止 linear-gradient） */
export function SteppedLegend({
  label,
  kind,
  compact = false,
}: {
  label: string;
  kind: "removed" | "added" | "gray" | "accent" | "warm";
  /** 底部/融入图例时更扁 */
  compact?: boolean;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const stops =
    kind === "warm"
      ? heatStopsWarm()
      : kind === "added" || kind === "accent"
        ? heatStopsAdded(theme)
        : heatStopsRemoved(theme);
  return (
    <div
      style={{
        marginBottom: compact ? 0 : 12,
        flex: compact ? "1 1 160px" : undefined,
        minWidth: compact ? 140 : undefined,
      }}
    >
      <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          display: "flex",
          height: compact ? 8 : 10,
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${c.panelBorder}`,
          maxWidth: compact ? 220 : undefined,
        }}
      >
        {stops.map((color, i) => (
          <div key={i} style={{ flex: 1, background: color }} />
        ))}
      </div>
    </div>
  );
}

export type MapLegendPlacement = "side" | "bottom";

export function MapSideLegend({
  title,
  children,
  placement = "side",
}: {
  title: string;
  children: ReactNode;
  /** side=右侧栏；bottom=地图框外下方横栏（不叠底图） */
  placement?: MapLegendPlacement;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  if (placement === "bottom") {
    return (
      <div
        style={{
          flex: "0 0 auto",
          width: "100%",
          background: c.panelBg,
          border: `1px solid ${c.panelBorder}`,
          borderRadius: 8,
          padding: "12px 14px",
          maxHeight: 380,
          overflow: "auto",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: c.textSecondary,
          }}
        >
          {title}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div style={{ flex: "1 1 220px", minWidth: 200, alignSelf: "flex-start" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: c.textSecondary }}>{title}</div>
      {children}
    </div>
  );
}

export function MapMuted({ children }: { children: ReactNode }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div style={{ fontSize: 12, color: c.textTertiary, lineHeight: 1.5 }}>{children}</div>
  );
}

export type RankBarItem = {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  /** 次要说明（如双图层下的市场读数） */
  secondaryLabel?: string;
};

/**
 * 国别排行横条图：替代密文列表，便于比较相对规模。
 * 条长按线性比例（相对当前列表最大值）；点击行可联动地图。
 */
export function RankBarList({
  items,
  onSelect,
  compact = false,
  scaleHint = "条长 ∝ 数值（相对列表最大值）",
  maxVisible,
}: {
  items: RankBarItem[];
  onSelect?: (key: string) => void;
  compact?: boolean;
  scaleHint?: string;
  /** 仅展示前 N 条，其余以脚注说明 */
  maxVisible?: number;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  if (!items.length) return null;
  const shown = maxVisible && maxVisible > 0 ? items.slice(0, maxVisible) : items;
  const max = Math.max(...shown.map((i) => i.value), Number.EPSILON);
  const barInk = c.ink;
  const track = c.fillSoft;

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: c.textTertiary,
          marginBottom: compact ? 4 : 6,
          lineHeight: 1.4,
        }}
      >
        {scaleHint}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: compact ? 4 : 6,
          maxHeight: compact ? 280 : 360,
          overflow: "auto",
          paddingRight: 2,
        }}
      >
        {shown.map((item, idx) => {
          const pct = Math.max(1.5, (item.value / max) * 100);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              title={`${item.label} · ${item.valueLabel}`}
              style={{
                display: "block",
                width: "100%",
                margin: 0,
                padding: compact ? "2px 0" : "3px 0",
                border: "none",
                background: "none",
                cursor: onSelect ? "pointer" : "default",
                textAlign: "left",
                font: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  fontSize: compact ? 11 : 12,
                  lineHeight: 1.35,
                  marginBottom: 2,
                }}
              >
                <span style={{ color: c.link, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: c.textTertiary, marginRight: 4 }}>{idx + 1}</span>
                  {item.label}
                </span>
                <span
                  style={{
                    color: c.text,
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                  }}
                >
                  {item.valueLabel}
                </span>
              </div>
              <div
                style={{
                  height: compact ? 5 : 7,
                  borderRadius: 2,
                  background: track,
                  overflow: "hidden",
                  border: `1px solid ${c.panelBorder}`,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: barInk,
                    opacity: 0.72,
                  }}
                />
              </div>
              {item.secondaryLabel ? (
                <div
                  style={{
                    fontSize: 10,
                    color: c.removed,
                    marginTop: 2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.secondaryLabel}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      {maxVisible && items.length > shown.length ? (
        <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 6 }}>
          另有 {items.length - shown.length} 国未展示；点地图或放大国家查看
        </div>
      ) : null}
    </div>
  );
}

export function MapExtLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href}>{children}</Link>;
}

/** 国别详情：按现金贷决策序分组（与 CRM 宏观卡同逻辑） */
export function MapCountryMacroBrief({ code }: { code: string }) {
  const snap = getCountryMacro(code);
  const theme = useHostTheme();
  const c = mapChrome(theme);
  if (!snap) {
    return (
      <MapSection title="宏观因子">
        <MapMuted>该国暂无宏观快照；可在 CRM「宏观」页续写。</MapMuted>
      </MapSection>
    );
  }
  const lang = getCountryLanguage(code);
  const fx = resolveFxSeries(code, {
    fxTrend: snap.fxTrend,
    fxHint: snap.fxHint,
    fxVolInYear: snap.fxVolInYear,
  });
  const groups = buildCashLoanMacroGroups(snap);
  const brief = synthesizeCashLoanBrief(snap);
  const note = displayCreditNote(snap);

  let spark: ReactNode = null;
  if (fx?.points?.length) {
    const pts = fx.points;
    const W = 240;
    const H = 44;
    const ys = pts.map((p) => p.v);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const span = hi - lo || 1;
    const line = pts
      .map((p, i) => {
        const x = (i / Math.max(1, pts.length - 1)) * W;
        const y = 2 + (1 - (p.v - lo) / span) * (H - 4);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const quoteChg = pts[0]!.v !== 0 ? ((pts[pts.length - 1]!.v - pts[0]!.v) / pts[0]!.v) * 100 : 0;
    const strengthChg = fx.quote === "usd_per_eur" ? quoteChg : -quoteChg;
    const flat = Math.abs(strengthChg) < 0.05;
    const up = strengthChg > 0;
    const FX_UP = "#E53935";
    const FX_DOWN = "#1B8F4A";
    const stroke = flat ? c.accent : up ? FX_UP : FX_DOWN;
    const arrow = flat ? "–" : up ? "▲" : "▼";
    const word = flat ? "持平" : up ? "本币升" : "本币贬";
    spark = (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.textTertiary, marginBottom: 4 }}>
          <span>
            汇率走势 · {fx.pair}
            {fx.synthetic ? "（示意）" : ""}
          </span>
          <span style={{ color: stroke, fontWeight: 600, display: "inline-flex", alignItems: "baseline", gap: 3 }}>
            <span aria-hidden>{arrow}</span>
            {flat ? "" : up ? "+" : ""}
            {Math.abs(strengthChg).toFixed(1)}%
            <span style={{ fontWeight: 400 }}>{word}</span>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={40} preserveAspectRatio="none" aria-hidden>
          <path d={line} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <MapSection title="现金贷宏观">
      {spark}
      <MapKV k="对照时点" v={snap.asOf || "—"} />
      {formatCountryLanguageLine(code) ? <MapKV k="语言区" v={formatCountryLanguageLine(code)!} /> : null}
      {lang?.productHint ? <MapKV k="产品常用语" v={lang.productHint} /> : null}
      <div style={{ margin: "8px 0", fontSize: 12, lineHeight: 1.5, color: c.textSecondary }}>{brief}</div>
      {groups.map((g) => (
        <div key={g.id} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 2 }}>
            {g.step} {g.title}
          </div>
          <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 4, lineHeight: 1.4 }}>{g.soWhat}</div>
          {g.metrics.map((m) => (
            <MapKV key={`${g.id}-${m.label}`} k={m.label} v={m.value} />
          ))}
        </div>
      ))}
      {note ? <MapKV k="补充" v={note} /> : null}
    </MapSection>
  );
}

export function useMapChrome() {
  const theme = useHostTheme();
  return { theme, c: mapChrome(theme) };
}

export function producerCardStyle(theme: ReturnType<typeof useHostTheme>): CSSProperties {
  const c = mapChrome(theme);
  return mergeStyle({
    background: c.addedSoft,
    border: `1px solid ${c.panelBorder}`,
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 1.55,
  });
}

export { Stack, Row, Text, Button, Link, useHostTheme, heatColorAdded, heatColorRemoved, mapChrome };
