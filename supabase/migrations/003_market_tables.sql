-- ============================================================================
-- Warcaster Bits Market — Migration 003
-- ============================================================================

-- Market Listings
CREATE TABLE IF NOT EXISTS cc_market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  faction_id TEXT,
  unit_name TEXT,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('weapons','bodies','vehicles','accessories','full_model','sprue','other')),
  price NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  condition TEXT NOT NULL DEFAULT 'new_on_sprue'
    CHECK (condition IN ('new_on_sprue','new_assembled','painted','used','damaged')),
  photos TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','sold','reserved','archived')),
  location TEXT NOT NULL DEFAULT '',
  shipping BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_listings_seller ON cc_market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_cc_listings_faction ON cc_market_listings(faction_id);
CREATE INDEX IF NOT EXISTS idx_cc_listings_status ON cc_market_listings(status);
CREATE INDEX IF NOT EXISTS idx_cc_listings_category ON cc_market_listings(category);
CREATE INDEX IF NOT EXISTS idx_cc_listings_created ON cc_market_listings(created_at DESC);

-- Market Messages
CREATE TABLE IF NOT EXISTS cc_market_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES cc_market_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  text TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_messages_listing ON cc_market_messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_cc_messages_sender ON cc_market_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_cc_messages_recipient ON cc_market_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_cc_messages_created ON cc_market_messages(created_at);

-- Market Favorites
CREATE TABLE IF NOT EXISTS cc_market_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES cc_market_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_cc_favorites_user ON cc_market_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_favorites_listing ON cc_market_favorites(listing_id);

-- RLS
ALTER TABLE cc_market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_market_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_market_favorites ENABLE ROW LEVEL SECURITY;

-- Listings: anyone authenticated reads active listings + own listings
CREATE POLICY "Listings: read active or own" ON cc_market_listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Listings: insert own" ON cc_market_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Listings: update own" ON cc_market_listings
  FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Listings: delete own" ON cc_market_listings
  FOR DELETE USING (auth.uid() = seller_id);

-- Messages: read if sender or recipient
CREATE POLICY "Messages: read own" ON cc_market_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Messages: insert as sender" ON cc_market_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Messages: mark read as recipient" ON cc_market_messages
  FOR UPDATE USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Favorites: user manages own
CREATE POLICY "Favorites: read own" ON cc_market_favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Favorites: insert own" ON cc_market_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Favorites: delete own" ON cc_market_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cc_market_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE cc_market_listings;
