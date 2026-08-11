import raw from "./ai-product-rank-36kr.json";

export type AiAgentSceneLeaf = {
  title: string;
  hint: string;
  line: string;
  boards?: string[];
  company?: string;
  intro?: string;
};

export const AI_PRODUCT_RANK_36KR = raw as {
  meta: { source: string; as_of: string; note: string };
  agents: AiAgentSceneLeaf[];
};

/** Agent 场景词条（名称 → 行为/目的 → 玩家名单） */
export const AGENT_SCENE_LEAVES: AiAgentSceneLeaf[] = AI_PRODUCT_RANK_36KR.agents.map((a) => ({
  title: a.title,
  hint: a.hint,
  line: a.line,
}));
