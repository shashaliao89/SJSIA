import type { FollowerTier, KolProfile } from "./types";

export const FOLLOWER_TIERS: Array<{
  key: FollowerTier;
  label: string;
  description: string;
}> = [
  { key: "under_10k", label: "1 萬以下", description: "粉絲數少於 10,000" },
  { key: "10k_to_100k", label: "1 萬～10 萬", description: "粉絲數 10,000–99,999" },
  { key: "over_100k", label: "10 萬以上", description: "粉絲數 100,000 以上" },
];

export function followerTier(count: number): FollowerTier {
  if (count < 10_000) return "under_10k";
  if (count < 100_000) return "10k_to_100k";
  return "over_100k";
}

export function groupKolsByFollowers(kols: KolProfile[]) {
  return FOLLOWER_TIERS.map((tier) => ({
    ...tier,
    kols: kols.filter((kol) => (kol.follower_tier ?? followerTier(kol.follower_count ?? 0)) === tier.key),
  }));
}

export function formatFollowers(count: number) {
  return new Intl.NumberFormat("zh-TW").format(count ?? 0);
}
