import raw from "./cc-source-tiers.json";

export type CcSourceTier = {
  id: string;
  rank: number;
  nameZh: string;
  cadence: string;
  use: string;
  examples: string[];
  dataKey?: string;
};

export type CcSourceTiers = {
  asOf: string;
  note: string;
  tiers: CcSourceTier[];
  fieldTags: string[];
};

export const CC_SOURCE_TIERS = raw as CcSourceTiers;
