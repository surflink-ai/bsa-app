-- Phase 2: Communications (WhatsApp blasts, contacts, templates)

-- Contacts: athletes, parents, coaches, sponsors, committee members
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text, -- E.164 format
  email text,
  type text NOT NULL DEFAULT 'athlete' CHECK (type IN ('athlete','parent','coach','sponsor','committee','other')),
  division_ids text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  opted_out boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_active ON contacts(active) WHERE active = true;

-- Blast templates (pre-approved message templates)
CREATE TABLE IF NOT EXISTS blast_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL, -- supports {{variable}} interpolation
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('event_reminder','heat_draw','results','weather_delay','general','registration')),
  variables text[] DEFAULT '{}', -- list of variable names used
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Blast messages (sent or scheduled broadcasts)
CREATE TABLE IF NOT EXISTS blast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL, -- final rendered body
  template_id uuid REFERENCES blast_templates(id) ON DELETE SET NULL,
  audience_filter jsonb DEFAULT '{}', -- { type: [], divisions: [], tags: [], custom_ids: [] }
  recipient_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blast_messages_status ON blast_messages(status);

-- Blast recipients (per-contact delivery tracking)
CREATE TABLE IF NOT EXISTS blast_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blast_id uuid NOT NULL REFERENCES blast_messages(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  phone text NOT NULL,
  personalized_body text, -- body with variables filled in for this contact
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
  wa_message_sid text, -- Twilio message SID
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blast_recipients_blast ON blast_recipients(blast_id);
CREATE INDEX idx_blast_recipients_status ON blast_recipients(status);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Insert default templates
INSERT INTO blast_templates (name, body, category, variables) VALUES
  ('Event Reminder', 'Hey {{name}}! BSA Event is this {{day}} at {{location}}. Registration closes {{deadline}}. See you there!', 'event_reminder', ARRAY['name','day','location','deadline']),
  ('Heat Draw Published', '{{name}}, your heat draw is live! You''re in Heat {{heat_num}}. Check it out: {{link}}', 'heat_draw', ARRAY['name','heat_num','link']),
  ('Results Announcement', 'Results are in! {{division}} winner: {{winner}}. Full rankings: {{link}}', 'results', ARRAY['division','winner','link']),
  ('Weather Delay', 'Attention athletes: Event delayed due to {{reason}}. New start time: {{time}}. Stay tuned.', 'weather_delay', ARRAY['reason','time']),
  ('General Update', '{{message}}', 'general', ARRAY['message']),
  ('Registration Open', 'Registration is now open for {{event_name}}! Sign up at {{link}} before spots fill up.', 'registration', ARRAY['event_name','link'])
ON CONFLICT DO NOTHING;

-- RLS policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blast_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (profiles with role in super_admin, editor, event_manager)
CREATE POLICY "Admin read contacts" ON contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
CREATE POLICY "Admin write contacts" ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);

CREATE POLICY "Admin read templates" ON blast_templates FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);

CREATE POLICY "Admin read blasts" ON blast_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
CREATE POLICY "Admin write blasts" ON blast_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);

CREATE POLICY "Admin read recipients" ON blast_recipients FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);

CREATE POLICY "Admin read audit" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
