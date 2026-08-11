/**
 * 大屏与 CRM 共用的 Cursor 扁平 UI 零件（无阴影 / 无渐变 / 主题 token）。
 */
import type { CSSProperties, ReactNode } from "react";
import { useHostTheme, Text, Button, Link, Stack, Row, mergeStyle } from "./shims/cursor-canvas";
import {
  heatStopsAdded,
  heatStopsRemoved,
  heatStopsLoan,
  heatStopsGray,
  mapChrome,
  heatColorAdded,
  heatColorRemoved,
  heatColorLoanMuted,
  INVESTED_STROKE_CORE,
  INVESTED_STROKE_HALO,
  INVESTED_BADGE_FILL,
} from "./heatMapTheme";
import {
  displayCreditNote,
  getCountryMacro,
  synthesizeCashLoanBrief,
} from "./data/countryMacro";
import { formatCountryLanguageLine, getCountryLanguage } from "./data/countryLanguage";

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
  kind: "removed" | "added" | "gray" | "accent" | "loan";
  /** 底部/融入图例时更扁 */
  compact?: boolean;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const stops =
    kind === "added" || kind === "accent"
      ? heatStopsAdded(theme)
      : kind === "gray"
        ? heatStopsGray(theme)
        : kind === "loan" || kind === "removed"
          ? heatStopsLoan(theme)
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
          padding: "10px 14px",
          maxHeight: 120,
          overflow: "hidden",
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

/** 国别详情：宏观因子快照（与 CRM 宏观页同库） */
export function MapCountryMacroBrief({ code }: { code: string }) {
  const snap = getCountryMacro(code);
  if (!snap) {
    return (
      <MapSection title="宏观因子">
        <MapMuted>该国暂无宏观快照；可在 CRM「宏观」页续写。</MapMuted>
      </MapSection>
    );
  }
  const lang = getCountryLanguage(code);
  const rows: { k: string; v?: string }[] = [
    { k: "对照时点", v: snap.asOf },
    { k: "语言区", v: formatCountryLanguageLine(code) },
    { k: "产品常用语", v: lang?.productHint },
    { k: "GDP同比", v: snap.gdpYoY },
    { k: "人均GDP", v: snap.gdpPerCapitaUsd },
    { k: "人均收入", v: snap.incomePerCapita },
    { k: "通胀", v: snap.inflation },
    { k: "政策利率", v: snap.policyRate },
    { k: "失业率", v: snap.unemployment },
    { k: "总人口", v: snap.population },
    { k: "就业/人口", v: snap.employedToPop },
    { k: "居民杠杆", v: snap.householdDebtToGdp },
    { k: "年内汇率波动", v: snap.fxVolInYear },
    { k: "经常账户", v: snap.currentAccount },
    { k: "外汇储备", v: snap.fxReserves },
    { k: "汇率", v: snap.fxTrend || snap.fxHint },
    { k: "信贷水位", v: snap.privCreditOrConsumer },
    { k: "准入简评", v: synthesizeCashLoanBrief(snap) },
    { k: "补充", v: displayCreditNote(snap) },
  ];
  return (
    <MapSection title="宏观因子">
      {rows
        .filter((r) => r.v && r.v.trim())
        .map((r) => (
          <MapKV key={r.k} k={r.k} v={r.v!} />
        ))}
    </MapSection>
  );
}

/** 已合作数字徽章：圆心数字=已投平台数（偏大，带白描边） */
export function InvestedBadge({
  cx,
  cy,
  count,
  fill = INVESTED_BADGE_FILL,
  stroke = INVESTED_STROKE_HALO,
  dimmed = false,
}: {
  cx: number;
  cy: number;
  count: number;
  fill?: string;
  stroke?: string;
  dimmed?: boolean;
}) {
  const n = Math.max(0, Math.round(count));
  if (n <= 0 || !Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  const label = n > 9 ? "9+" : String(n);
  const r = n >= 10 ? 12 : 10.5;
  return (
    <g
      transform={`translate(${cx},${cy})`}
      opacity={dimmed ? 0.18 : 1}
      style={{ pointerEvents: "none" }}
    >
      <circle cx={0} cy={0} r={r + 2.2} fill={stroke} />
      <circle cx={0} cy={0} r={r} fill={fill} />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={n >= 10 ? 11 : 12}
        fontWeight={700}
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

/** 已合作双描边（外白内深蓝） */
export function InvestedCountryOutline({
  d,
  platforms = 1,
  focused = false,
  dimmed = false,
}: {
  d: string;
  platforms?: number;
  focused?: boolean;
  dimmed?: boolean;
}) {
  const core = focused ? 2.8 : 1.7 + Math.min(platforms, 4) * 0.25;
  const halo = core + 2.4;
  const opacity = dimmed ? 0.15 : 1;
  return (
    <g style={{ pointerEvents: "none" }} opacity={opacity}>
      <path d={d} fill="none" stroke={INVESTED_STROKE_HALO} strokeWidth={halo} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={INVESTED_STROKE_CORE} strokeWidth={core} strokeLinejoin="round" />
    </g>
  );
}

/** 图例：双描边 + 数字徽章示意 */
export function InvestedBadgeLegendSample({ color = INVESTED_STROKE_CORE }: { color?: string }) {
  return (
    <svg width={64} height={24} viewBox="0 0 64 24" aria-hidden>
      <rect x={2} y={4} width={22} height={16} rx={2} fill="#A5D6A7" stroke={INVESTED_STROKE_HALO} strokeWidth={3.2} />
      <rect x={2} y={4} width={22} height={16} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
      <g transform="translate(46,12)">
        <circle cx={0} cy={0} r={10.2} fill={INVESTED_STROKE_HALO} />
        <circle cx={0} cy={0} r={8.5} fill={color} />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize={11}
          fontWeight={700}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          2
        </text>
      </g>
    </svg>
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

export {
  Stack,
  Row,
  Text,
  Button,
  Link,
  useHostTheme,
  heatColorAdded,
  heatColorRemoved,
  heatColorLoanMuted,
  mapChrome,
};
