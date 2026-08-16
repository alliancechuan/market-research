/** 登录会话权限（访客 vs 白名单成员） */

export const GUEST_SESSION = "guest";

/** 访客脱敏占位（合作机构名、持仓金额等） */
export const SENSITIVE_MASK = "**";

export function isGuestSession(session: string | null | undefined): boolean {
  return (session ?? "").trim().toLowerCase() === GUEST_SESSION;
}

/** 访客不可见合作机构具名与持仓明细；可看展业国数量等公开层 */
export function canViewPartnerDetail(session: string | null | undefined): boolean {
  return !isGuestSession(session);
}

/** 访客不可见信源目录、〔n〕标注与本卡信源块 */
export function canViewSourceCite(session: string | null | undefined): boolean {
  return !isGuestSession(session);
}

export function maskIfGuest(guest: boolean, value: string): string {
  return guest ? SENSITIVE_MASK : value;
}

/** 合作机构展示名：访客统一「合作机构 **」 */
export function partnerPublicName(guest: boolean, realName: string, index = 0): string {
  if (!guest) return realName;
  return `合作机构 ${SENSITIVE_MASK}`;
}
