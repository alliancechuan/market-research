import { useMemo, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldTopology from "world-atlas/countries-110m.json";
import { COUNTRY_LABEL_ZH } from "./data/nbfcCountryStats";
import {
  buildMacroMetric,
  formatMacroValue,
  type MacroMapFactorId,
} from "./data/macroMapMetrics";
import { getCountryMacro } from "./data/countryMacro";
import { formatCountryLanguageLine } from "./data/countryLanguage";
import {
  MapChip,
  MapSvgFrame,
  MapTooltip,
  SteppedLegend,
  MapSideLegend,
  MapMuted,
  MapDetailShell,
  MapCountryMacroBrief,
  MapSection,
  MapKV,
  useMapChrome,
  Button,
  heatColorRemoved,
  type MapLegendPlacement,
} from "./HeatMapChrome";
import { summarizeNbfcForCountry } from "./data/countryZoomDetails";
import { INVESTED_BY_CODE, formatUsdCompact } from "./data/producerHoldings";

type CountryProps = { name?: string };

/** ISO 3166-1 numeric → CRM alpha-2（与放贷/已投图对齐） */
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
  "036": "AU",
  "36": "AU",
  "554": "NZ",
  "702": "SG",
  "704": "VN",
  "012": "DZ",
  "818": "EG",
  "434": "LY",
  "788": "TN",
  "686": "SN",
  "384": "CI",
  "120": "CM",
  "566": "NG",
  "288": "GH",
  "404": "KE",
  "800": "UG",
  "834": "TZ",
  "231": "ET",
  "710": "ZA",
  "508": "MZ",
  "894": "ZM",
  "716": "ZW",
  "072": "BW",
  "516": "NA",
  "478": "MR",
  "480": "MU",
  "450": "MG",
  "646": "RW",
  "024": "AO",
  "178": "CG",
  "180": "CD",
  "266": "GA",
  "854": "BF",
  "466": "ML",
  "204": "BJ",
  "368": "IQ",
  "364": "IR",
  "760": "SY",
  "887": "YE",
  "400": "JO",
  "422": "LB",
  "275": "PS",
  "376": "IL",
  "414": "KW",
  "512": "OM",
  "048": "BH",
  "634": "QA",
  "398": "KZ",
  "860": "UZ",
  "417": "KG",
  "762": "TJ",
  "795": "TM",
  "496": "MN",
  "643": "RU",
  "804": "UA",
};

function normId(id: string | number | undefined): string {
  if (id == null) return "";
  return String(id).replace(/^0+/, "") || "0";
}

type HoverInfo = {
  a2: string;
  name: string;
  value: number;
  raw: string;
  x: number;
  y: number;
};

function MacroDetailPanel({
  code,
  factorId,
  onClose,
  overlay = false,
}: {
  code: string;
  factorId: MacroMapFactorId;
  onClose: () => void;
  overlay?: boolean;
}) {
  const metric = buildMacroMetric(factorId);
  const name = COUNTRY_LABEL_ZH[code] ?? code;
  const nbfc = summarizeNbfcForCountry(code);
  const invested = INVESTED_BY_CODE[code];
  const snap = getCountryMacro(code);
  const v = metric.byCode[code];
  const langLine = formatCountryLanguageLine(code);
  return (
    <MapDetailShell
      title={`${name} · ${code}`}
      subtitle={[langLine, `宏观分布 · ${metric.label}`, snap?.asOf].filter(Boolean).join(" · ")}
      onClose={onClose}
      overlay={overlay}
    >
      <MapSection title="当前图层读数">
        <MapKV
          k={metric.label}
          v={
            v != null
              ? `${formatMacroValue(factorId, v)}（${metric.unit}）`
              : "该国暂无该因子数值"
          }
        />
        {metric.rawByCode[code] ? <MapKV k="原文口径" v={metric.rawByCode[code]} /> : null}
        <MapMuted>{metric.blurb}</MapMuted>
      </MapSection>
      <MapCountryMacroBrief code={code} />
      {invested ? (
        <MapSection title="已投对照">
          <MapKV k="基金投资" v={formatUsdCompact(invested.investment_usd)} />
          <MapKV k="热力在贷" v={formatUsdCompact(invested.outstanding_usd_for_heat)} />
        </MapSection>
      ) : null}
      {nbfc && nbfc.lendingUsdBn > 0 ? (
        <MapSection title="市场放贷对照">
          <MapKV
            k="放贷总量(USD)"
            v={`约 USD ${nbfc.lendingUsdBn >= 10 ? nbfc.lendingUsdBn.toFixed(1) : nbfc.lendingUsdBn.toFixed(2)} bn`}
          />
        </MapSection>
      ) : null}
    </MapDetailShell>
  );
}

