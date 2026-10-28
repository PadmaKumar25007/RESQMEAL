-- ResQMeal initial PostgreSQL schema (Supabase / PostgreSQL)
-- Tables: users, donations, donation_requests, deliveries
-- Status enums are stored as VARCHAR with CHECK constraints.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'ngo', 'volunteer', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'suspended')),
  phone VARCHAR(30),
  organization_name VARCHAR(160),
  address VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'Cooked meal',
  quantity VARCHAR(80) NOT NULL,
  servings INTEGER NOT NULL CHECK (servings >= 1),
  pickup_location VARCHAR(255) NOT NULL,
  distance VARCHAR(20) DEFAULT '1.5 km',
  prepared_time VARCHAR(80) DEFAULT 'Prepared recently',
  expiry_text VARCHAR(80) DEFAULT '3h left',
  emoji VARCHAR(8) DEFAULT '🍲',
  description TEXT,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'requested', 'accepted', 'picked_up', 'delivered', 'completed', 'cancelled')),
  claimed_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  required_quantity VARCHAR(80) NOT NULL,
  people_to_serve INTEGER NOT NULL CHECK (people_to_serve >= 1),
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'fulfilled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
  volunteer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  food VARCHAR(160) NOT NULL,
  quantity VARCHAR(80) NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  distance VARCHAR(20) DEFAULT '3.0 km',
  eta VARCHAR(20) DEFAULT '20 min',
  urgency VARCHAR(20) NOT NULL DEFAULT 'Medium',
  status VARCHAR(20) NOT NULL DEFAULT 'Available',
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_status_created ON donations (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_donor_created ON donations (donor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_requests_donation ON donation_requests (donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_ngo ON donation_requests (ngo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries (status, created_at DESC);

-- Row Level Security (enable in Supabase dashboard / SQL editor as needed)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Example permissive RLS policy for demo (replace with authenticated policies in production)
CREATE POLICY "public_read_donations" ON donations FOR SELECT USING (true);
CREATE POLICY "public_insert_donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_requests" ON donation_requests FOR SELECT USING (true);
CREATE POLICY "public_insert_requests" ON donation_requests FOR INSERT WITH CHECK (true);
