CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('brand', 'kol', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('pending_review', 'approved', 'rejected', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'pending',
  email_verified_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('register', 'reset_password')),
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_verification_codes_lookup
  ON auth_verification_codes(email, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  company_intro TEXT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  open_to_contact BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kol_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  ig_url VARCHAR(500),
  youtube_url VARCHAR(500),
  tiktok_url VARCHAR(500),
  follower_count INTEGER DEFAULT 0,
  audience_profile TEXT,
  content_types TEXT[] DEFAULT '{}',
  collaboration_types TEXT[] DEFAULT '{}',
  collaboration_price TEXT,
  follower_count_raw VARCHAR(50),
  boarding_status VARCHAR(100),
  membership_tag VARCHAR(50),
  data_check VARCHAR(100),
  source_ref VARCHAR(255),
  past_cases TEXT,
  open_to_contact BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imported_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ref VARCHAR(255) UNIQUE NOT NULL,
  source_row INTEGER NOT NULL,
  member_type user_role NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  line_id VARCHAR(255),
  representative_name VARCHAR(255),
  instagram_url VARCHAR(500),
  website_url VARCHAR(500),
  follower_count INTEGER DEFAULT 0,
  collaboration_price TEXT,
  boarding_status VARCHAR(100),
  application_note TEXT,
  review_status user_status NOT NULL DEFAULT 'pending',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  product_service_intro TEXT NOT NULL,
  budget VARCHAR(255),
  target_kol_types TEXT[] DEFAULT '{}',
  event_date DATE,
  content_description TEXT NOT NULL,
  reward_description TEXT,
  application_deadline DATE,
  status campaign_status NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  kol_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, kol_user_id)
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  experience_content TEXT NOT NULL,
  collaboration_terms TEXT,
  required_deliverables TEXT,
  application_deadline DATE,
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kol_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  deliverable_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, kol_user_id)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(500),
  max_participants INTEGER,
  allow_brand_exposure BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  registrant_name VARCHAR(255),
  registrant_email VARCHAR(255),
  is_member BOOLEAN NOT NULL DEFAULT true,
  exposure_requested BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'registered',
  attended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_public ON kol_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_follower_count ON kol_profiles(follower_count);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Migrate existing KOL profiles when these columns are introduced after initial setup.
ALTER TABLE kol_profiles ALTER COLUMN collaboration_price TYPE TEXT;
ALTER TABLE kol_profiles ADD COLUMN IF NOT EXISTS follower_count_raw VARCHAR(50);
ALTER TABLE kol_profiles ADD COLUMN IF NOT EXISTS boarding_status VARCHAR(100);
ALTER TABLE kol_profiles ADD COLUMN IF NOT EXISTS membership_tag VARCHAR(50);
ALTER TABLE kol_profiles ADD COLUMN IF NOT EXISTS data_check VARCHAR(100);
ALTER TABLE kol_profiles ADD COLUMN IF NOT EXISTS source_ref VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kol_profiles_source_ref
  ON kol_profiles(source_ref) WHERE source_ref IS NOT NULL;

-- Migrate existing brand_profiles if columns were added later
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS open_to_contact BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_brand_profiles_public ON brand_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_imported_members_type ON imported_members(member_type);
CREATE INDEX IF NOT EXISTS idx_imported_members_review_status ON imported_members(review_status);

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('kol', 'brand')),
  target_profile_id UUID NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_admin_read ON contact_requests(admin_read);
