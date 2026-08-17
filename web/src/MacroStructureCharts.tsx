/**
 * 国别宏观结构图：三产 / 外储经常账户 / 信贷负债
 * Cursor 扁平 token，无阴影无渐变。
 */
import { useHostTheme, Text, Stack, Grid } from "./shims/cursor-canvas";
import { mapChrome } from "./heatMapTheme";

export type MacroChartSnap = {
  gdpPerCapitaUsd?: string;
  incomePerCapita?: string;
  sectorMix?: string;
  currentAccount?: string;
  fxReserves?: string;
  fxTrend?: string;
  fxHint?: string;
  fxVolInYear?: string;
  privCreditOrConsumer?: string;
  debtToGdp?: string;
  householdDebtToGdp?: string;
  consumerConfidence?: string;
  gdpUsdBn?: string;
};

/** 框架阈值（与 Atlas CASH_LOAN_MACRO_FRAMEWORK.alerts 对齐） */
const THRESH = {
  gdpPerCapitaMatureUsd: 12000,
  primarySectorHighPct: 30,
  tertiarySectorHighPct: 65,
  householdDebtCeilPct: 50, // 新兴市场 45–55 中位
  govDebtWatchPct: 60,
  caSoftPct: -3,
  fxVolHighPct: 12,
};

function Panel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <div
      style={{
        minWidth: 0,
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 10px 8px",
        border: `1px solid ${c.panelBorder}`,
        borderRadius: 6,
        background: c.panelBg,
      }}
    >
      <div style={{ borderBottom: `1px solid ${c.panelBorder}`, paddingBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 2, lineHeight: 1.35 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      {footer ? (
        <div style={{ fontSize: 11, color: c.textSecondary, lineHeight: 1.4 }}>{footer}</div>
      ) : null}
    </div>
  );
}

function parseFirstNumber(s?: string): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parsePct(s?: string): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
}

/** 农业分项X；制造Y；服务Z */
function parseSectorAbs(sectorMix?: string): { agri: number; mfg: number; svc: number } | null {
  if (!sectorMix) return null;
  const agri = sectorMix.match(/农业[^0-9]*([\d.]+)/)?.[1];
  const mfg = sectorMix.match(/制造[^0-9]*([\d.]+)/)?.[1];
  const svc = sectorMix.match(/服务[^0-9]*([\d.]+)/)?.[1];
  if (!agri || !mfg || !svc) return null;
  return { agri: Number(agri), mfg: Number(mfg), svc: Number(svc) };
}

function parseCaGdp(currentAccount?: string): number | null {
  if (!currentAccount) return null;
  const m = currentAccount.match(/CA\/GDP约?\s*(-?\d+(?:\.\d+)?)\s*%/i);
  return m ? Number(m[1]) : null;
}

function parseReservesUsdBn(fxReserves?: string): number | null {
  if (!fxReserves) return null;
  // 约2555亿美元 → 255.5?  actually 2555亿美元 = 255.5 bn? In Chinese 2555亿 = 255.5 billion USD yes
  // 约2555亿美元 means 2555 亿 USD = 255.5 billion
  const yi = fxReserves.match(/约?\s*([\d.]+)\s*亿\s*美元/);
  if (yi) return Number(yi[1]) / 10; // 亿→百亿? Wait: 1亿 USD = 0.1 billion USD. So 2555亿 = 255.5 bn. Number/10 = 255.5. Yes.
  const bn = fxReserves.match(/([\d.]+)\s*(?:bn|billion)/i);
  return bn ? Number(bn[1]) : null;
}

function parseGdpUsdTnOrBn(gdpUsdBn?: string): number | null {
  if (!gdpUsdBn) return null;
  // 约1.83万亿美元 → 1830 bn
  const wan = gdpUsdBn.match(/([\d.]+)\s*万亿/);
  if (wan) return Number(wan[1]) * 1000;
  const yi = gdpUsdBn.match(/([\d.]+)\s*亿/);
  if (yi) return Number(yi[1]) / 10;
  const n = parseFirstNumber(gdpUsdBn);
  return n;
}

