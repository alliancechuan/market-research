import { useMemo, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldTopology from "world-atlas/countries-110m.json";
import { COUNTRY_LABEL_ZH } from "./data/nbfcCountryStats";
import {
  INVESTED_BY_CODE,
  PRODUCER_HOLDINGS,
  formatUsdCompact,
  type InvestedCountry,
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
  useMapChrome,
  producerCardStyle,
  Button,
  MapCountryMacroBrief,
  RankBarList,
  type MapLegendPlacement,
} from "./HeatMapChrome";
import { heatColorAdded } from "./heatMapTheme";
import { formatCountryLanguageLine } from "./data/countryLanguage";
import { aggregateLendingUsdBn } from "./LendingHeatGlobe";

type CountryProps = { name?: string };

const N3_TO_A2: Record<string, string> = {
  "356": "IN",
  "156": "CN",
  "392": "JP",
  "360": "ID",
  "764": "TH",
  "458": "MY",
  "484": "MX",
  "608": "PH",
  "344": "HK",
  "704": "VN",
  "410": "KR",
  "158": "TW",
  "840": "US",
  "076": "BR",
  "76": "BR",
  "710": "ZA",
  "566": "NG",
  "404": "KE",
  "643": "RU",
  "702": "SG",
};

function normId(id: string | number | undefined): string {
  if (id == null) return "";
  return String(id).replace(/^0+/, "") || "0";
}

function aggregateInvestedOutstandingUsd(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of PRODUCER_HOLDINGS.countries) {
    if (c.outstanding_usd_for_heat > 0) out[c.country_code] = c.outstanding_usd_for_heat;
  }
  return out;
}


type HoverInfo = {
  a2: string;
  name: string;
  outstandingUsd: number;
  investmentUsd: number;
  producerCount: number;
  x: number;
  y: number;
};

