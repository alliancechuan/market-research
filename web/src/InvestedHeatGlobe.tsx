import { useMemo, useState, type ReactNode } from "react";
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

function heatColorGreen(t: number): string {
  const stops: [number, string][] = [
    [0, "#bbf7d0"],
    [0.25, "#86efac"],
    [0.5, "#22c55e"],
    [0.75, "#15803d"],
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
  outstandingUsd: number;
  investmentUsd: number;
  producerCount: number;
  x: number;
  y: number;
};

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

function CountryDetailPanel({
  code,
  invested,
  onClose,
}: {
  code: string;
  invested: InvestedCountry | undefined;
  onClose: () => void;
}) {
  const name = COUNTRY_LABEL_ZH[code] ?? invested?.country_zh ?? code;
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
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>已投生产商详情</div>
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

      <Section title="已投生产商">
        {invested ? (
          <>
            <KV k="基金投资合计" v={formatUsdCompact(invested.investment_usd)} />
            <KV k="热力在贷合计" v={formatUsdCompact(invested.outstanding_usd_for_heat)} />
            <KV k="平台数" v={String(invested.producers.length)} />
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
                  {p.outstanding_note ? (
                    <div style={{ fontSize: 11, color: "#64748b", margin: "2px 0 6px 0" }}>
                      {p.outstanding_note}
                    </div>
                  ) : null}
                  <KV k="服务客户数" v={p.customers_display} />
                  {p.customers_note ? (
                    <div style={{ fontSize: 11, color: "#64748b", margin: "2px 0 6px 0" }}>
                      {p.customers_note}
                    </div>
                  ) : null}
                  {p.ranking_note ? <KV k="排名/定位" v={p.ranking_note} /> : null}
                  {p.yield_note ? <KV k="收益/定价" v={p.yield_note} /> : null}
                  {p.monthly_disbursement_note ? <KV k="月放款" v={p.monthly_disbursement_note} /> : null}
                  {p.license_note ? <KV k="牌照/主体" v={p.license_note} /> : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#64748b" }}>该国暂无已投生产商记录</div>
        )}
      </Section>
    </div>
  );
}

/** 绿色：已投生产商热力图（在贷越大越深） */
export function InvestedHeatGlobe({ height = 420 }: { height?: number }) {
  const width = Math.round(height * 2.05);
  const outstanding = useMemo(() => aggregateInvestedOutstandingUsd(), []);
  const values = useMemo(() => Object.values(outstanding), [outstanding]);
  const maxUsd = useMemo(() => Math.max(...values, 1), [values]);
  const minUsd = useMemo(() => Math.min(...values.filter((v) => v > 0), maxUsd), [values, maxUsd]);

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

  const mapCodes = useMemo(() => {
    const set = new Set<string>();
    for (const f of countries.features) {
      const n3 = String(f.id);
      const stripped = normId(n3);
      const a2 = N3_TO_A2[n3] ?? N3_TO_A2[stripped] ?? N3_TO_A2[n3.padStart(3, "0")];
      if (a2) set.add(a2);
    }
    return set;
  }, [countries]);

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

  const hkMissingOnMap = Boolean(INVESTED_BY_CODE.HK) && !mapCodes.has("HK");

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
          <rect width={width} height={height} fill="#f1f5f9" />
          {outline ? <path d={outline} fill="#e2e8f0" /> : null}
          {graticulePath ? (
            <path d={graticulePath} fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={0.6} />
          ) : null}
          {countries.features.map((f, i) => {
            const a2 = a2Of(f);
            const usd = a2 ? (outstanding[a2] ?? 0) : 0;
            const invested = a2 ? INVESTED_BY_CODE[a2] : undefined;
            const d = pathGen(f);
            if (!d) return null;
            const isFocus = focus != null && a2 === focus;
            const dimmed = focus != null && !isFocus;
            const fill = usd > 0 ? heatColorGreen(intensity(usd)) : "#cbd5e1";
            const stroke = isFocus
              ? "#14532d"
              : usd > 0
                ? "rgba(20,83,45,0.55)"
                : "rgba(100,116,139,0.35)";
            return (
              <path
                key={`${f.id ?? i}`}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={isFocus ? 1.4 : usd > 0 ? 0.65 : 0.35}
                opacity={dimmed ? 0.22 : 1}
                style={{ cursor: usd > 0 ? "pointer" : "default" }}
                onClick={() => {
                  if (a2 && usd > 0) {
                    setFocus(a2);
                    setHover(null);
                  }
                }}
                onMouseEnter={(ev) => {
                  if (!a2 || !(usd > 0) || !invested) {
                    setHover(null);
                    return;
                  }
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? invested.country_zh,
                    outstandingUsd: usd,
                    investmentUsd: invested.investment_usd,
                    producerCount: invested.producers.length,
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                  });
                }}
                onMouseMove={(ev) => {
                  if (!a2 || !(usd > 0) || !invested) return;
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    a2,
                    name: COUNTRY_LABEL_ZH[a2] ?? invested.country_zh,
                    outstandingUsd: usd,
                    investmentUsd: invested.investment_usd,
                    producerCount: invested.producers.length,
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

        {hover && !focus ? (
          <div
            style={{
              position: "absolute",
              left: Math.min(hover.x + 12, width - 200),
              top: Math.max(8, hover.y - 56),
              background: "rgba(255,255,255,0.96)",
              color: "#0f172a",
              border: "1px solid #bbf7d0",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              pointerEvents: "none",
              minWidth: 160,
              boxShadow: "0 6px 20px rgba(15,23,42,0.12)",
            }}
          >
            <div style={{ fontWeight: 600 }}>{hover.name}</div>
            <div style={{ color: "#15803d" }}>在贷(热力) {formatUsdCompact(hover.outstandingUsd)}</div>
            <div style={{ color: "#475569" }}>
              基金投资 {formatUsdCompact(hover.investmentUsd)} · {hover.producerCount} 家平台
            </div>
          </div>
        ) : null}
      </div>

      {focus ? (
        <CountryDetailPanel
          code={focus}
          invested={INVESTED_BY_CODE[focus]}
          onClose={() => setFocus(null)}
        />
      ) : (
        <div style={{ flex: "1 1 220px", minWidth: 200, alignSelf: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>
            已投热力图例
          </div>
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background: "linear-gradient(90deg,#bbf7d0,#22c55e,#14532d)",
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
            <span>生产商在贷越大越深绿</span>
            <span>多</span>
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
            已投 {ranked.length} 国 · 基金合计 {formatUsdCompact(PRODUCER_HOLDINGS.total_investment_usd)}
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
            {ranked.map((c) => (
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
                {" · 在贷 "}
                {formatUsdCompact(c.outstanding_usd_for_heat)}
                {" · 投 "}
                {formatUsdCompact(c.investment_usd)}
              </li>
            ))}
          </ol>
          {hkMissingOnMap ? (
            <div style={{ marginTop: 10, fontSize: 11, color: "#b45309", lineHeight: 1.5 }}>
              香港在底图中无独立多边形，请从列表点击「香港」。
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
