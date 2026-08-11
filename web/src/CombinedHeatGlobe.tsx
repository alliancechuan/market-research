import { useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldTopology from "world-atlas/countries-110m.json";
import { COUNTRY_LABEL_ZH } from "./data/nbfcCountryStats";
import { aggregateLendingUsdBn } from "./LendingHeatGlobe";
import {
  COUNTRY_ZOOM_BY_CODE,
  playFinanceChartUrl,
  summarizeNbfcForCountry,
} from "./data/countryZoomDetails";
import {
  INVESTED_BY_CODE,
  formatUsdCompact,
} from "./data/producerHoldings";
import {
  MapSection,
  MapKV,
  MapDetailShell,
  MapChip,
  MapSvgFrame,
  MapTooltip,
  SteppedLegend,
  MapSideLegend,
  MapMuted,
  MapExtLink,
  useMapChrome,
  producerCardStyle,
  Button,
  heatColorRemoved,
  heatColorAdded,
  MapCountryMacroBrief,
  InvestedBadge,
  InvestedBadgeLegendSample,
  InvestedCountryOutline,
  type MapLegendPlacement,
} from "./HeatMapChrome";
import { heatColorLoanMuted } from "./heatMapTheme";
import { formatCountryLanguageLine } from "./data/countryLanguage";

type CountryProps = { name?: string };

const N3_TO_A2: Record<string, string> = {
  "356": "IN",
  "156": "CN",
  "392": "JP",
  "360": "ID",
  "764": "TH",
  "458": "MY",
  "484": "MX",
  "050": "BD",
  "50": "BD",
  "710": "ZA",
  "144": "LK",
  "288": "GH",
  "586": "PK",
  "566": "NG",
  "404": "KE",
  "158": "TW",
  "410": "KR",
  "704": "VN",
  "608": "PH",
  "344": "HK",
  "840": "US",
  "124": "CA",
  "826": "GB",
  "076": "BR",
  "76": "BR",
  "170": "CO",
  "032": "AR",
  "32": "AR",
  "604": "PE",
  "152": "CL",
  "818": "EG",
  "504": "MA",
  "682": "SA",
  "784": "AE",
  "792": "TR",
  "276": "DE",
  "250": "FR",
  "528": "NL",
  "724": "ES",
  "620": "PT",
  "380": "IT",
  "752": "SE",
  "616": "PL",
  "372": "IE",
  "643": "RU",
  "702": "SG",
  // 中亚 / 非洲等区域缩放
  "398": "KZ",
  "860": "UZ",
  "417": "KG",
  "762": "TJ",
  "795": "TM",
  "834": "TZ",
  "800": "UG",
  "646": "RW",
  "231": "ET",
  "384": "CI",
  "686": "SN",
  "120": "CM",
  "024": "AO",
  "24": "AO",
  "508": "MZ",
  "894": "ZM",
  "716": "ZW",
  "072": "BW",
  "72": "BW",
  "516": "NA",
  "480": "MU",
  "450": "MG",
  "204": "BJ",
  "854": "BF",
  "466": "ML",
  "180": "CD",
  "266": "GA",
  "496": "MN",
};

function normId(id: string | number | undefined): string {
  if (id == null) return "";
  return String(id).replace(/^0+/, "") || "0";
}

/** 110m 底图无独立香港面：用小框作焦点拟合 + 地图锚点 */
const HK_FOCUS_FEATURE: Feature<Geometry, CountryProps> = {
  type: "Feature",
  properties: { name: "Hong Kong" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [113.82, 22.15],
        [114.45, 22.15],
        [114.45, 22.58],
        [113.82, 22.58],
        [113.82, 22.15],
      ],
    ],
  },
};
type HoverInfo = {
  a2: string;
  name: string;
  lendingBn: number;
  invested: boolean;
  outstandingUsd: number;
  investmentUsd: number;
  /** 已投平台数（徽章数字） */
  platformCount: number;
  /** 生态机构样本数（其他机构图层） */
  ecoCount: number;
  x: number;
  y: number;
};

