-- CrusadeCommand tables (cc_ prefix to share Supabase project with Guardian)
-- Run this in the Supabase SQL Editor

-- Profile extends Supabase auth.users
CREATE TABLE IF NOT EXISTS cc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS cc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  supply_limit INT NOT NULL DEFAULT 1000,
  starting_rp INT NOT NULL DEFAULT 5,
  current_round INT NOT NULL DEFAULT 1,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_campaigns_join_code ON cc_campaigns(join_code);
CREATE INDEX IF NOT EXISTS idx_cc_campaigns_owner ON cc_campaigns(owner_id);

-- Campaign Players
CREATE TABLE IF NOT EXISTS cc_campaign_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES cc_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  detachment_id TEXT,
  supply_used INT NOT NULL DEFAULT 0,
  requisition_points INT NOT NULL DEFAULT 5,
  battles_played INT NOT NULL DEFAULT 0,
  battles_won INT NOT NULL DEFAULT 0,
  battles_lost INT NOT NULL DEFAULT 0,
  battles_drawn INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cc_players_campaign ON cc_campaign_players(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cc_players_user ON cc_campaign_players(user_id);

-- Crusade Units
CREATE TABLE IF NOT EXISTS cc_crusade_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES cc_campaign_players(id) ON DELETE CASCADE,
  datasheet_name TEXT NOT NULL,
  custom_name TEXT NOT NULL,
  points_cost INT NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'Battle-ready',
  experience_points INT NOT NULL DEFAULT 0,
  crusade_points INT NOT NULL DEFAULT 0,
  battles_played INT NOT NULL DEFAULT 0,
  battles_survived INT NOT NULL DEFAULT 0,
  model_count INT,
  equipment TEXT NOT NULL DEFAULT '',
  battle_honours JSONB NOT NULL DEFAULT '[]',
  battle_scars JSONB NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  is_destroyed BOOLEAN NOT NULL DEFAULT false,
  is_warlord BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_units_player ON cc_crusade_units(player_id);

-- Battles
CREATE TABLE IF NOT EXISTS cc_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES cc_campaigns(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES cc_campaign_players(id) ON DELETE CASCADE,
  opponent_id TEXT NOT NULL DEFAULT '',
  opponent_name TEXT NOT NULL,
  opponent_faction TEXT NOT NULL,
  mission_name TEXT NOT NULL,
  battle_size TEXT NOT NULL,
  player_vp INT NOT NULL DEFAULT 0,
  opponent_vp INT NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK (result IN ('victory', 'defeat', 'draw')),
  units_fielded JSONB NOT NULL DEFAULT '[]',
  marked_for_greatness TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_battles_campaign ON cc_battles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cc_battles_player ON cc_battles(player_id);

-- Campaign History (archived campaigns)
CREATE TABLE IF NOT EXISTS cc_campaign_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  campaign_ref_id TEXT NOT NULL,
  name TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  faction_name TEXT NOT NULL,
  faction_icon TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  total_battles INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_history_user ON cc_campaign_history(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_cc_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cc_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created_cc ON auth.users;
CREATE TRIGGER on_auth_user_created_cc
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_cc_user();

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE cc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_crusade_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_campaign_history ENABLE ROW LEVEL SECURITY;

-- Profiles: read any, update own
CREATE POLICY "Profiles: read any" ON cc_profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: update own" ON cc_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON cc_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Campaigns: read if member or owner, insert if authenticated, update/delete if owner
CREATE POLICY "Campaigns: read as member" ON cc_campaigns FOR SELECT USING (
  owner_id = auth.uid() OR
  id IN (SELECT campaign_id FROM cc_campaign_players WHERE user_id = auth.uid())
);
CREATE POLICY "Campaigns: insert" ON cc_campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Campaigns: update as owner" ON cc_campaigns FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Campaigns: delete as owner" ON cc_campaigns FOR DELETE USING (auth.uid() = owner_id);

-- Campaign Players: read if in same campaign, insert own, update own
CREATE POLICY "Players: read same campaign" ON cc_campaign_players FOR SELECT USING (
  campaign_id IN (SELECT campaign_id FROM cc_campaign_players WHERE user_id = auth.uid())
);
CREATE POLICY "Players: insert own" ON cc_campaign_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players: update own" ON cc_campaign_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players: delete own" ON cc_campaign_players FOR DELETE USING (auth.uid() = user_id);

-- Also allow reading campaigns by join_code for the join flow (before user is a member)
CREATE POLICY "Campaigns: read by join code" ON cc_campaigns FOR SELECT USING (true);

-- Units: CRUD own, read others in same campaign
CREATE POLICY "Units: read same campaign" ON cc_crusade_units FOR SELECT USING (
  player_id IN (
    SELECT cp.id FROM cc_campaign_players cp
    WHERE cp.campaign_id IN (
      SELECT campaign_id FROM cc_campaign_players WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Units: insert own" ON cc_crusade_units FOR INSERT WITH CHECK (
  player_id IN (SELECT id FROM cc_campaign_players WHERE user_id = auth.uid())
);
CREATE POLICY "Units: update own" ON cc_crusade_units FOR UPDATE USING (
  player_id IN (SELECT id FROM cc_campaign_players WHERE user_id = auth.uid())
);
CREATE POLICY "Units: delete own" ON cc_crusade_units FOR DELETE USING (
  player_id IN (SELECT id FROM cc_campaign_players WHERE user_id = auth.uid())
);

-- Battles: insert own, read same campaign
CREATE POLICY "Battles: read same campaign" ON cc_battles FOR SELECT USING (
  campaign_id IN (SELECT campaign_id FROM cc_campaign_players WHERE user_id = auth.uid())
);
CREATE POLICY "Battles: insert own" ON cc_battles FOR INSERT WITH CHECK (
  player_id IN (SELECT id FROM cc_campaign_players WHERE user_id = auth.uid())
);
CREATE POLICY "Battles: update own" ON cc_battles FOR UPDATE USING (
  player_id IN (SELECT id FROM cc_campaign_players WHERE user_id = auth.uid())
);

-- Campaign History: CRUD own only
CREATE POLICY "History: read own" ON cc_campaign_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "History: insert own" ON cc_campaign_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "History: update own" ON cc_campaign_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "History: delete own" ON cc_campaign_history FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for campaign data
ALTER PUBLICATION supabase_realtime ADD TABLE cc_campaign_players;
ALTER PUBLICATION supabase_realtime ADD TABLE cc_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE cc_crusade_units;
