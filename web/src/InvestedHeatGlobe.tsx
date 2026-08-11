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
  MapSideLegend,
  MapMuted,
  useMapChrome,
  producerCardStyle,
  Button,
  InvestedBadge,
  InvestedBadgeLegendSample,
  InvestedCountryOutline,
  MapCountryMacroBrief,
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
  const { c } = useMapChrome();
  const width = Math.round(height * 2.05);
  const bottomLegend = fill || legendPlacement === "bottom";
  const place: MapLegendPlacement = bottomLegend ? "bottom" : "side";
  const outstanding = useMemo(() => aggregateInvestedOutstandingUsd(), []);

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

  const { pathGen, outline } = useMemo(() => {
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
    return { pathGen, outline: pathGen({ type: "Sphere" }) };
  }, [width, height, focusFeature]);

  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const badgeMarkers = useMemo(() => {
    const items: { a2: string; x: number; y: number; platforms: number }[] = [];
    for (const f of countries.features) {
      const a2 = a2Of(f);
      if (!a2 || !INVESTED_BY_CODE[a2]) continue;
      const platforms = INVESTED_BY_CODE[a2].producers.length;
      if (!(platforms > 0)) continue;
      const centroid = pathGen.centroid(f);
      if (!centroid || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) continue;
      items.push({ a2, x: centroid[0], y: centroid[1], platforms });
    }
    return items;
  }, [countries, pathGen]);

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
            <path d={graticulePath} fill="none" stroke={c.graticule} strokeWidth={0.6} />
          ) : null}
          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            const usd = a2 ? (outstanding[a2] ?? 0) : 0;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const invested = Boolean(a2 && INVESTED_BY_CODE[a2]);
            const platforms = invested && a2 ? INVESTED_BY_CODE[a2].producers.length : 0;
            const landFill = invested ? "#A5D6A7" : c.emptyLand;
            return (
              <g key={`${f.id ?? i}`}>
                <path
                  d={d}
                  fill={landFill}
                  stroke={c.landStroke}
                  strokeWidth={0.35}
                  opacity={dimmed ? 0.22 : 1}
                  style={{ cursor: invested ? "pointer" : "default" }}
                  onClick={() => {
                    if (a2 && INVESTED_BY_CODE[a2]) {
                      setFocus(a2);
                      setHover(null);
                    }
                  }}
                  onMouseEnter={(ev) => {
                    if (!a2 || !INVESTED_BY_CODE[a2]) {
                      setHover(null);
                      return;
                    }
                    const inv = INVESTED_BY_CODE[a2];
                    const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({
                      a2,
                      name: COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
                      outstandingUsd: inv?.outstanding_usd_for_heat ?? usd,
                      investmentUsd: inv?.investment_usd ?? 0,
                      producerCount: inv?.producers.length ?? 0,
                      x: ev.clientX - rect.left,
                      y: ev.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(ev) => {
                    if (!a2 || !INVESTED_BY_CODE[a2]) return;
                    const inv = INVESTED_BY_CODE[a2];
                    const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({
                      a2,
                      name: COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
                      outstandingUsd: inv?.outstanding_usd_for_heat ?? usd,
                      investmentUsd: inv?.investment_usd ?? 0,
                      producerCount: inv?.producers.length ?? 0,
                      x: ev.clientX - rect.left,
                      y: ev.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
                {invested ? (
                  <InvestedCountryOutline
                    d={d}
                    platforms={platforms}
                    focused={isFocus}
                    dimmed={dimmed}
                  />
                ) : null}
              </g>
            );
          })}
          {!focus
            ? badgeMarkers.map((m) => (
                <InvestedBadge key={`badge-${m.a2}`} cx={m.x} cy={m.y} count={m.platforms} />
              ))
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
            <div style={{ color: c.added }}>已合作 {hover.producerCount} 平台</div>
            <div style={{ color: c.textSecondary }}>
              在贷 {formatUsdCompact(hover.outstandingUsd)} · 基金 {formatUsdCompact(hover.investmentUsd)}
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
        <MapSideLegend title="已投图例" placement={place}>
          <div>
            <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 4 }}>
              已投平台数
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InvestedBadgeLegendSample />
            </div>
          </div>
        </MapSideLegend>
      ) : null}
    </div>
  );
}
