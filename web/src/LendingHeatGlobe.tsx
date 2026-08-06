import { useMemo, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldTopology from "world-atlas/countries-110m.json";
import { COUNTRY_LABEL_ZH, NBFC_STATS } from "./data/nbfcCountryStats";

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

function heatColor(t: number): string {
  const stops: [number, string][] = [
    [0, "#fecaca"],
    [0.25, "#f87171"],
    [0.5, "#ef4444"],
    [0.75, "#b91c1c"],
    [1, "#7f1d1d"],
  ];
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [a0, c0] = stops[i - 1];
      const [a1, c1] = stops[i];
      const u = (x - a0) / (a1 - a0 || 1);
      return lerpHex(c0, c1, u);
    }
  }
  return stops[stops.length - 1][1];
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

type HoverInfo = {
  a2: string;
  name: string;
  usdBn: number;
  x: number;
  y: number;
};

/** 平面展开世界热力图（静止 Natural Earth 投影） */
export function LendingHeatGlobe({ height = 420 }: { height?: number }) {
  const width = Math.round(height * 2.05);
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
    return feature(topo as never, topo.objects.countries as never) as FeatureCollection<
      Geometry,
      CountryProps
    >;
  }, []);

  const [hover, setHover] = useState<HoverInfo | null>(null);

  const { pathGen, outline } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [12, 12],
        [width - 12, height - 12],
      ],
      { type: "Sphere" },
    );
    const pathGen = geoPath(projection);
    return { pathGen, outline: pathGen({ type: "Sphere" }) };
  }, [width, height]);

  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const intensity = (bn: number) => {
    if (!(bn > 0)) return 0;
    const lo = Math.log10(minBn);
    const hi = Math.log10(maxBn);
    if (hi <= lo) return 1;
    return (Math.log10(bn) - lo) / (hi - lo);
  };

  function a2Of(f: Feature<Geometry, CountryProps>): string | null {
    const n3 = String(f.id);
    const stripped = normId(n3);
    return N3_TO_A2[n3] ?? N3_TO_A2[stripped] ?? N3_TO_A2[n3.padStart(3, "0")] ?? null;
  }

  const ranked = useMemo(
    () => Object.entries(lending).sort((a, b) => b[1] - a[1]),
    [lending],
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          margin: "0 auto",
          flex: "1 1 560px",
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          style={{
            display: "block",
            background: "#f1f5f9",
            borderRadius: 12,
            boxShadow: "0 8px 28px rgba(15,23,42,0.08)",
          }}
        >
          <rect width={width} height={height} fill="#f1f5f9" />
          {outline ? <path d={outline} fill="#e2e8f0" /> : null}
          {graticulePath ? (
            <path d={graticulePath} fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={0.6} />
          ) : null}
          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            const bn = a2 ? (lending[a2] ?? 0) : 0;
            const d = pathGen(f);
            if (!d) return null;
            const fill = bn > 0 ? heatColor(intensity(bn)) : "#cbd5e1";
            const stroke = bn > 0 ? "rgba(127,29,29,0.35)" : "rgba(100,116,139,0.35)";
            return (
              <path
                key={`${f.id ?? i}`}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={bn > 0 ? 0.55 : 0.35}
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
          {outline ? (
            <path d={outline} fill="none" stroke="rgba(100,116,139,0.4)" strokeWidth={1} />
          ) : null}
        </svg>

        {hover ? (
          <div
            style={{
              position: "absolute",
              left: Math.min(hover.x + 12, width - 170),
              top: Math.max(8, hover.y - 48),
              background: "rgba(255,255,255,0.96)",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              pointerEvents: "none",
              minWidth: 120,
              boxShadow: "0 6px 20px rgba(15,23,42,0.12)",
            }}
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            <div style={{ color: "#475569" }}>放贷总量 ≈ USD {hover.usdBn.toFixed(2)} bn</div>
          </div>
        ) : null}
      </div>

      <div style={{ flex: "1 1 200px", minWidth: 180, alignSelf: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>热力图例</div>
        <div
          style={{
            height: 12,
            borderRadius: 6,
            background: "linear-gradient(90deg,#fecaca,#ef4444,#7f1d1d)",
            marginBottom: 6,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#64748b",
            marginBottom: 16,
          }}
        >
          <span>少</span>
          <span>放贷总量(USD) 越多越红</span>
          <span>多</span>
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
          有放贷总量(USD) 的国家 · {ranked.length} 个（地图已全部着色）
        </div>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 12,
            color: "#1e293b",
            lineHeight: 1.7,
            maxHeight: 280,
            overflow: "auto",
          }}
        >
          {ranked.map(([code, bn]) => (
            <li key={code}>
              {COUNTRY_LABEL_ZH[code] ?? code} · USD {bn >= 10 ? bn.toFixed(1) : bn.toFixed(2)} bn
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 14, fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
          CRM 覆盖约 80+ 国家/地区；其余多为已定位监管机构、尚无公开可核验的行业放贷总量（见 NBFC
          子页「待补」）。色阶对数映射。
        </div>
      </div>
    </div>
  );
}
