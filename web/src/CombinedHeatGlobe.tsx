import { useMemo, useRef, useState } from "react";
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
  PRODUCER_HOLDINGS,
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
  RankBarList,
  type MapLegendPlacement,
} from "./HeatMapChrome";
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
const HK_LONLAT: [number, number] = [114.17, 22.32];

type HoverInfo = {
  a2: string;
  name: string;
  lendingBn: number;
  invested: boolean;
  outstandingUsd: number;
  investmentUsd: number;
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
  const baseSub = invested
    ? "已投国家 · 面填=市场放贷 / 圆点大小=已投在贷"
    : "市场放贷详情";

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

/** 叠加热力：面填灰阶=市场放贷强弱；圆点大小(+强调色)=已投在贷 / 生态机构数 */
export function CombinedHeatGlobe({
  height = 420,
  fill = false,
  legendPlacement = "side",
  showMarket = true,
  showInvested = true,
  showEco = false,
  ecoCounts,
  ecoLabel,
}: {
  height?: number;
  /** 投屏全屏：地图铺满容器 */
  fill?: boolean;
  legendPlacement?: MapLegendPlacement;
  /** 市场放贷面填 */
  showMarket?: boolean;
  /** 展业圆点 / 展业面填（仅展业时） */
  showInvested?: boolean;
  /** 生态其他机构：按国别样本数打点/面填 */
  showEco?: boolean;
  ecoCounts?: Record<string, number>;
  ecoLabel?: string;
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
  const lending = useMemo(() => aggregateLendingUsdBn(), []);
  const lendVals = useMemo(() => Object.values(lending), [lending]);
  const maxBn = useMemo(() => Math.max(...lendVals, 1), [lendVals]);
  const minBn = useMemo(
    () => Math.min(...lendVals.filter((v) => v > 0), maxBn),
    [lendVals, maxBn],
  );

  const investedOutstanding = useMemo(() => {
    const out: Record<string, number> = {};
    for (const country of PRODUCER_HOLDINGS.countries) {
      if (country.outstanding_usd_for_heat > 0) out[country.country_code] = country.outstanding_usd_for_heat;
    }
    return out;
  }, []);
  const invVals = useMemo(() => Object.values(investedOutstanding), [investedOutstanding]);
  const maxInv = useMemo(() => Math.max(...invVals, 1), [invVals]);
  const minInv = useMemo(
    () => Math.min(...invVals.filter((v) => v > 0), maxInv),
    [invVals, maxInv],
  );

  const ecoMap = ecoCounts ?? {};
  const ecoVals = useMemo(() => Object.values(ecoMap).filter((v) => v > 0), [ecoMap]);
  const maxEco = useMemo(() => Math.max(...ecoVals, 1), [ecoVals]);
  const minEco = useMemo(
    () => Math.min(...ecoVals.filter((v) => v > 0), maxEco),
    [ecoVals, maxEco],
  );
  const ecoRanked = useMemo(
    () =>
      Object.entries(ecoMap)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1]),
    [ecoMap],
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

  const { pathGen, outline, projection } = useMemo(() => {
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
    return { pathGen, outline: pathGen({ type: "Sphere" }), projection: proj };
  }, [width, height, focusFeature, yaw, bottomLegend]);

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

  const invIntensity = (usd: number) => {
    if (!(usd > 0)) return 0;
    const lo = Math.log10(minInv);
    const hi = Math.log10(maxInv);
    if (hi <= lo) return 1;
    return (Math.log10(usd) - lo) / (hi - lo);
  };

  const ecoIntensity = (n: number) => {
    if (!(n > 0)) return 0;
    if (maxEco <= 1) return 1;
    const lo = Math.log10(Math.max(minEco, 1));
    const hi = Math.log10(maxEco);
    if (hi <= lo) return 1;
    return (Math.log10(n) - lo) / (hi - lo);
  };

  const investedRanked = useMemo(
    () =>
      [...PRODUCER_HOLDINGS.countries].sort(
        (a, b) => b.outstanding_usd_for_heat - a.outstanding_usd_for_heat,
      ),
    [],
  );

  const mapCodes = useMemo(() => {
    const set = new Set<string>();
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (a2) set.add(a2);
    }
    return set;
  }, [countries]);

  const markers = useMemo(() => {
    const items: { a2: string; x: number; y: number; r: number; fill: string; usd: number }[] = [];
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (!a2 || !INVESTED_BY_CODE[a2]) continue;
      const usd = investedOutstanding[a2] ?? 0;
      const t = invIntensity(usd);
      const centroid = pathGen.centroid(f);
      if (!centroid || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) continue;
      // 比例符号：半径按 √强度（近似面积正比），上限压低，避免盖住国土被误读为「整国体量」
      const r = 2.4 + Math.sqrt(Math.max(0, t)) * 3.6; // ≈2.4–6.0
      items.push({
        a2,
        x: centroid[0],
        y: centroid[1],
        r,
        fill: heatColorAdded(t, theme),
        usd,
      });
    }
    return items;
  }, [countries, investedOutstanding, pathGen, minInv, maxInv, theme]);

  const ecoMarkers = useMemo(() => {
    if (!ecoOn) return [] as { a2: string; x: number; y: number; r: number; fill: string; n: number }[];
    const items: { a2: string; x: number; y: number; r: number; fill: string; n: number }[] = [];
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (!a2) continue;
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
  }, [ecoOn, countries, ecoMap, pathGen, minEco, maxEco, theme]);

  const interactive = (a2: string | null) => {
    if (!a2) return false;
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
            const bn = a2 ? (lending[a2] ?? 0) : 0;
            const invUsd = a2 ? (investedOutstanding[a2] ?? 0) : 0;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const ecoN = a2 ? (ecoMap[a2] ?? 0) : 0;
            let landFill = c.emptyLand;
            if (ecoOnly) {
              landFill = ecoN > 0 ? heatColorAdded(ecoIntensity(ecoN), theme) : c.emptyLand;
            } else if (investedOnly) {
              landFill = invUsd > 0 ? heatColorAdded(invIntensity(invUsd), theme) : c.emptyLand;
            } else if (marketOn && bn > 0) {
              landFill = heatColorRemoved(lendIntensity(bn), theme);
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

          {bothOn
            ? countries.features.map((f, i) => {
                const a2 = a2Of(f);
                if (!a2 || !INVESTED_BY_CODE[a2]) return null;
                const d = pathGen(f);
                if (!d) return null;
                const isFocus = focus != null && a2 === focus;
                const dimmed = focus != null && !isFocus;
                return (
                  <path
                    key={`inv-${f.id ?? i}`}
                    d={d}
                    fill="none"
                    stroke={c.accent}
                    strokeWidth={isFocus ? 2 : 1.25}
                    opacity={dimmed ? 0.15 : 0.85}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })
            : null}

          {marketEcoOn
            ? countries.features.map((f, i) => {
                const a2 = a2Of(f);
                if (!a2 || !(ecoMap[a2] > 0)) return null;
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

          {!focus && bothOn
            ? markers.map((m) => (
                <g key={`m-${m.a2}`} style={{ pointerEvents: "none" }}>
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

          {/* 中国香港：110m 无面，锚点可点 */}
          {(() => {
            if (!interactive("HK") || mapCodes.has("HK")) return null;
            const pt = projection(HK_LONLAT);
            if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) return null;
            const isFocus = focus === "HK";
            const dimmed = focus != null && !isFocus;
            if (dimmed) return null;
            const usd = investedOutstanding.HK ?? 0;
            const ecoN = ecoMap.HK ?? 0;
            const r = bothOn
              ? 2.4 + Math.sqrt(Math.max(0, invIntensity(usd))) * 3.6
              : marketEcoOn || (ecoOn && ecoN > 0)
                ? 2.6 + Math.sqrt(Math.max(0, ecoIntensity(ecoN || 1))) * 4.2
                : 7;
            const dotFill = ecoOn && ecoN > 0
              ? heatColorAdded(ecoIntensity(ecoN), theme)
              : heatColorAdded(invIntensity(usd || 1), theme);
            return (
              <g
                data-a2="HK"
                style={{ cursor: "pointer" }}
                onMouseEnter={(ev) => {
                  if (dragRef.current?.moved || dragRef.current?.capturing) return;
                  const inv = INVESTED_BY_CODE.HK;
                  const loc = pointerToLocal(ev.clientX, ev.clientY);
                  setHover(
                    hoverPayload(
                      "HK",
                      COUNTRY_LABEL_ZH.HK ?? inv?.country_zh ?? "中国香港",
                      loc.x,
                      loc.y,
                    ),
                  );
                }}
                onMouseLeave={() => setHover(null)}
              >
                <circle
                  cx={pt[0]}
                  cy={pt[1]}
                  r={r + 6}
                  fill="transparent"
                  stroke={c.accent}
                  strokeWidth={isFocus ? 2 : 1.25}
                  opacity={0.9}
                />
                <circle
                  cx={pt[0]}
                  cy={pt[1]}
                  r={r}
                  fill={dotFill}
                  stroke={c.panelBg}
                  strokeWidth={1}
                  opacity={0.95}
                />
                {!focus ? (
                  <text
                    x={pt[0] + r + 8}
                    y={pt[1] + 4}
                    fill={c.text}
                    fontSize={11}
                    fontWeight={600}
                    style={{ pointerEvents: "none" }}
                  >
                    中国香港
                  </text>
                ) : null}
              </g>
            );
          })()}

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
                展业在贷 {formatUsdCompact(hover.outstandingUsd)} · 基金{" "}
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
              gap: bottomLegend ? 12 : 0,
              marginBottom: bottomLegend ? 8 : 0,
            }}
          >
            {marketOn ? (
              <SteppedLegend
                label="面填 · 非银/等效放贷总量（灰阶浅→深；非 AUM）"
                kind="gray"
                compact={bottomLegend}
              />
            ) : null}
            {investedOn ? (
              <SteppedLegend
                label={
                  bothOn
                    ? "圆点 · 展业在贷（相对大小，非国土面积）"
                    : "面填 · 展业在贷（浅→深）"
                }
                kind="accent"
                compact={bottomLegend}
              />
            ) : null}
            {ecoOn ? (
              <SteppedLegend
                label={
                  marketEcoOn
                    ? `圆点 · ${ecoLabel ?? "其他机构"}样本数`
                    : `面填 · ${ecoLabel ?? "其他机构"}样本数（浅→深）`
                }
                kind="accent"
                compact={bottomLegend}
              />
            ) : null}
          </div>
          {ecoOn ? (
            <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>
              {ecoLabel ?? "其他机构"}覆盖 {ecoRanked.length} 国 · 样本{" "}
              {ecoRanked.reduce((s, [, n]) => s + n, 0)} 家 · 点击横条放大
            </div>
          ) : investedOn ? (
            <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>
              展业 {investedRanked.length} 国 · 基金合计{" "}
              {formatUsdCompact(PRODUCER_HOLDINGS.total_investment_usd)} · 点击横条放大
            </div>
          ) : (
            <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>
              有市场放贷读数 · 点击横条可放大
            </div>
          )}
          <RankBarList
            compact={false}
            maxVisible={bottomLegend ? 20 : undefined}
            scaleHint={
              ecoOn
                ? `条长 ∝ ${ecoLabel ?? "其他机构"}样本数`
                : investedOn
                  ? "条长 ∝ 展业在贷（相对列表最大值）"
                  : "条长 ∝ 市场放贷 USD bn（相对列表最大值）"
            }
            onSelect={(code) => setFocus(code)}
            items={
              ecoOn
                ? ecoRanked.map(([code, n]) => ({
                    key: code,
                    label: COUNTRY_LABEL_ZH[code] ?? code,
                    value: n,
                    valueLabel: `${n} 家`,
                    secondaryLabel:
                      marketEcoOn && lending[code]
                        ? `市场约 USD ${lending[code].toFixed(1)} bn`
                        : undefined,
                  }))
                : investedOn
                  ? investedRanked.map((row) => ({
                      key: row.country_code,
                      label: COUNTRY_LABEL_ZH[row.country_code] ?? row.country_zh,
                      value: row.outstanding_usd_for_heat,
                      valueLabel: formatUsdCompact(row.outstanding_usd_for_heat),
                      secondaryLabel:
                        bothOn && lending[row.country_code]
                          ? `市场约 USD ${lending[row.country_code].toFixed(1)} bn`
                          : undefined,
                    }))
                  : Object.entries(lending)
                      .filter(([, bn]) => bn > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([code, bn]) => ({
                        key: code,
                        label: COUNTRY_LABEL_ZH[code] ?? code,
                        value: bn,
                        valueLabel: `USD ${bn >= 10 ? bn.toFixed(1) : bn.toFixed(2)} bn`,
                      }))
            }
          />
          {(investedOn || ecoOn) && (INVESTED_BY_CODE.HK || (ecoMap.HK ?? 0) > 0) && !mapCodes.has("HK") ? (
            <div style={{ marginTop: 10, fontSize: 11, color: c.textSecondary, lineHeight: 1.5 }}>
              中国香港在底图无独立面，地图上以锚点标出，可直接点击。
            </div>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <MapMuted>
              {marketEcoOn
                ? `面填=市场放贷灰阶；圆点=${ecoLabel ?? "其他机构"}样本数。可与市场对照。`
                : bothOn
                  ? "面填=市场放贷灰阶；圆点=展业在贷规模。切换图层不重载底图。"
                  : marketOn
                    ? "面填=市场放贷灰阶。"
                    : ecoOnly
                      ? `面填=${ecoLabel ?? "其他机构"}样本数强弱。`
                      : "面填=展业在贷强弱。"}
            </MapMuted>
          </div>
        </MapSideLegend>
      ) : null}
    </div>
  );
}