/** 消费信贷 … MXN - 百万；私营部门贷款 … MXN千 → 统一到「百万本币」量级比 */
function parseCreditPair(priv?: string): { consumer: number; privateLoan: number } | null {
  if (!priv) return null;
  const cons = priv.match(/消费信贷约?\s*([\d.]+)/);
  const privM = priv.match(/私营部门贷款约?\s*([\d.]+)/);
  if (!cons || !privM) return null;
  let consumer = Number(cons[1]);
  let privateLoan = Number(privM[1]);
  // 若私营带「千」而消费带「百万」，私营÷1000 对齐到百万
  if (/MXN\s*千|千（/.test(priv) || /千（20/.test(priv)) {
    if (/消费信贷[\s\S]*百万/.test(priv) || /MXN\s*-\s*百万/.test(priv)) {
      privateLoan = privateLoan / 1000;
    }
  }
  return { consumer, privateLoan };
}

function HBar({
  segments,
}: {
  segments: { label: string; pct: number; color: string }[];
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  return (
    <Stack gap={6}>
      <div style={{ display: "flex", height: 14, width: "100%", overflow: "hidden", borderRadius: 2 }}>
        {segments.map((s) => (
          <div
            key={s.label}
            title={`${s.label} ${s.pct.toFixed(1)}%`}
            style={{ width: `${Math.max(0.5, s.pct)}%`, background: s.color }}
          />
        ))}
      </div>
      <Stack gap={3}>
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: c.textSecondary,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, background: s.color, display: "inline-block" }} />
              {s.label}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </Stack>
    </Stack>
  );
}

function Meter({
  label,
  value,
  max,
  marker,
  format = (v) => `${v}`,
  tone = "neutral",
}: {
  label: string;
  value: number;
  max: number;
  marker?: number;
  format?: (v: number) => string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fill =
    tone === "good" ? c.added : tone === "bad" ? c.removed : tone === "warn" ? c.accent : c.ink;
  return (
    <Stack gap={4}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: c.textSecondary,
        }}
      >
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", color: c.text }}>{format(value)}</span>
      </div>
      <div style={{ position: "relative", height: 8, background: theme.fill.tertiary }}>
        <div style={{ width: `${pct}%`, height: "100%", background: fill, opacity: 0.85 }} />
        {marker != null ? (
          <div
            title={`阈值 ${format(marker)}`}
            style={{
              position: "absolute",
              left: `${Math.min(100, (marker / max) * 100)}%`,
              top: -2,
              bottom: -2,
              width: 1,
              background: c.textTertiary,
            }}
          />
        ) : null}
      </div>
    </Stack>
  );
}

