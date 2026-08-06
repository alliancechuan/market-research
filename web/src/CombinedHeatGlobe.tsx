import { useMemo, useState, type ReactNode } from "react";
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
};

function normId(id: string | number | undefined): string {
  if (id == null) return "";
  return String(id).replace(/^0+/, "") || "0";
}

function heatColorRed(t: number): string {
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

function heatColorGreen(t: number): string {
  const stops: [number, string][] = [
    [0, "#86efac"],
    [0.5, "#22c55e"],
    [1, "#14532d"],
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
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
}

function hexRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#334155",
          marginBottom: 6,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5, marginBottom: 2 }}>
      <span style={{ color: "#64748b", minWidth: 88, flexShrink: 0 }}>{k}</span>
      <span style={{ color: "#0f172a" }}>{v}</span>
    </div>
  );
}

type HoverInfo = {
  a2: string;
  name: string;
  lendingBn: number;
  invested: boolean;
  outstandingUsd: number;
  investmentUsd: number;
  x: number;
  y: number;
};

function DetailPanel({ code, onClose }: { code: string; onClose: () => void }) {
  const invested = INVESTED_BY_CODE[code];
  const zoom = COUNTRY_ZOOM_BY_CODE[code];
  const nbfc = summarizeNbfcForCountry(code);
  const name = COUNTRY_LABEL_ZH[code] ?? invested?.country_zh ?? code;
  const chartUrl = zoom?.source_url || playFinanceChartUrl(code);

  return (
    <div
      style={{
        flex: "1 1 320px",
        minWidth: 280,
        maxWidth: 440,
        maxHeight: 560,
        overflow: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#fff",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            {name} · {code}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {invested ? "已投国家 · 红=市场放贷 / 绿=已投在贷" : "市场放贷详情"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          返回全球
        </button>
      </div>

      {invested ? (
        <Section title="已投生产商（绿）">
          <KV k="基金投资合计" v={formatUsdCompact(invested.investment_usd)} />
          <KV k="热力在贷合计" v={formatUsdCompact(invested.outstanding_usd_for_heat)} />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {invested.producers.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#334155",
                  lineHeight: 1.55,
                }}
              >
                <div style={{ fontWeight: 700, color: "#14532d", marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: "#64748b", marginBottom: 6 }}>{p.product_type}</div>
                <KV k="基金投资" v={formatUsdCompact(p.investment_usd)} />
                <KV k="在贷余额" v={p.outstanding_display} />
                <KV k="服务客户数" v={p.customers_display} />
                {p.ranking_note ? <KV k="排名/定位" v={p.ranking_note} /> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="市场放贷（红）">
        {nbfc ? (
          <>
            <KV
              k="放贷总量(USD)"
              v={
                nbfc.lendingUsdBn > 0
                  ? `约 USD ${nbfc.lendingUsdBn >= 10 ? nbfc.lendingUsdBn.toFixed(1) : nbfc.lendingUsdBn.toFixed(2)} bn`
                  : "—"
              }
            />
            <KV k="机构数量口径" v={nbfc.nbfcCountDisplay} />
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#64748b" }}>暂无 NBFC 放贷总量</div>
        )}
      </Section>

      {zoom ? (
        <Section title="人口 / Play Finance">
          <KV k="人口（约）" v={`${zoom.population_millions.toLocaleString()} 百万`} />
          {zoom.available !== false ? (
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              <a href={chartUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                Play Finance 免费榜
              </a>
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}

/** 红绿叠加：底色=市场放贷红；已投=绿色描边+圆点（在贷越大点越大/越深） */
export function CombinedHeatGlobe({ height = 420 }: { height?: number }) {
  const width = Math.round(height * 2.05);
  const lending = useMemo(() => aggregateLendingUsdBn(), []);
  const lendVals = useMemo(() => Object.values(lending), [lending]);
  const maxBn = useMemo(() => Math.max(...lendVals, 1), [lendVals]);
  const minBn = useMemo(
    () => Math.min(...lendVals.filter((v) => v > 0), maxBn),
    [lendVals, maxBn],
  );

  const investedOutstanding = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of PRODUCER_HOLDINGS.countries) {
      if (c.outstanding_usd_for_heat > 0) out[c.country_code] = c.outstanding_usd_for_heat;
    }
    return out;
  }, []);
  const invVals = useMemo(() => Object.values(investedOutstanding), [investedOutstanding]);
  const maxInv = useMemo(() => Math.max(...invVals, 1), [invVals]);
  const minInv = useMemo(
    () => Math.min(...invVals.filter((v) => v > 0), maxInv),
    [invVals, maxInv],
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

  const { pathGen, outline } = useMemo(() => {
    const proj = geoNaturalEarth1();
    if (focusFeature) {
      proj.fitExtent(
        [
          [24, 24],
          [width - 24, height - 24],
        ],
        focusFeature,
      );
    } else {
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
  }, [width, height, focusFeature]);

  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const redIntensity = (bn: number) => {
    if (!(bn > 0)) return 0;
    const lo = Math.log10(minBn);
    const hi = Math.log10(maxBn);
    if (hi <= lo) return 1;
    return (Math.log10(bn) - lo) / (hi - lo);
  };

  const greenIntensity = (usd: number) => {
    if (!(usd > 0)) return 0;
    const lo = Math.log10(minInv);
    const hi = Math.log10(maxInv);
    if (hi <= lo) return 1;
    return (Math.log10(usd) - lo) / (hi - lo);
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
      const t = greenIntensity(usd);
      const c = pathGen.centroid(f);
      if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) continue;
      items.push({
        a2,
        x: c[0],
        y: c[1],
        r: 5 + t * 10,
        fill: heatColorGreen(t),
        usd,
      });
    }
    return items;
  }, [countries, investedOutstanding, pathGen, minInv, maxInv]);

  const interactive = (a2: string | null) => {
    if (!a2) return false;
    return (lending[a2] ?? 0) > 0 || Boolean(INVESTED_BY_CODE[a2]);
  };

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
            <button
              type="button"
              onClick={() => setFocus(null)}
              style={{
                border: "1px solid #cbd5e1",
                background: "rgba(255,255,255,0.95)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ← 返回全球
            </button>
            <span
              style={{
                fontSize: 12,
                color: "#0f172a",
                background: "rgba(255,255,255,0.92)",
                borderRadius: 8,
                padding: "6px 10px",
                border: "1px solid #e2e8f0",
              }}
            >
              已放大：{COUNTRY_LABEL_ZH[focus] ?? INVESTED_BY_CODE[focus]?.country_zh ?? focus}
            </span>
          </div>
        ) : null}

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
          <defs>
            <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#16a34a" floodOpacity="0.55" />
            </filter>
          </defs>
          <rect width={width} height={height} fill="#f1f5f9" />
          {outline ? <path d={outline} fill="#e2e8f0" /> : null}
          {graticulePath ? (
            <path d={graticulePath} fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={0.6} />
          ) : null}

          {/* 底层：红色市场放贷 */}
          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            const bn = a2 ? (lending[a2] ?? 0) : 0;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const fill = bn > 0 ? heatColorRed(redIntensity(bn)) : "#cbd5e1";
            return (
              <path
                key={`base-${f.id ?? i}`}
                d={d}
                fill={fill}
                stroke="rgba(100,116,139,0.28)"
                strokeWidth={0.35}
                opacity={dimmed ? 0.18 : 1}
                style={{ cursor: interactive(a2) ? "pointer" : "default" }}
                onClick={() => {
                  if (a2 && interactive(a2)) {
                    setFocus(a2);
                    setHover(null);
                  }
                }}
                onMouseEnter={(ev) => {
                  if (!a2 || !interactive(a2)) {
                    setHover(null);
                    return;
                  }
                  const inv = INVESTED_BY_CODE[a2];
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
                    lendingBn: bn,
                    invested: Boolean(inv),
                    outstandingUsd: inv?.outstanding_usd_for_heat ?? 0,
                    investmentUsd: inv?.investment_usd ?? 0,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseMove={(ev) => {
                  if (!a2 || !interactive(a2)) return;
                  const inv = INVESTED_BY_CODE[a2];
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? inv?.country_zh ?? f.properties?.name ?? a2,
                    lendingBn: bn,
                    invested: Boolean(inv),
                    outstandingUsd: inv?.outstanding_usd_for_heat ?? 0,
                    investmentUsd: inv?.investment_usd ?? 0,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}

          {/* 叠加层：已投绿色描边 */}
          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            if (!a2 || !INVESTED_BY_CODE[a2]) return null;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const t = greenIntensity(investedOutstanding[a2] ?? 0);
            return (
              <path
                key={`inv-${f.id ?? i}`}
                d={d}
                fill="rgba(34,197,94,0.18)"
                stroke={heatColorGreen(Math.max(0.35, t))}
                strokeWidth={isFocus ? 2.4 : 1.8}
                opacity={dimmed ? 0.15 : 1}
                filter="url(#greenGlow)"
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* 已投圆点：在贷越大越大/越深 */}
          {!focus
            ? markers.map((m) => (
                <g key={`m-${m.a2}`} style={{ pointerEvents: "none" }}>
                  <circle cx={m.x} cy={m.y} r={m.r + 2} fill="rgba(255,255,255,0.75)" />
                  <circle cx={m.x} cy={m.y} r={m.r} fill={m.fill} stroke="#fff" strokeWidth={1.2} />
                </g>
              ))
            : null}

          {outline ? (
            <path d={outline} fill="none" stroke="rgba(100,116,139,0.4)" strokeWidth={1} />
          ) : null}
        </svg>

        {hover && !focus ? (
          <div
            style={{
              position: "absolute",
              left: Math.min(hover.x + 12, width - 210),
              top: Math.max(8, hover.y - 64),
              background: "rgba(255,255,255,0.97)",
              color: "#0f172a",
              border: hover.invested ? "1px solid #86efac" : "1px solid #e2e8f0",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              pointerEvents: "none",
              minWidth: 170,
              boxShadow: "0 6px 20px rgba(15,23,42,0.12)",
            }}
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            {hover.lendingBn > 0 ? (
              <div style={{ color: "#b91c1c" }}>市场放贷 ≈ USD {hover.lendingBn.toFixed(2)} bn</div>
            ) : (
              <div style={{ color: "#94a3b8" }}>市场放贷总量暂无</div>
            )}
            {hover.invested ? (
              <div style={{ color: "#15803d" }}>
                已投在贷 {formatUsdCompact(hover.outstandingUsd)} · 基金{" "}
                {formatUsdCompact(hover.investmentUsd)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {focus ? (
        <DetailPanel code={focus} onClose={() => setFocus(null)} />
      ) : (
        <div style={{ flex: "1 1 220px", minWidth: 200, alignSelf: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#334155" }}>
            双层图例
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>红 · 市场放贷总量</div>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: "linear-gradient(90deg,#fecaca,#ef4444,#7f1d1d)",
              }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              绿 · 已投描边/圆点（在贷越大越深越大）
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: "linear-gradient(90deg,#86efac,#22c55e,#14532d)",
              }}
            />
          </div>

          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
            已投 {investedRanked.length} 国 · 基金合计{" "}
            {formatUsdCompact(PRODUCER_HOLDINGS.total_investment_usd)}
          </div>
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              color: "#1e293b",
              lineHeight: 1.7,
              maxHeight: 240,
              overflow: "auto",
            }}
          >
            {investedRanked.map((c) => (
              <li key={c.country_code}>
                <button
                  type="button"
                  onClick={() => setFocus(c.country_code)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#15803d",
                    cursor: "pointer",
                    font: "inherit",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  {COUNTRY_LABEL_ZH[c.country_code] ?? c.country_zh}
                </button>
                {" · "}
                {formatUsdCompact(c.outstanding_usd_for_heat)}
                {lending[c.country_code] ? (
                  <span style={{ color: "#b91c1c" }}>
                    {" "}
                    / 市场 {lending[c.country_code].toFixed(1)}bn
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          {INVESTED_BY_CODE.HK && !mapCodes.has("HK") ? (
            <div style={{ marginTop: 10, fontSize: 11, color: "#b45309", lineHeight: 1.5 }}>
              香港无独立底图，请从列表点击。
            </div>
          ) : null}
          <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
            底色红=各国 NBFC 市场放贷；绿色描边+圆点=基金已投国家（在贷规模）。
          </div>
        </div>
      )}
    </div>
  );
}