/**
 * 宏观因子地域分布图：单因子色阶面填。
 * 与放贷/已投图并列——宏观定风险中枢，点击看全套因子 + 放贷/已投对照。
 */
export function MacroHeatGlobe({
  height = 420,
  factor = "hhDebt",
  fill = false,
  legendPlacement = "side",
}: {
  height?: number;
  factor?: MacroMapFactorId;
  fill?: boolean;
  legendPlacement?: MapLegendPlacement;
}) {
  const { theme, c } = useMapChrome();
  const width = Math.round(height * 2.05);
  const bottomLegend = fill || legendPlacement === "bottom";
  const place: MapLegendPlacement = bottomLegend ? "bottom" : "side";
  const metric = useMemo(() => buildMacroMetric(factor), [factor]);
  const vals = useMemo(() => Object.values(metric.byCode), [metric]);
  const minV = useMemo(() => (vals.length ? Math.min(...vals) : 0), [vals]);
  const maxV = useMemo(() => (vals.length ? Math.max(...vals) : 1), [vals]);

  const intensity = (v: number) => {
    if (!(maxV > minV)) return 1;
    return Math.min(1, Math.max(0, (v - minV) / (maxV - minV)));
  };

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

  const { pathGen, outline, graticulePath } = useMemo(() => {
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
    const path = geoPath(projection);
    return {
      pathGen: path,
      outline: path({ type: "Sphere" }) ?? "",
      graticulePath: path(geoGraticule10()) ?? "",
    };
  }, [focusFeature, width, height]);

  const ranked = useMemo(
    () =>
      Object.entries(metric.byCode).sort((a, b) => b[1] - a[1]),
    [metric],
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
        {focus && !bottomLegend ? (
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
            const v = a2 != null ? metric.byCode[a2] : undefined;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const has = v != null;
            const fillColor = has ? heatColorRemoved(intensity(v), theme) : c.emptyLand;
            return (
              <path
                key={`${f.id ?? i}`}
                d={d}
                fill={fillColor}
                stroke={isFocus ? c.accent : c.landStroke}
                strokeWidth={isFocus ? 1.4 : has ? 0.55 : 0.35}
                opacity={dimmed ? 0.22 : 1}
                style={{ cursor: has ? "pointer" : "default" }}
                onClick={() => {
                  if (a2 && has) {
                    setFocus(a2);
                    setHover(null);
                  }
                }}
                onMouseEnter={(ev) => {
                  if (!a2 || v == null) {
                    setHover(null);
                    return;
                  }
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? f.properties?.name ?? a2,
                    value: v,
                    raw: metric.rawByCode[a2] ?? "",
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseMove={(ev) => {
                  if (!a2 || v == null) return;
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? f.properties?.name ?? a2,
                    value: v,
                    raw: metric.rawByCode[a2] ?? "",
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
            left={Math.min(hover.x + 12, width - 200)}
            top={Math.max(8, hover.y - 56)}
            accent="removed"
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            <div style={{ color: c.textSecondary }}>
              {metric.label} · {formatMacroValue(factor, hover.value)}
            </div>
            <div style={{ color: c.textTertiary, marginTop: 2, fontSize: 11 }}>点击查看全套宏观因子</div>
          </MapTooltip>
        ) : null}

        {focus && bottomLegend ? (
          <MacroDetailPanel
            code={focus}
            factorId={factor}
            onClose={() => setFocus(null)}
            overlay
          />
        ) : null}
      </div>

      {focus && !bottomLegend ? (
        <MacroDetailPanel code={focus} factorId={factor} onClose={() => setFocus(null)} />
      ) : null}
      {!focus ? (
        <MapSideLegend title={`${metric.label} · 地域分布`} placement={place}>
          <SteppedLegend
            label={`${metric.label}（${metric.unit}）· 低 → 高`}
            kind="gray"
            compact={bottomLegend}
          />
          <div
            style={{
              fontSize: 12,
              color: c.textSecondary,
              marginBottom: 8,
              marginTop: bottomLegend ? 8 : 0,
            }}
          >
            有读数 {metric.count} 国 · {metric.blurb}
            {metric.sense === "high_risk" ? " · 色深=读数高（风险向）" : " · 色深=读数高（容量向）"}
          </div>
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              color: c.text,
              lineHeight: 1.7,
              maxHeight: 280,
              overflow: "auto",
            }}
          >
            {ranked.map(([code, v]) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => setFocus(code)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: c.link,
                    cursor: "pointer",
                    font: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  {COUNTRY_LABEL_ZH[code] ?? code}
                </button>
                {" · "}
                {formatMacroValue(factor, v)}
              </li>
            ))}
          </ol>
        </MapSideLegend>
      ) : null}
    </div>
  );
}
