export type UserRole = "brand" | "kol" | "admin";
export type UserStatus = "pending" | "approved" | "suspended";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  membership_expires_at: string | null;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
}
