import { useMemo, useState, type ReactNode } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldTopology from "world-atlas/countries-110m.json";
import { COUNTRY_LABEL_ZH, NBFC_STATS } from "./data/nbfcCountryStats";
import {
  COUNTRY_ZOOM_BY_CODE,
  playFinanceChartUrl,
  summarizeNbfcForCountry,
} from "./data/countryZoomDetails";
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
  Button,
  heatColorRemoved,
  MapCountryMacroBrief,
  RankBarList,
  type MapLegendPlacement,
} from "./HeatMapChrome";
import { formatCountryLanguageLine } from "./data/countryLanguage";

type CountryProps = { name?: string };

/** ISO 3166-1 numeric (as in world-atlas) → CRM alpha-2 */
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
  "368": "IQ",
  "364": "IR",
  "400": "JO",
  "422": "LB",
  "434": "LY",
  "729": "SD",
  "788": "TN",
  "012": "DZ",
  "12": "DZ",
  "048": "BH",
  "48": "BH",
  "414": "KW",
  "512": "OM",
  "634": "QA",
  "887": "YE",
  "275": "PS",
  "376": "IL",
  "496": "MN",
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
  "344": "HK",
  "702": "SG",
};

function normId(id: string | number | undefined): string {
  if (id == null) return "";
  return String(id).replace(/^0+/, "") || "0";
}

/** 按国家汇总放贷 USD(bn) */
export function aggregateLendingUsdBn(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of NBFC_STATS.rows) {
    const bn = r.loan_book_usd_bn;
    if (bn == null || !(bn > 0)) continue;
    out[r.country_code] = (out[r.country_code] ?? 0) + bn;
  }
  return out;
}


type HoverInfo = {
  a2: string;
  name: string;
  usdBn: number;
  x: number;
  y: number;
};