function CountryDetailPanel({
  code,
  invested,
  onClose,
  overlay = false,
}: {
  code: string;
  invested: InvestedCountry | undefined;
  onClose: () => void;
  overlay?: boolean;
}) {
  const { theme, c } = useMapChrome();
  const name = COUNTRY_LABEL_ZH[code] ?? invested?.country_zh ?? code;
  const langLine = formatCountryLanguageLine(code);
  return (
    <MapDetailShell
      title={`${name} · ${code}`}
      subtitle={langLine ? `${langLine} · 已投生产商详情` : "已投生产商详情"}
      onClose={onClose}
      overlay={overlay}
    >
      <MapSection title="已投生产商">
        {invested ? (
          <>
            <MapKV k="基金投资合计" v={formatUsdCompact(invested.investment_usd)} />
            <MapKV k="热力在贷合计" v={formatUsdCompact(invested.outstanding_usd_for_heat)} />
            <MapKV k="平台数" v={String(invested.producers.length)} />
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {invested.producers.map((p) => (
                <div key={p.id} style={producerCardStyle(theme)}>
                  <div style={{ fontWeight: 600, color: c.added, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ color: c.textTertiary, marginBottom: 6 }}>{p.product_type}</div>
                  <MapKV k="基金投资" v={formatUsdCompact(p.investment_usd)} />
                  <MapKV k="在贷余额" v={p.outstanding_display} />
                  <MapKV k="服务客户数" v={p.customers_display} />
                  {p.ranking_note ? <MapKV k="排名/定位" v={p.ranking_note} /> : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <MapMuted>该国暂无已投生产商记录</MapMuted>
        )}
      </MapSection>
      <MapCountryMacroBrief code={code} />
    </MapDetailShell>
  );
}

export function InvestedHeatGlobe({
  height = 420,
  fill = false,
  legendPlacement = "side",
}: {
  height?: number;
  fill?: boolean;
  legendPlacement?: MapLegendPlacement;
}) {
  const { theme, c } = useMapChrome();
  const width = Math.round(height * 2.05);
  const bottomLegend = fill || legendPlacement === "bottom";
  const place: MapLegendPlacement = bottomLegend ? "bottom" : "side";
  const outstanding = useMemo(() => aggregateInvestedOutstandingUsd(), []);
  const values = useMemo(() => Object.values(outstanding), [outstanding]);
  const maxUsd = useMemo(() => Math.max(...values, 1), [values]);
  const minUsd = useMemo(
    () => Math.min(...values.filter((v) => v > 0), maxUsd),
    [values, maxUsd],
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

  function a2Of(f: Feature<Geometry, CountryProps>): string | null {
    const n3 = String(f.id);
    const stripped = normId(n3);
    return N3_TO_A2[n3] ?? N3_TO_A2[stripped] ?? N3_TO_A2[n3.padStart(3, "0")] ?? null;
  }

  const focusFeature = useMemo(() => {
    if (!focus) return null;
    return countries.features.find((f) => a2Of(f) === focus) ?? null;
  }, [focus, countries]);

  const { pathGen, outline, project } = useMemo(() => {
    const projection = geoNaturalEarth1();
    if (focusFeature) {
      projection.fitExtent(
        [
          [24, 24],
          [width - 24, height - 24],
        ],
        focusFeature,
      );
    } else {
      projection.fitExtent(
        [
          [12, 12],
          [width - 12, height - 12],
        ],
        { type: "Sphere" },
      );
    }
    const pathGen = geoPath(projection);
    return {
      pathGen,
      outline: pathGen({ type: "Sphere" }),
      project: (lon: number, lat: number) => projection([lon, lat]) as [number, number] | null,
    };
  }, [width, height, focusFeature]);

  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const intensity = (usd: number) => {
    if (!(usd > 0)) return 0;
    const lo = Math.log10(minUsd);
    const hi = Math.log10(maxUsd);
    if (hi <= lo) return 1;
    return (Math.log10(usd) - lo) / (hi - lo);
  };

  const ranked = useMemo(
    () =>
      [...PRODUCER_HOLDINGS.countries].sort(
        (a, b) => b.outstanding_usd_for_heat - a.outstanding_usd_for_heat,
      ),
    [],
  );

  const marketLending = useMemo(() => aggregateLendingUsdBn(), []);

  const mapCodes = useMemo(() => {
    const set = new Set<string>();
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (a2) set.add(a2);
    }
    return set;
  }, [countries]);

  type DotPoint = {
    a2: string;
    name: string;
    outstandingUsd: number;
    investmentUsd: number;
    producerCount: number;
    x: number;
    y: number;
    t: number;
    r: number;
    hasMarket: boolean;
  };

  const dots = useMemo(() => {
    const out: DotPoint[] = [];
    const seen = new Set<string>();
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (!a2) continue;
      const inv = INVESTED_BY_CODE[a2];
      const usd = outstanding[a2] ?? inv?.outstanding_usd_for_heat ?? 0;
      if (!(usd > 0) && !inv) continue;
      const cen = pathGen.centroid(f);
      if (!cen || !Number.isFinite(cen[0]) || !Number.isFinite(cen[1])) continue;
      const t = intensity(Math.max(usd, 1e-6));
      out.push({
        a2,
        name: COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
        outstandingUsd: inv?.outstanding_usd_for_heat ?? usd,
        investmentUsd: inv?.investment_usd ?? 0,
        producerCount: inv?.producers.length ?? 0,
        x: cen[0],
        y: cen[1],
        t,
        r: 3.6 + t * (fill ? 8.5 : 6.5),
        hasMarket: Boolean(marketLending[a2] && marketLending[a2] > 0),
      });
      seen.add(a2);
    }
    // 香港：110m 底图无独立面，锚点标出
    if (INVESTED_BY_CODE.HK && !seen.has("HK")) {
      const xy = project(114.17, 22.32);
      if (xy) {
        const inv = INVESTED_BY_CODE.HK;
        const usd = inv.outstanding_usd_for_heat;
        const t = intensity(Math.max(usd, 1e-6));
        out.push({
          a2: "HK",
          name: COUNTRY_LABEL_ZH.HK ?? inv.country_zh ?? "香港",
          outstandingUsd: usd,
          investmentUsd: inv.investment_usd,
          producerCount: inv.producers.length,
          x: xy[0],
          y: xy[1],
          t,
          r: 3.6 + t * (fill ? 8.5 : 6.5),
          hasMarket: Boolean(marketLending.HK && marketLending.HK > 0),
        });
      }
    }
    out.sort((a, b) => a.r - b.r);
    return out;
  }, [countries, outstanding, pathGen, project, fill, minUsd, maxUsd, marketLending]);

  const callouts = useMemo(() => {
    if (focus) return [] as DotPoint[];
    const byCode = new Map(dots.map((d) => [d.a2, d]));
    return ranked
      .slice(0, 3)
      .map((row) => byCode.get(row.country_code))
      .filter(Boolean) as DotPoint[];
  }, [dots, ranked, focus]);

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
                }
              : { position: "absolute", inset: 0 }
            : {
                position: "relative",
                width: "100%",
                maxWidth: width,
                margin: "0 auto",
                flex: bottomLegend ? undefined : "1 1 560px",
              }
        }
      >
        {focus ? (
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
            <Button variant="secondary" onClick={() => setFocus(null)}>
              返回全球
            </Button>
            <MapChip>
              已放大：{COUNTRY_LABEL_ZH[focus] ?? INVESTED_BY_CODE[focus]?.country_zh ?? focus}
            </MapChip>
          </div>
        ) : null}

        <MapSvgFrame width={width} height={height} fill={fill}>
          {outline ? <path d={outline} fill={c.ocean} /> : null}
          {graticulePath ? (
            <path d={graticulePath} fill="none" stroke={c.graticule} strokeWidth={0.45} opacity={0.55} />
          ) : null}
          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            const usd = a2 ? (outstanding[a2] ?? 0) : 0;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const clickable = Boolean(a2 && (usd > 0 || INVESTED_BY_CODE[a2]));
            return (
              <path
                key={`land-${f.id ?? i}`}
                d={d}
                fill={isFocus ? "#E4EAF0" : c.emptyLand}
                stroke={isFocus ? c.added : c.landStroke}
                strokeWidth={isFocus ? 1.35 : 0.35}
                opacity={dimmed ? 0.18 : 1}
                style={{ cursor: clickable ? "pointer" : "default" }}
                onClick={() => {
                  if (clickable && a2) {
                    setFocus(a2);
                    setHover(null);
                  }
                }}
              />
            );
          })}
          {dots.map((p) => {
            const isFocus = focus != null && p.a2 === focus;
            const dimmed = focus != null && !isFocus;
            const rr = isFocus ? p.r * 1.25 : p.r;
            return (
              <g
                key={`dot-${p.a2}`}
                opacity={dimmed ? 0.2 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setFocus(p.a2);
                  setHover(null);
                }}
                onMouseEnter={(ev) => {
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2: p.a2,
                    name: p.name,
                    outstandingUsd: p.outstandingUsd,
                    investmentUsd: p.investmentUsd,
                    producerCount: p.producerCount,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseMove={(ev) => {
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2: p.a2,
                    name: p.name,
                    outstandingUsd: p.outstandingUsd,
                    investmentUsd: p.investmentUsd,
                    producerCount: p.producerCount,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={rr}
                  fill={heatColorAdded(p.t, theme)}
                  stroke={isFocus ? c.added : "#F5FAFF"}
                  strokeWidth={isFocus ? 1.6 : 0.9}
                />
                {p.hasMarket ? (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={rr + 2.4}
                    fill="none"
                    stroke={c.ink}
                    strokeWidth={1.1}
                    opacity={0.75}
                  />
                ) : null}
              </g>
            );
          })}
          {!focus
            ? callouts.map((p, i) => {
                const side = p.x > width * 0.55 ? -1 : 1;
                const lx = p.x + side * (28 + i * 6);
                const ly = Math.max(28, Math.min(height - 36, p.y - 22 - i * 10));
                const label = `${COUNTRY_LABEL_ZH[p.a2] ?? p.a2} ${formatUsdCompact(p.outstandingUsd)}`;
                const tw = Math.min(140, 12 + label.length * 6.4);
                return (
                  <g key={`call-${p.a2}`} pointerEvents="none">
                    <line
                      x1={p.x}
                      y1={p.y}
                      x2={lx}
                      y2={ly}
                      stroke={c.textTertiary}
                      strokeWidth={0.8}
                      strokeDasharray="2 2"
                    />
                    <circle cx={p.x} cy={p.y} r={p.r + 3.5} fill="none" stroke={c.added} strokeWidth={0.9} />
                    <rect
                      x={side > 0 ? lx : lx - tw}
                      y={ly - 11}
                      width={tw}
                      height={18}
                      rx={3}
                      fill={c.panelBg}
                      stroke={c.panelBorder}
                      strokeWidth={0.8}
                    />
                    <text
                      x={side > 0 ? lx + 5 : lx - 5}
                      y={ly + 2}
                      textAnchor={side > 0 ? "start" : "end"}
                      fill={c.text}
                      fontSize={10}
                      fontFamily="system-ui, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                );
              })
            : null}
          {outline ? <path d={outline} fill="none" stroke={c.outline} strokeWidth={1} /> : null}
        </MapSvgFrame>

        {hover && !focus ? (
          <MapTooltip
            left={Math.min(hover.x + 12, width - 200)}
            top={Math.max(8, hover.y - 56)}
            accent="added"
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            <div style={{ color: c.added }}>在贷(热力) {formatUsdCompact(hover.outstandingUsd)}</div>
            <div style={{ color: c.textSecondary }}>
              基金 {formatUsdCompact(hover.investmentUsd)} · {hover.producerCount} 家平台
            </div>
          </MapTooltip>
        ) : null}

        {focus && bottomLegend ? (
          <CountryDetailPanel
            code={focus}
            invested={INVESTED_BY_CODE[focus]}
            onClose={() => setFocus(null)}
            overlay
          />
        ) : null}
      </div>

      {focus && !bottomLegend ? (
        <CountryDetailPanel
          code={focus}
          invested={INVESTED_BY_CODE[focus]}
          onClose={() => setFocus(null)}
        />
      ) : null}
      {!focus ? (
        <MapSideLegend title="展业 · 点阵图例" placement={place}>
          <SteppedLegend label="在贷余额 · 点色/点径 少 → 多" kind="added" compact={bottomLegend} />
          <div
            style={{
              fontSize: 12,
              color: c.textSecondary,
              marginBottom: 8,
              marginTop: bottomLegend ? 8 : 0,
            }}
          >
            浅底透图 · 色点 {ranked.length} 国 · 基金合计 {formatUsdCompact(PRODUCER_HOLDINGS.total_investment_usd)}
            · 墨细环=市场放贷对照 · 点击点/横条放大
          </div>
          <RankBarList
            compact={false}
            maxVisible={bottomLegend ? 20 : undefined}
            scaleHint="条长 ∝ 展业在贷（相对列表最大值）"
            onSelect={(code) => setFocus(code)}
            items={ranked.map((row) => ({
              key: row.country_code,
              label: COUNTRY_LABEL_ZH[row.country_code] ?? row.country_zh,
              value: row.outstanding_usd_for_heat,
              valueLabel: formatUsdCompact(row.outstanding_usd_for_heat),
            }))}
          />
          {INVESTED_BY_CODE.HK && !mapCodes.has("HK") ? (
            <div style={{ marginTop: 10, fontSize: 11, color: c.textSecondary, lineHeight: 1.5 }}>
              中国香港在底图无独立面，地图上以锚点标出，可直接点击。
            </div>
          ) : null}
        </MapSideLegend>
      ) : null}
    </div>
  );
}
