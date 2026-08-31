export type UserRole = "brand" | "kol" | "admin";
export type UserStatus = "pending" | "approved" | "suspended";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  membership_expires_at: string | null;
  profile?: Record<string, unknown> | null;
}

export interface KolProfile {
  id: string;
  user_id: string | null;
  name: string;
  ig_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  follower_count: number;
  follower_count_raw?: string | null;
  follower_tier?: FollowerTier;
  audience_profile: string | null;
  content_types: string[];
  collaboration_types: string[];
  collaboration_price: string | null;
  boarding_status?: string | null;
  membership_tag?: string | null;
  data_check?: string | null;
  past_cases: string | null;
  open_to_contact: boolean;
  is_public: boolean;
}

export type FollowerTier = "under_10k" | "10k_to_100k" | "over_100k";

export interface Campaign {
  id: string;
  brand_user_id: string;
  title: string;
  brand_name: string;
  product_service_intro: string;
  budget: string | null;
  target_kol_types: string[];
  event_date: string | null;
  content_description: string;
  reward_description: string | null;
  application_deadline: string | null;
  status: string;
  application_id?: string | null;
  application_status?: string | null;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_name: string;
  company_intro: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  open_to_contact: boolean;
  is_public: boolean;
}

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  kol_user_id: string;
  message: string | null;
  status: string;
  kol_name?: string;
  kol_email?: string;
  campaign_title?: string;
  brand_name?: string;
}

export interface ContactRequest {
  id: string;
  from_user_id: string;
  target_type: "kol" | "brand";
  target_profile_id: string;
  message: string | null;
  status: string;
  admin_read: boolean;
  created_at: string;
  from_email?: string;
  from_role?: string;
  kol_name?: string;
  target_brand_name?: string;
  from_brand_name?: string;
  from_kol_name?: string;
}

export interface SponsorshipOpportunity {
  slug: string;
  title: string;
  start_date: string;
  end_date: string;
  deck_url: string;
  interested: boolean;
}

export interface SponsorshipInterest {
  id: string;
  opportunity_slug: string;
  opportunity_title: string;
  start_date: string;
  end_date: string;
  from_email: string;
  from_brand_name?: string;
  status: string;
  admin_read: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  brand_user_id: string;
  name: string;
  quantity: number;
  experience_content: string;
  collaboration_terms: string | null;
  required_deliverables: string | null;
  application_deadline: string | null;
  status: string;
  brand_name?: string;
  application_status?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  max_participants: number | null;
  allow_brand_exposure: boolean;
  is_published: boolean;
  registration_deadline: string | null;
  source_ref: string | null;
  registration_id?: string | null;
  exposure_requested?: boolean;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null;
  registrant_name: string | null;
  registrant_email: string | null;
  is_member: boolean;
  exposure_requested: boolean;
  status: string;
  attended: boolean;
  created_at: string;
  email?: string;
  role?: string;
  brand_name?: string;
  kol_name?: string;
}

export interface Member {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  membership_expires_at: string | null;
  brand_name?: string;
  kol_name?: string;
  imported?: boolean;
  source_row?: number;
  instagram_url?: string | null;
  website_url?: string | null;
  follower_count?: number;
  collaboration_price?: string | null;
  boarding_status?: string | null;
  representative_name?: string | null;
  line_id?: string | null;
  application_note?: string | null;
  synced_at?: string;
}