function DetailPanel({
  code,
  onClose,
  overlay = false,
}: {
  code: string;
  onClose: () => void;
  overlay?: boolean;
}) {
  const { theme, c } = useMapChrome();
  const invested = INVESTED_BY_CODE[code];
  const zoom = COUNTRY_ZOOM_BY_CODE[code];
  const nbfc = summarizeNbfcForCountry(code);
  const name = COUNTRY_LABEL_ZH[code] ?? invested?.country_zh ?? code;
  const chartUrl = zoom?.source_url || playFinanceChartUrl(code);
  const langLine = formatCountryLanguageLine(code);
  const baseSub = invested ? "已投国家详情" : "市场放贷详情";

  return (
    <MapDetailShell
      title={`${name} · ${code}`}
      subtitle={langLine ? `${langLine} · ${baseSub}` : baseSub}
      onClose={onClose}
      overlay={overlay}
    >
      {invested ? (
        <MapSection title="已投生产商">
            <MapKV k="基金投资合计" v={formatUsdCompact(invested.investment_usd)} />
          <MapKV k="热力在贷合计" v={formatUsdCompact(invested.outstanding_usd_for_heat)} />
          <MapKV k="已投平台数" v={String(invested.producers.length)} />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {invested.producers.map((p) => (
              <div key={p.id} style={producerCardStyle(theme)}>
                <div style={{ fontWeight: 600, color: c.accent, marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: c.textTertiary, marginBottom: 6 }}>{p.product_type}</div>
                <MapKV k="基金投资" v={formatUsdCompact(p.investment_usd)} />
                <MapKV k="在贷余额" v={p.outstanding_display} />
                <MapKV k="服务客户数" v={p.customers_display} />
                {p.ranking_note ? <MapKV k="排名/定位" v={p.ranking_note} /> : null}
              </div>
            ))}
          </div>
        </MapSection>
      ) : null}

      <MapSection title="市场放贷">
        {nbfc ? (
          <>
            <MapKV
              k="放贷总量(USD)"
              v={
                nbfc.lendingUsdBn > 0
                  ? `约 USD ${nbfc.lendingUsdBn >= 10 ? nbfc.lendingUsdBn.toFixed(1) : nbfc.lendingUsdBn.toFixed(2)} bn`
                  : "—"
              }
            />
            <MapKV k="机构数量口径" v={nbfc.nbfcCountDisplay} />
          </>
        ) : (
          <MapMuted>暂无 NBFC 放贷总量</MapMuted>
        )}
      </MapSection>

      {zoom ? (
        <MapSection title="人口 / Play Finance">
          <MapKV k="人口（约）" v={`${zoom.population_millions.toLocaleString()} 百万`} />
          {zoom.available !== false ? (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <MapExtLink href={chartUrl}>Play Finance 免费榜</MapExtLink>
            </div>
          ) : null}
        </MapSection>
      ) : null}
      <MapCountryMacroBrief code={code} />
    </MapDetailShell>
  );
}

