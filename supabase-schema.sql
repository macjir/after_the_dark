-- =============================================================
-- After the Dark — Crisis Communication App
-- Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------
-- CRISIS STATUS (single row, always id=1)
-- ---------------------------------------------------------------
CREATE TABLE crisis_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'blackout')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO crisis_status (id, status) VALUES (1, 'normal');

-- ---------------------------------------------------------------
-- CITIZENS
-- ---------------------------------------------------------------
CREATE TABLE citizens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT 'Demo Zone',
  health_info TEXT DEFAULT '',
  location TEXT DEFAULT ''
);

-- ---------------------------------------------------------------
-- CITIZEN OK STATUS
-- ---------------------------------------------------------------
CREATE TABLE citizen_status (
  citizen_id TEXT PRIMARY KEY REFERENCES citizens(id) ON DELETE CASCADE,
  is_ok BOOLEAN DEFAULT FALSE,
  ok_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------
-- CONTACTS (each citizen's contact list)
-- linked_citizen_id = if the contact is also a citizen in this app
-- ---------------------------------------------------------------
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  linked_citizen_id TEXT REFERENCES citizens(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT ''
);

-- ---------------------------------------------------------------
-- ANNOUNCEMENTS (from coordinator → citizens)
-- ---------------------------------------------------------------
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'blackout', 'all_clear', 'update')),
  area TEXT DEFAULT 'Demo Zone',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- CHAT MESSAGES (citizens + coordinator ↔ AI)
-- ---------------------------------------------------------------
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,           -- 'citizen-1', 'citizen-2', 'coordinator'
  role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'coordinator')),
  content TEXT NOT NULL,
  suggested_buttons JSONB DEFAULT '[]'::jsonb,
  call_izs BOOLEAN DEFAULT FALSE,
  send_ok_to_contacts BOOLEAN DEFAULT FALSE,
  can_send BOOLEAN DEFAULT FALSE,
  final_announcement TEXT,
  announcement_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- SEED DATA
-- ---------------------------------------------------------------
INSERT INTO citizens (id, name, zone, health_info, location) VALUES
  ('citizen-1', 'Jan Novák', 'Demo Zone', 'Diabetes: yes, Heart disease: no, Movement restrictions: no, Pregnancy: no', 'Praha 7'),
  ('citizen-2', 'Marie Svobodová', 'Demo Zone', 'Diabetes: no, Heart disease: no, Movement restrictions: no, Pregnancy: no', 'Praha 7');

INSERT INTO citizen_status (citizen_id, is_ok, ok_at) VALUES
  ('citizen-1', FALSE, NULL),
  ('citizen-2', FALSE, NULL);

-- Jan Novák's contacts (Marie is linked, Mamka is external)
INSERT INTO contacts (owner_id, linked_citizen_id, name, phone) VALUES
  ('citizen-1', 'citizen-2', 'Marie Svobodová', '+420 987 654 321'),
  ('citizen-1', NULL, 'Mamka', '+420 123 456 789');

-- Marie Svobodová's contacts (Jan is linked, Táta is external)
INSERT INTO contacts (owner_id, linked_citizen_id, name, phone) VALUES
  ('citizen-2', 'citizen-1', 'Jan Novák', '+420 111 222 333'),
  ('citizen-2', NULL, 'Táta', '+420 444 555 666');

-- ---------------------------------------------------------------
-- ENABLE REALTIME
-- Run these after the tables are created
-- ---------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE crisis_status;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE citizen_status;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ---------------------------------------------------------------
-- DISABLE RLS FOR DEMO (enable + configure for production)
-- ---------------------------------------------------------------
ALTER TABLE crisis_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE citizens DISABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
