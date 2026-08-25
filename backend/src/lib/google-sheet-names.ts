const LEGACY_PERSONAL_SHEET = "個人會員＿AI整理";
const LEGACY_ORGANIZATION_SHEET = "團體會員＿AI整理";

export const GOOGLE_FORM_RESPONSE_SHEET =
  process.env.GOOGLE_FORM_RESPONSE_SHEET?.trim() || "表單回覆 1";

export const GOOGLE_PERSONAL_MEMBER_SHEET = (() => {
  const configured = process.env.GOOGLE_PERSONAL_MEMBER_SHEET?.trim();
  return !configured || configured === LEGACY_PERSONAL_SHEET ? "個人會員＿整理" : configured;
})();

export const GOOGLE_ORGANIZATION_MEMBER_SHEET = (() => {
  const configured = process.env.GOOGLE_ORGANIZATION_MEMBER_SHEET?.trim();
  return !configured || configured === LEGACY_ORGANIZATION_SHEET ? "團體會員＿整理" : configured;
})();