/** 叠加热力：面填浅绿→深绿=市场在贷；已合作满饱和+双描边+徽章；未合作降饱和 */
export function CombinedHeatGlobe({
  height = 420,
  fill = false,
  legendPlacement = "side",
  showMarket = true,
  showInvested = true,
  showEco = false,
  ecoCounts,
  ecoLabel,
  activeCountryCodes = null,
  regionZoomCodes = null,
}: {
  height?: number;
  /** 投屏全屏：地图铺满容器 */
  fill?: boolean;
  legendPlacement?: MapLegendPlacement;
  /** 市场放贷面填 */
  showMarket?: boolean;
  /** 展业描边+徽章 / 展业面填（仅展业时） */
  showInvested?: boolean;
  /** 生态其他机构：按国别样本数打点/面填 */
  showEco?: boolean;
  ecoCounts?: Record<string, number>;
  ecoLabel?: string;
  /** 市场分类筛选：null=全市场；否则只展示这些国家 */
  activeCountryCodes?: readonly string[] | null;
  /** 区域缩放：fit 到这些国家的合集（优先于 yaw 全球视角） */
  regionZoomCodes?: readonly string[] | null;
}) {
  const { theme, c } = useMapChrome();
  const width = Math.round(height * 2.05);
  const bottomLegend = fill || legendPlacement === "bottom";
  const place: MapLegendPlacement = bottomLegend ? "bottom" : "side";
  const marketOn = showMarket;
  const investedOn = showInvested && !showEco;
  const ecoOn = Boolean(showEco && ecoCounts);
  const bothOn = marketOn && investedOn;
  const marketEcoOn = marketOn && ecoOn;
  const investedOnly = investedOn && !marketOn;
  const ecoOnly = ecoOn && !marketOn;
  const filterSet = useMemo(
    () => (activeCountryCodes ? new Set(activeCountryCodes) : null),
    [activeCountryCodes],
  );
  const inFilter = (a2: string | null | undefined) =>
    !filterSet || (a2 != null && filterSet.has(a2));
  const lendingAll = useMemo(() => aggregateLendingUsdBn(), []);
  const lending = useMemo(() => {
    if (!filterSet) return lendingAll;
    const out: Record<string, number> = {};
    for (const [code, bn] of Object.entries(lendingAll)) {
      if (filterSet.has(code) && bn > 0) out[code] = bn;
    }
    return out;
  }, [lendingAll, filterSet]);
  const lendVals = useMemo(() => Object.values(lending), [lending]);
  const maxBn = useMemo(() => Math.max(...lendVals, 1), [lendVals]);
  const minBn = useMemo(
    () => Math.min(...lendVals.filter((v) => v > 0), maxBn),
    [lendVals, maxBn],
  );

  const ecoMap = ecoCounts ?? {};
  const ecoVals = useMemo(() => Object.values(ecoMap).filter((v) => v > 0), [ecoMap]);
  const maxEco = useMemo(() => Math.max(...ecoVals, 1), [ecoVals]);
  const minEco = useMemo(
    () => Math.min(...ecoVals.filter((v) => v > 0), maxEco),
    [ecoVals, maxEco],
  );
  const countries = useMemo(() => {
    const topo = worldTopology as {
      type: "Topology";
      objects: { countries: object };
      arcs: unknown;
    };
    return feature(topo as never, topo.objects.countries as never) as unknown as FeatureCollection<
      Geometry,
      CountryProps
    >;
  }, []);

  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  /** 横向旋转角（经度，度）；拖动地图左右转动 */
  const [yaw, setYaw] = useState(0);
  const mapWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focus && filterSet && !filterSet.has(focus)) setFocus(null);
  }, [focus, filterSet]);

  const regionZoomKey = regionZoomCodes?.slice().sort().join(",") ?? "";
  useEffect(() => {
    // 切换区域缩放时退出单国放大，并复位拖拽旋转
    setFocus(null);
    setYaw(0);
    setHover(null);
  }, [regionZoomKey]);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    yaw0: number;
    moved: boolean;
    capturing: boolean;
  } | null>(null);

  function a2Of(f: Feature<Geometry, CountryProps>): string | null {
    const n3 = String(f.id);
    const stripped = normId(n3);
    return N3_TO_A2[n3] ?? N3_TO_A2[stripped] ?? N3_TO_A2[n3.padStart(3, "0")] ?? null;
  }

  const focusFeature = useMemo(() => {
    if (!focus) return null;
    const found = countries.features.find((f) => a2Of(f) === focus) ?? null;
    if (found) return found;
    if (focus === "HK") return HK_FOCUS_FEATURE;
    return null;
  }, [focus, countries]);

  const regionFeature = useMemo(() => {
    if (!regionZoomCodes?.length) return null;
    const set = new Set(regionZoomCodes);
    const feats = countries.features.filter((f) => {
      const a2 = a2Of(f);
      return a2 != null && set.has(a2);
    });
    if (!feats.length) return null;
    return {
      type: "FeatureCollection",
      features: feats,
    } as FeatureCollection<Geometry, CountryProps>;
  }, [regionZoomCodes, countries]);

  const { pathGen, outline } = useMemo(() => {
    const proj = geoNaturalEarth1();
    if (focusFeature) {
      // 焦点态：左侧放大国土，右侧留给详情浮层；上下留出顶栏
      const rightPad = bottomLegend ? Math.round(width * 0.54) : 28;
      proj.fitExtent(
        [
          [28, 64],
          [Math.max(width - rightPad, width * 0.42), height - 36],
        ],
        focusFeature,
      );
    } else if (regionFeature) {
      proj.fitExtent(
        [
          [28, 36],
          [width - 28, height - 28],
        ],
        regionFeature,
      );
    } else {
      proj.rotate([yaw, 0, 0]);
      proj.fitExtent(
        [
          [12, 12],
          [width - 12, height - 12],
        ],
        { type: "Sphere" },
      );
    }
    const pathGen = geoPath(proj);
    return { pathGen, outline: pathGen({ type: "Sphere" }) };
  }, [width, height, focusFeature, regionFeature, yaw, bottomLegend]);

  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  function pointerToLocal(clientX: number, clientY: number): { x: number; y: number } {
    const rect = mapWrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function tryFocusFromTarget(target: EventTarget | null) {
    const el = (target as Element | null)?.closest?.("[data-a2]");
    const a2 = el?.getAttribute("data-a2");
    if (a2 && interactive(a2)) {
      setFocus(a2);
      setHover(null);
    }
  }

  const lendIntensity = (bn: number) => {
    if (!(bn > 0)) return 0;
    const lo = Math.log10(minBn);
    const hi = Math.log10(maxBn);
    if (hi <= lo) return 1;
    return (Math.log10(bn) - lo) / (hi - lo);
  };

  const ecoIntensity = (n: number) => {
    if (!(n > 0)) return 0;
    if (maxEco <= 1) return 1;
    const lo = Math.log10(Math.max(minEco, 1));
    const hi = Math.log10(maxEco);
    if (hi <= lo) return 1;
    return (Math.log10(n) - lo) / (hi - lo);
  };

  const badgeMarkers = useMemo(() => {
    const items: { a2: string; x: number; y: number; platforms: number }[] = [];
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (!a2 || !INVESTED_BY_CODE[a2] || !inFilter(a2)) continue;
      const platforms = INVESTED_BY_CODE[a2].producers.length;
      if (!(platforms > 0)) continue;
      const centroid = pathGen.centroid(f);
      if (!centroid || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) continue;
      items.push({
        a2,
        x: centroid[0],
        y: centroid[1],
        platforms,
      });
    }
    return items;
  }, [countries, pathGen, filterSet]);

  const ecoMarkers = useMemo(() => {
    if (!ecoOn) return [] as { a2: string; x: number; y: number; r: number; fill: string; n: number }[];
    const items: { a2: string; x: number; y: number; r: number; fill: string; n: number }[] = [];
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (!a2 || !inFilter(a2)) continue;
      const n = ecoMap[a2] ?? 0;
      if (!(n > 0)) continue;
      const t = ecoIntensity(n);
      const centroid = pathGen.centroid(f);
      if (!centroid || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) continue;
      const r = 2.6 + Math.sqrt(Math.max(0, t)) * 4.2;
      items.push({
        a2,
        x: centroid[0],
        y: centroid[1],
        r,
        fill: heatColorAdded(t, theme),
        n,
      });
    }
    return items;
  }, [ecoOn, countries, ecoMap, pathGen, minEco, maxEco, theme, filterSet]);

  const interactive = (a2: string | null) => {
    if (!a2 || !inFilter(a2)) return false;
    const hasMkt = marketOn && (lending[a2] ?? 0) > 0;
    const hasInv = investedOn && Boolean(INVESTED_BY_CODE[a2]);
    const hasEco = ecoOn && (ecoMap[a2] ?? 0) > 0;
    return hasMkt || hasInv || hasEco;
  };

  const hoverPayload = (a2: string, name: string, x: number, y: number): HoverInfo => {
    const inv = INVESTED_BY_CODE[a2];
    return {
      a2,
      name,
      lendingBn: lending[a2] ?? 0,
      invested: Boolean(inv),
      outstandingUsd: inv?.outstanding_usd_for_heat ?? 0,
      investmentUsd: inv?.investment_usd ?? 0,
      platformCount: inv?.producers.length ?? 0,
      ecoCount: ecoMap[a2] ?? 0,
      x,
      y,
    };
  };

  return (
    <div
      style={
        bottomLegend
          ? fill
            ? {
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                minHeight: 0,
                gap: 10,
                overflow: "hidden",
              }
            : {
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 12,
              }
          : fill
            ? {
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
              }
            : {
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
                alignItems: "stretch",
              }
      }
    >
      <div
        ref={mapWrapRef}
        style={
          fill
            ? bottomLegend
              ? {
                  position: "relative",
                  flex: "1 1 0",
                  minHeight: 0,
                  width: "100%",
                  overflow: "hidden",
                  borderRadius: 8,
                  cursor: focus ? "default" : dragRef.current?.capturing ? "grabbing" : "grab",
                  touchAction: "none",
                }
              : {
                  position: "absolute",
                  inset: 0,
                  cursor: focus ? "default" : dragRef.current?.capturing ? "grabbing" : "grab",
                  touchAction: "none",
                }
            : {
                position: "relative",
                width: "100%",
                maxWidth: width,
                margin: "0 auto",
                flex: bottomLegend ? undefined : "1 1 560px",
                cursor: focus ? "default" : "grab",
                touchAction: "none",
              }
        }
        onPointerDown={(e) => {
          if (focus) return;
          if ((e.target as Element).closest?.("button,a,[data-no-drag]")) return;
          // 延迟 capture：先允许国家 path 收到点击，移动超过阈值才进入拖拽旋转
          dragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            yaw0: yaw,
            moved: false,
            capturing: false,
          };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d || d.pointerId !== e.pointerId) return;
          const dx = e.clientX - d.startX;
          if (!d.moved && Math.abs(dx) < 8) return;
          d.moved = true;
          if (!d.capturing) {
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            d.capturing = true;
            e.currentTarget.style.cursor = "grabbing";
          }
          setYaw(d.yaw0 + dx * 0.32);
          setHover(null);
        }}
        onPointerUp={(e) => {
          const d = dragRef.current;
          if (!d || d.pointerId !== e.pointerId) return;
          const wasMoved = d.moved;
          if (d.capturing) {
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
          }
          dragRef.current = null;
          e.currentTarget.style.cursor = focus ? "default" : "grab";
          if (wasMoved) return;
          // elementFromPoint 比 event.target 更稳（全屏 letterbox / 捕获边界）
          const hit =
            typeof document !== "undefined"
              ? document.elementFromPoint(e.clientX, e.clientY)
              : null;
          tryFocusFromTarget(hit ?? e.target);
        }}
        onPointerCancel={(e) => {
          const d = dragRef.current;
          if (d?.capturing) {
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
          }
          dragRef.current = null;
          e.currentTarget.style.cursor = focus ? "default" : "grab";
        }}
      >
        {focus ? (
          <div
            data-no-drag
            style={{
              position: "absolute",
              zIndex: 5,
              left: 12,
              /* 全屏时顶栏有「市场/展业」图层按钮，焦点条下移避免叠字 */
              top: fill ? 52 : 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
              maxWidth: "48%",
            }}
          >
            {/* 详情浮层已有「返回全球」；此处只标已放大，避免双按钮叠字 */}
            <MapChip>
              已放大：{COUNTRY_LABEL_ZH[focus] ?? INVESTED_BY_CODE[focus]?.country_zh ?? focus}
            </MapChip>
            {!bottomLegend ? (
              <Button variant="secondary" onClick={() => setFocus(null)}>
                返回全球
              </Button>
            ) : null}
          </div>
        ) : null}

        <MapSvgFrame width={width} height={height} fill={fill}>
          {outline ? <path d={outline} fill={c.ocean} /> : null}
          {graticulePath ? (
            <path d={graticulePath} fill="none" stroke={c.graticule} strokeWidth={0.6} />
          ) : null}

          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            const allowed = inFilter(a2);
            const bn = allowed && a2 ? (lending[a2] ?? 0) : 0;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const ecoN = allowed && a2 ? (ecoMap[a2] ?? 0) : 0;
            const isInvested = Boolean(allowed && a2 && INVESTED_BY_CODE[a2]);
            let landFill = c.emptyLand;
            if (!allowed) {
              landFill = c.emptyLand;
            } else if (ecoOnly) {
              landFill = ecoN > 0 ? heatColorAdded(ecoIntensity(ecoN), theme) : c.emptyLand;
            } else if (investedOnly) {
              // 仅展业：浅绿底标出已合作国家，平台数由描边+徽章表达
              landFill = isInvested ? "#A5D6A7" : c.emptyLand;
            } else if (marketOn && bn > 0) {
              const t = lendIntensity(bn);
              // 叠展业层时：合作国满饱和，其余降饱和，拉开差别
              landFill =
                bothOn && !isInvested
                  ? heatColorLoanMuted(t, theme)
                  : heatColorRemoved(t, theme);
            } else if (ecoOn && ecoN > 0 && !marketOn) {
              landFill = heatColorAdded(ecoIntensity(ecoN), theme);
            }
            return (
              <path
                key={`base-${f.id ?? i}`}
                d={d}
                data-a2={a2 ?? undefined}
                fill={landFill}
                stroke={c.landStroke}
                strokeWidth={0.35}
                opacity={dimmed ? 0.18 : 1}
                style={{ cursor: interactive(a2) ? "pointer" : "inherit" }}
                onMouseEnter={(ev) => {
                  if (dragRef.current?.moved || dragRef.current?.capturing) return;
                  if (!a2 || !interactive(a2)) {
                    setHover(null);
                    return;
                  }
                  const inv = INVESTED_BY_CODE[a2];
                  const loc = pointerToLocal(ev.clientX, ev.clientY);
                  setHover(
                    hoverPayload(
                      a2,
                      COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
                      loc.x,
                      loc.y,
                    ),
                  );
                }}
                onMouseMove={(ev) => {
                  if (dragRef.current?.moved || dragRef.current?.capturing) return;
                  if (!a2 || !interactive(a2)) return;
                  const inv = INVESTED_BY_CODE[a2];
                  const loc = pointerToLocal(ev.clientX, ev.clientY);
                  setHover(
                    hoverPayload(
                      a2,
                      COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
                      loc.x,
                      loc.y,
                    ),
                  );
                }}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}

          {investedOn
            ? countries.features.map((f, i) => {
                const a2 = a2Of(f);
                if (!a2 || !INVESTED_BY_CODE[a2] || !inFilter(a2)) return null;
                const d = pathGen(f);
                if (!d) return null;
                const isFocus = focus != null && a2 === focus;
                const dimmed = focus != null && !isFocus;
                const platforms = INVESTED_BY_CODE[a2].producers.length;
                return (
                  <InvestedCountryOutline
                    key={`inv-${f.id ?? i}`}
                    d={d}
                    platforms={platforms}
                    focused={isFocus}
                    dimmed={dimmed}
                  />
                );
              })
            : null}

          {marketEcoOn
            ? countries.features.map((f, i) => {
                const a2 = a2Of(f);
                if (!a2 || !inFilter(a2) || !(ecoMap[a2] > 0)) return null;
                const d = pathGen(f);
                if (!d) return null;
                const isFocus = focus != null && a2 === focus;
                const dimmed = focus != null && !isFocus;
                return (
                  <path
                    key={`eco-outline-${f.id ?? i}`}
                    d={d}
                    fill="none"
                    stroke={c.accent}
                    strokeWidth={isFocus ? 2 : 1.15}
                    opacity={dimmed ? 0.15 : 0.8}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })
            : null}

          {!focus && investedOn
            ? badgeMarkers.map((m) => (
                <InvestedBadge
                  key={`badge-${m.a2}`}
                  cx={m.x}
                  cy={m.y}
                  count={m.platforms}
                  dimmed={focus != null && focus !== m.a2}
                />
              ))
            : null}

          {!focus && (marketEcoOn || (ecoOn && !ecoOnly))
            ? ecoMarkers.map((m) => (
                <g key={`eco-m-${m.a2}`} style={{ pointerEvents: "none" }}>
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={m.r}
                    fill={m.fill}
                    stroke={c.panelBg}
                    strokeWidth={1}
                    opacity={0.92}
                  />
                </g>
              ))
            : null}

          {outline ? <path d={outline} fill="none" stroke={c.outline} strokeWidth={1} /> : null}
        </MapSvgFrame>

        {hover && !focus ? (
          <MapTooltip
            left={Math.min(hover.x + 12, (mapWrapRef.current?.clientWidth ?? width) - 210)}
            top={Math.max(8, hover.y - 64)}
            accent={hover.invested && investedOn ? "added" : "removed"}
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            {marketOn ? (
              hover.lendingBn > 0 ? (
                <div style={{ color: c.removed }}>市场放贷 ≈ USD {hover.lendingBn.toFixed(2)} bn</div>
              ) : (
                <div style={{ color: c.textTertiary }}>市场放贷总量暂无</div>
              )
            ) : null}
            {investedOn && hover.invested ? (
              <div style={{ color: c.added }}>
                已合作 {hover.platformCount} 平台 · 展业在贷 {formatUsdCompact(hover.outstandingUsd)} · 基金{" "}
                {formatUsdCompact(hover.investmentUsd)}
              </div>
            ) : null}
            {ecoOn && hover.ecoCount > 0 ? (
              <div style={{ color: c.added }}>
                {ecoLabel ?? "生态机构"} · {hover.ecoCount} 家样本
              </div>
            ) : null}
          </MapTooltip>
        ) : null}

        {focus && bottomLegend ? (
          <DetailPanel code={focus} onClose={() => setFocus(null)} overlay />
        ) : null}
      </div>

      {focus && !bottomLegend ? (
        <DetailPanel code={focus} onClose={() => setFocus(null)} />
      ) : null}
      {!focus ? (
        <MapSideLegend
          title={
            marketEcoOn
              ? `市场 × ${ecoLabel ?? "其他机构"}`
              : ecoOnly
                ? `${ecoLabel ?? "其他机构"}分布`
                : bothOn
                  ? "市场 × 展业"
                  : marketOn
                    ? "市场图例"
                    : "展业图例"
          }
          placement={place}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: bottomLegend ? 16 : 0,
              alignItems: "flex-end",
            }}
          >
            {marketOn ? (
              <SteppedLegend
                label="市场在贷余额"
                kind="loan"
                compact={bottomLegend}
              />
            ) : null}
            {investedOn ? (
              <div
                style={{
                  flex: bottomLegend ? "1 1 160px" : undefined,
                  minWidth: bottomLegend ? 140 : undefined,
                }}
              >
                <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 4 }}>
                  已投平台数
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <InvestedBadgeLegendSample />
                </div>
              </div>
            ) : null}
            {ecoOn ? (
              <SteppedLegend
                label={`${ecoLabel ?? "其他机构"}样本数`}
                kind="accent"
                compact={bottomLegend}
              />
            ) : null}
          </div>
        </MapSideLegend>
      ) : null}
    </div>
  );
}
