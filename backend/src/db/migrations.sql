CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (supports all roles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'civilian'
    CHECK (role IN ('civilian','police','hospital','fire_department','ngo','blood_donor','volunteer','admin')),
  sub_roles TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  badge_number VARCHAR(50),
  organization VARCHAR(150),
  location GEOMETRY(Point, 4326),
  notification_token TEXT,
  alert_radius_km FLOAT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents table
CREATE TYPE incident_type AS ENUM (
  'fire','flood','earthquake','accident','medical_emergency',
  'crime','riot','gas_leak','building_collapse','missing_person',
  'child_abuse','domestic_violence','road_hazard','power_outage',
  'water_crisis','epidemic','chemical_spill','stampede','terrorism','other'
);

CREATE TYPE incident_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE incident_status AS ENUM ('reported','verified','responding','resolved','false_alarm');

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type incident_type NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'reported',
  location GEOMETRY(Point, 4326) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  reported_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  photo_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  casualty_count INTEGER DEFAULT 0,
  injured_count INTEGER DEFAULT 0,
  affected_area_radius_m FLOAT DEFAULT 500,
  requires_blood_type VARCHAR(10),
  weather_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responders on incidents
CREATE TABLE IF NOT EXISTS incident_responders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(50),
  status VARCHAR(30) DEFAULT 'en_route'
    CHECK (status IN ('en_route','on_scene','completed','withdrawn')),
  eta_minutes INTEGER,
  current_location GEOMETRY(Point, 4326),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(incident_id, user_id)
);

-- Chat messages per incident
CREATE TABLE IF NOT EXISTS incident_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text'
    CHECK (message_type IN ('text','image','location','alert','system')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blood donors registry
CREATE TABLE IF NOT EXISTS blood_donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  is_available BOOLEAN DEFAULT true,
  last_donation_date DATE,
  location GEOMETRY(Point, 4326),
  city VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOS events (one-tap emergency)
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  location GEOMETRY(Point, 4326) NOT NULL,
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','responding','resolved')),
  responder_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications log
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  incident_id UUID REFERENCES incidents(id),
  title VARCHAR(200),
  body TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial indexes for performance
CREATE INDEX IF NOT EXISTS incidents_location_idx ON incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS users_location_idx ON users USING GIST(location);
CREATE INDEX IF NOT EXISTS blood_donors_location_idx ON blood_donors USING GIST(location);
CREATE INDEX IF NOT EXISTS sos_events_location_idx ON sos_events USING GIST(location);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents(status);
CREATE INDEX IF NOT EXISTS incidents_type_idx ON incidents(type);
CREATE INDEX IF NOT EXISTS incidents_created_idx ON incidents(created_at DESC);