/** 收入与三产 */
export function IncomeSectorCharts({ snap }: { snap: MacroChartSnap }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const sectors = parseSectorAbs(snap.sectorMix);
  const gdpPc = parseFirstNumber(snap.gdpPerCapitaUsd);
  const incomePc = parseFirstNumber(snap.incomePerCapita);
  const total = sectors ? sectors.agri + sectors.mfg + sectors.svc : 0;
  const shares = sectors && total > 0
    ? {
        agri: (sectors.agri / total) * 100,
        mfg: (sectors.mfg / total) * 100,
        svc: (sectors.svc / total) * 100,
      }
    : null;

  const highValue =
    shares != null &&
    shares.svc >= 50 &&
    shares.agri < THRESH.primarySectorHighPct &&
    (gdpPc == null || gdpPc >= 8000);

  return (
    <Grid columns={2} gap={8}>
      <Panel
        title="产业结构（分项占比）"
        subtitle="由农业/制造/服务绝对分项归一；非官方GDP占比口径"
        footer={
          shares
            ? shares.svc >= THRESH.tertiarySectorHighPct
              ? `服务业 ${shares.svc.toFixed(0)}% 已过框架高位阈值 ${THRESH.tertiarySectorHighPct}%（需防过早去工业化误判）`
              : shares.agri >= THRESH.primarySectorHighPct
                ? `农业 ${shares.agri.toFixed(0)}% 偏高（阈值 ${THRESH.primarySectorHighPct}%）· 附加值身位偏初级`
                : `服务业 ${shares.svc.toFixed(0)}% / 制造 ${shares.mfg.toFixed(0)}% · ${
                    highValue ? "偏服务+制造，附加值身位相对靠前" : "结构过渡中"
                  }`
            : "三产分项不足，无法作图"
        }
      >
        {shares ? (
          <HBar
            segments={[
              { label: "农业", pct: shares.agri, color: theme.fill.primary },
              { label: "制造", pct: shares.mfg, color: c.accent },
              { label: "服务", pct: shares.svc, color: c.added },
            ]}
          />
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
      </Panel>

      <Panel
        title="收入能力"
        subtitle="人均收入主尺 · GNI/人 PPP（非住户可支配收入）"
        footer={
          incomePc != null
            ? `PPP 收入与现价人均GDP口径不同，新兴市场常见 PPP＞名义；准入成熟阈值仍按人均GDP ${THRESH.gdpPerCapitaMatureUsd.toLocaleString()} 美元`
            : gdpPc != null
              ? "缺人均收入（GNI PPP）· 暂以人均GDP现价代理"
              : "缺人均收入与人均GDP"
        }
      >
        {incomePc != null || gdpPc != null ? (
          <Stack gap={8}>
            <Meter
              label={incomePc != null ? "人均收入（GNI/人 PPP，美元）" : "人均GDP（现价·代理，美元）"}
              value={incomePc ?? gdpPc!}
              max={Math.max(
                (incomePc ?? gdpPc!) * 1.15,
                THRESH.gdpPerCapitaMatureUsd * 1.4,
              )}
              format={(v) => `${Math.round(v).toLocaleString()}`}
              tone="neutral"
            />
            {incomePc != null && gdpPc != null ? (
              <Meter
                label="对照 · 人均GDP现价（美元）"
                value={gdpPc}
                max={Math.max(THRESH.gdpPerCapitaMatureUsd * 1.4, gdpPc * 1.1)}
                marker={THRESH.gdpPerCapitaMatureUsd}
                format={(v) => `${Math.round(v).toLocaleString()}`}
                tone={
                  gdpPc >= THRESH.gdpPerCapitaMatureUsd
                    ? "good"
                    : gdpPc >= 5000
                      ? "warn"
                      : "bad"
                }
              />
            ) : gdpPc != null && incomePc == null ? (
              <Meter
                label="人均GDP（美元）"
                value={gdpPc}
                max={Math.max(THRESH.gdpPerCapitaMatureUsd * 1.4, gdpPc * 1.1)}
                marker={THRESH.gdpPerCapitaMatureUsd}
                format={(v) => `${Math.round(v).toLocaleString()}`}
                tone={
                  gdpPc >= THRESH.gdpPerCapitaMatureUsd
                    ? "good"
                    : gdpPc >= 5000
                      ? "warn"
                      : "bad"
                }
              />
            ) : null}
          </Stack>
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
      </Panel>
    </Grid>
  );
}

/** 外汇与经常账户 */
export function FxCaCharts({ snap }: { snap: MacroChartSnap }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const ca = parseCaGdp(snap.currentAccount);
  const reservesBn = parseReservesUsdBn(snap.fxReserves);
  const gdpBn = parseGdpUsdTnOrBn(snap.gdpUsdBn);
  const reservesToGdp = reservesBn != null && gdpBn != null && gdpBn > 0 ? (reservesBn / gdpBn) * 100 : null;
  const fxVol = parsePct(snap.fxVolInYear?.replace("±", "")) ?? parseFirstNumber(snap.fxVolInYear?.replace("±", ""));

  // 简易韧性分：外储/GDP、CA、波动
  let score = 0;
  let scoreN = 0;
  if (reservesToGdp != null) {
    scoreN++;
    score += reservesToGdp >= 12 ? 2 : reservesToGdp >= 8 ? 1 : 0;
  }
  if (ca != null) {
    scoreN++;
    score += ca >= 0 ? 2 : ca > THRESH.caSoftPct ? 1 : 0;
  }
  if (fxVol != null) {
    scoreN++;
    score += fxVol <= 6 ? 2 : fxVol <= THRESH.fxVolHighPct ? 1 : 0;
  }
  const resilience = scoreN ? score / (scoreN * 2) : null;

  return (
    <Grid columns={3} gap={8}>
      <Panel
        title="经常账户"
        subtitle="CA/GDP"
        footer={
          ca == null
            ? "缺 CA/GDP"
            : ca >= 1
              ? "顺差较厚 · 对外融资依赖低"
              : ca >= 0
                ? "大致平衡"
                : ca > THRESH.caSoftPct
                  ? "轻度逆差 · 尚可融资覆盖"
                  : "逆差偏深 · 极端情景下汇兑压力更大"
        }
      >
        {ca != null ? (
          <Meter
            label="CA/GDP"
            value={ca}
            max={8}
            marker={0}
            format={(v) => `${v.toFixed(1)}%`}
            tone={ca >= 0 ? "good" : ca > THRESH.caSoftPct ? "warn" : "bad"}
          />
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
        <Text size="small" tone="tertiary">
          近季流量见读数原文；趋势需多季序列后续补
        </Text>
      </Panel>

      <Panel
        title="外汇储备"
        subtitle="相对 GDP 厚度（非进口月数）"
        footer={
          reservesBn != null && reservesToGdp != null
            ? `外储约 ${reservesBn.toFixed(0)}0 亿美元量级 · 占GDP约 ${reservesToGdp.toFixed(1)}%`
            : reservesBn != null
              ? `外储约 ${reservesBn.toFixed(1)}00 亿？核对：显示 ${reservesBn}`
              : "缺外储"
        }
      >
        {reservesToGdp != null ? (
          <Meter
            label="外储/GDP"
            value={reservesToGdp}
            max={25}
            marker={10}
            format={(v) => `${v.toFixed(1)}%`}
            tone={reservesToGdp >= 12 ? "good" : reservesToGdp >= 8 ? "warn" : "bad"}
          />
        ) : reservesBn != null ? (
          <Text size="small" tone="secondary">
            外储绝对值已录；缺 GDP 无法算占比
          </Text>
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
      </Panel>

      <Panel
        title="本币极端韧性（示意）"
        subtitle="外储厚度 + CA + 年内波动 合成"
        footer={
          resilience == null
            ? "因子不足"
            : resilience >= 0.66
              ? "示意偏稳 · 极端冲击下缓冲相对更好"
              : resilience >= 0.4
                ? "中等 · 需锁汇/额度与政策利率联动评估"
                : "偏弱 · 极端情景下维持本币稳定成本更高"
        }
      >
        {resilience != null ? (
          <Meter
            label="韧性指数 0–1"
            value={resilience}
            max={1}
            format={(v) => v.toFixed(2)}
            tone={resilience >= 0.66 ? "good" : resilience >= 0.4 ? "warn" : "bad"}
          />
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
        {fxVol != null ? (
          <Text size="small" tone="tertiary">
            年内波动约 ±{fxVol}%（阈值参考 {THRESH.fxVolHighPct}%）
          </Text>
        ) : null}
      </Panel>
    </Grid>
  );
}

/** 信贷水位 */
export function CreditDebtCharts({ snap }: { snap: MacroChartSnap }) {
  const theme = useHostTheme();
  const c = mapChrome(theme);
  const pair = parseCreditPair(snap.privCreditOrConsumer);
  const hh = parsePct(snap.householdDebtToGdp) ?? parseFirstNumber(snap.householdDebtToGdp);
  const gov = parsePct(snap.debtToGdp);
  const conf = parseFirstNumber(snap.consumerConfidence);

  const consShare =
    pair && pair.privateLoan > 0 ? (pair.consumer / pair.privateLoan) * 100 : null;
  const otherShare = consShare != null ? Math.max(0, 100 - consShare) : null;

  const hhCeil = THRESH.householdDebtCeilPct;
  const govWatch = THRESH.govDebtWatchPct;
  const nearTop =
    (hh != null && hh >= hhCeil * 0.85) || (gov != null && gov >= govWatch * 0.9);

  return (
    <Grid columns={3} gap={8}>
      <Panel
        title="消费 vs 其他信贷"
        subtitle="消费信贷 / 私营部门贷款（本币单位已尝试对齐）"
        footer={
          consShare != null
            ? `消费约占私营贷款 ${consShare.toFixed(0)}% · ${
                consShare >= 55 ? "消费杠杆相对突出" : "消费相对其他信贷尚未一边倒"
              }`
            : "信贷绝对额字段不足或单位无法对齐"
        }
      >
        {consShare != null && otherShare != null ? (
          <HBar
            segments={[
              { label: "消费信贷", pct: consShare, color: c.removed },
              { label: "其他私营信贷", pct: otherShare, color: theme.fill.primary },
            ]}
          />
        ) : (
          <Text size="small" tone="tertiary">
            —
          </Text>
        )}
      </Panel>

      <Panel
        title="负债率结构"
        subtitle={`居民阈值示意 ${hhCeil}% · 政府观察 ${govWatch}%`}
        footer={
          nearTop
            ? "至少一项接近观察阈值 · 结构有触顶压力"
            : hh != null && gov != null
              ? "居民与政府负债率距新兴市场高位阈值仍有空间"
              : "结构不全"
        }
      >
        <Stack gap={8}>
          {hh != null ? (
            <Meter
              label="居民债务/GDP"
              value={hh}
              max={80}
              marker={hhCeil}
              format={(v) => `${v}%`}
              tone={hh >= hhCeil ? "bad" : hh >= hhCeil * 0.85 ? "warn" : "good"}
            />
          ) : null}
          {gov != null ? (
            <Meter
              label="政府债务/GDP"
              value={gov}
              max={120}
              marker={govWatch}
              format={(v) => `${v}%`}
              tone={gov >= govWatch ? "warn" : "neutral"}
            />
          ) : null}
          {hh == null && gov == null ? (
            <Text size="small" tone="tertiary">
              —
            </Text>
          ) : null}
        </Stack>
      </Panel>

      <Panel
        title="触顶判断"
        subtitle="相对框架阈值，非审计结论"
        footer={
          conf != null ? `消费者信心约 ${conf}` : "信心指数未录"
        }
      >
        <Stack gap={6}>
          <div style={{ fontSize: 20, fontWeight: 600, color: c.text }}>
            {nearTop ? "偏紧" : "未触顶"}
          </div>
          <Text size="small" tone="secondary">
            {hh != null
              ? `居民 ${hh}% / 阈值≈${hhCeil}%（余量 ${Math.max(0, hhCeil - hh).toFixed(0)}pct）`
              : "居民杠杆缺数"}
          </Text>
          <Text size="small" tone="secondary">
            {gov != null
              ? `政府 ${gov}% / 观察≈${govWatch}%`
              : "政府债务缺数"}
          </Text>
          <Text size="small" tone="tertiary">
            现金贷过热仍需 NPL/多头/非银增速交叉；此处仅为宏观水位
          </Text>
        </Stack>
      </Panel>
    </Grid>
  );
}
