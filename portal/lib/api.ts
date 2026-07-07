const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      API_URL.includes("localhost")
        ? "無法連線 API，請確認 Backend 已啟動，或 Vercel 已設定 NEXT_PUBLIC_API_URL"
        : "網路連線失敗，請檢查網路後再試",
      0
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data.error;
    let msg = "請求失敗";
    if (typeof err === "string") {
      msg = err;
    } else if (err && typeof err === "object") {
      const fieldErrors = err.fieldErrors as Record<string, string[] | undefined> | undefined;
      const firstField = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : undefined;
      msg = err.formErrors?.[0] ?? firstField ?? msg;
    }
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export function dashboardPath(role: string) {
  if (role === "brand") return "/dashboard/brand";
  if (role === "kol") return "/dashboard/kol";
  if (role === "admin") return "/dashboard/admin";
  return "/login";
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "待審核",
  approved: "已通過",
  suspended: "已停用",
  pending_review: "待協會審核",
  rejected: "已拒絕",
  closed: "已結束",
  active: "進行中",
};

export const CONTENT_TYPES = ["健身", "旅遊", "生活", "運動", "親子"];
export const COLLAB_TYPES = ["互惠", "付費", "團購", "導購"];
