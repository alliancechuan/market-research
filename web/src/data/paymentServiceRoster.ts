import raw from "./payment-service-roster.json";

export type PaymentServiceKind = "官方支付基建" | "国民级支付机构" | "支付代理服务商";

export type PaymentRosterRow = {
  region: string;
  kind: PaymentServiceKind;
  group: string;
  brands: string;
  countries: string;
  licenses: string;
  regulators: string;
  controller: string;
};

export const PAYMENT_SERVICE_ROSTER = raw as {
  meta: { as_of: string; note: string; kinds: PaymentServiceKind[] };
  companies: PaymentRosterRow[];
};

export const PAYMENT_KIND_ORDER: PaymentServiceKind[] = [
  "官方支付基建",
  "国民级支付机构",
  "支付代理服务商",
];

export const PAYMENT_KIND_LABEL: Record<PaymentServiceKind, string> = {
  官方支付基建: "官方支付基建",
  国民级支付机构: "国民级支付机构",
  支付代理服务商: "支付代理服务商",
};

export const PAYMENT_KIND_BLURB: Record<PaymentServiceKind, string> = {
  官方支付基建: "央行/清算所/国家实时支付系统（如网联、UPI、Pix、SPEI、PromptPay）。",
  国民级支付机构: "国民级持牌支付/钱包（如支付宝、GCash、PhonePe、M-Pesa）；通常持有支付/电子货币牌照。",
  支付代理服务商: "取得支付机构代理/收单/聚合资质的服务商（如墨西哥 MangoPay、PandaPay；Xendit、Stripe）。",
};