function CountryDetailPanel({
  code,
  onClose,
  overlay = false,
}: {
  code: string;
  onClose: () => void;
  overlay?: boolean;
}) {
  const { c } = useMapChrome();
  const zoom = COUNTRY_ZOOM_BY_CODE[code];
  const nbfc = summarizeNbfcForCountry(code);
  const name = COUNTRY_LABEL_ZH[code] ?? code;
  const chartUrl = zoom?.source_url || playFinanceChartUrl(code);
  const langLine = formatCountryLanguageLine(code);

  return (
    <MapDetailShell
      title={`${name} · ${code}`}
      subtitle={
        langLine
          ? `${langLine} · 放大详情 · 点击「返回全球」退出`
          : "放大详情 · 点击「返回全球」退出"
      }
      onClose={onClose}
      overlay={overlay}
    >
      <MapSection title="人口情况">
        {zoom ? (
          <>
            <MapKV k="人口（约）" v={`${zoom.population_millions.toLocaleString()} 百万`} />
            <MapKV k="人口结构" v={zoom.demographic_note} />
            <MapKV k="人口信源" v={zoom.population_source} />
          </>
        ) : (
          <MapMuted>暂无人口摘要</MapMuted>
        )}
      </MapSection>

      <MapSection title="NBFC / 等效非银">
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
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {nbfc.rows.map((r) => (
                <div
                  key={`${r.category}-${r.as_of}`}
                  style={{
                    background: c.fillSoft,
                    borderRadius: 6,
                    border: `1px solid ${c.panelBorder}`,
                    padding: "8px 10px",
                    fontSize: 12,
                    color: c.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 600, color: c.text }}>{r.category}</div>
                  <div>监管：{r.regulator || "—"}</div>
                  <div>机构数：{r.nbfc_count || "—"}</div>
                  <div>放贷：{r.loan_book_total || "—"}</div>
                  <div>USD：{r.loan_book_usd || "—"}</div>
                  {r.default_rate ? <div>Default/NPL：{r.default_rate}</div> : null}
                  <div>时点：{r.as_of || "—"}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <MapMuted>暂无 NBFC 统计</MapMuted>
        )}
      </MapSection>

      <MapSection title="Google Play · Finance · Free">
        {zoom?.available === false ? (
          <MapMuted>{zoom.note || "该地区无官方 Google Play。"}</MapMuted>
        ) : (
          <>
            <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 6 }}>
              快照 {zoom?.as_of || "—"} · <MapExtLink href={chartUrl}>打开 Play Finance 榜单</MapExtLink>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: c.text, lineHeight: 1.65 }}>
              {(zoom?.top_free_finance || []).map((app) => (
                <li key={`${app.rank}-${app.name}`}>
                  {app.url ? <MapExtLink href={app.url}>{app.name}</MapExtLink> : app.name}
                  <span style={{ color: c.textTertiary }}> · {app.developer}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </MapSection>
      <MapCountryMacroBrief code={code} />
    </MapDetailShell>
  );
}

export function LendingHeatGlobe({
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
  const lending = useMemo(() => aggregateLendingUsdBn(), []);
  const values = useMemo(() => Object.values(lending), [lending]);
  const maxBn = useMemo(() => Math.max(...values, 1), [values]);
  const minBn = useMemo(() => Math.min(...values.filter((v) => v > 0), maxBn), [values, maxBn]);

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

  const intensity = (bn: number) => {
    if (!(bn > 0)) return 0;
    const lo = Math.log10(minBn);
    const hi = Math.log10(maxBn);
    if (hi <= lo) return 1;
    return (Math.log10(bn) - lo) / (hi - lo);
  };

  const ranked = useMemo(
    () => Object.entries(lending).sort((a, b) => b[1] - a[1]),
    [lending],
  );

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
            <MapChip>已放大：{COUNTRY_LABEL_ZH[focus] ?? focus}</MapChip>
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
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const fill = bn > 0 ? heatColorRemoved(intensity(bn), theme) : c.emptyLand;
            const stroke = isFocus ? c.text : c.landStroke;
            return (
              <path
                key={`${f.id ?? i}`}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={isFocus ? 1.4 : bn > 0 ? 0.55 : 0.35}
                opacity={dimmed ? 0.22 : 1}
                style={{ cursor: bn > 0 ? "pointer" : "default" }}
                onClick={() => {
                  if (a2 && bn > 0) {
                    setFocus(a2);
                    setHover(null);
                  }
                }}
                onMouseEnter={(ev) => {
                  if (!a2 || !(bn > 0)) {
                    setHover(null);
                    return;
                  }
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? f.properties?.name ?? a2,
                    usdBn: bn,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseMove={(ev) => {
                  if (!a2 || !(bn > 0)) return;
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? f.properties?.name ?? a2,
                    usdBn: bn,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
          {outline ? <path d={outline} fill="none" stroke={c.outline} strokeWidth={1} /> : null}
        </MapSvgFrame>

        {hover && !focus ? (
          <MapTooltip
            left={Math.min(hover.x + 12, width - 180)}
            top={Math.max(8, hover.y - 48)}
            accent="removed"
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            <div style={{ color: c.textSecondary }}>放贷总量 ≈ USD {hover.usdBn.toFixed(2)} bn</div>
            <div style={{ color: c.textTertiary, marginTop: 2 }}>点击放大查看详情</div>
          </MapTooltip>
        ) : null}

        {focus && bottomLegend ? (
          <CountryDetailPanel code={focus} onClose={() => setFocus(null)} overlay />
        ) : null}
      </div>

      {focus && !bottomLegend ? (
        <CountryDetailPanel code={focus} onClose={() => setFocus(null)} />
      ) : null}
      {!focus ? (
        <MapSideLegend title="热力图例" placement={place}>
          <SteppedLegend
            label="非银/等效放贷总量(USD) · 少 → 多（灰阶分档）"
            kind="gray"
            compact={bottomLegend}
          />
          <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8, marginTop: bottomLegend ? 8 : 0 }}>
            口径：各国 NBFC/等效非银信贷放贷存量粗算（非资管 AUM）· {ranked.length} 国 · 点击横条可放大
          </div>
          <RankBarList
            compact={false}
            maxVisible={bottomLegend ? 20 : undefined}
            scaleHint="条长 ∝ 非银放贷 USD bn（相对列表最大值；非 AUM）"
            onSelect={(code) => setFocus(code)}
            items={ranked.map(([code, bn]) => ({
              key: code,
              label: COUNTRY_LABEL_ZH[code] ?? code,
              value: bn,
              valueLabel: `USD ${bn >= 10 ? bn.toFixed(1) : bn.toFixed(2)} bn`,
            }))}
          />
        </MapSideLegend>
      ) : null}
    </div>
  );
}
