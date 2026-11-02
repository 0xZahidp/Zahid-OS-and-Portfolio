-- ==============================================================================
-- Zahid OS Travel Tracker: Dedicated Supabase Relational Tables & Seed
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/txrnbazpdyoaazszkwwq/sql/new
-- ==============================================================================

-- 1. Create os_travel_districts table (All 64 canonical districts of Bangladesh)
CREATE TABLE IF NOT EXISTS public.os_travel_districts (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bn_name VARCHAR(100) NOT NULL,
  division VARCHAR(50) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  status VARCHAR(30) DEFAULT 'not_visited' CHECK (status IN ('not_visited', 'planned', 'visited', 'revisit_planned')),
  visits_count INTEGER DEFAULT 0 CHECK (visits_count >= 0),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes TEXT DEFAULT '',
  places TEXT[] DEFAULT '{}',
  last_visited_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_travel_districts_division ON public.os_travel_districts (division);
CREATE INDEX IF NOT EXISTS idx_travel_districts_status ON public.os_travel_districts (status);
CREATE INDEX IF NOT EXISTS idx_travel_districts_slug ON public.os_travel_districts (slug);

-- 2. Create os_travel_memories table (Chronological travel entries & stories)
CREATE TABLE IF NOT EXISTS public.os_travel_memories (
  id TEXT PRIMARY KEY DEFAULT ('mem_' || gen_random_uuid()),
  district_code VARCHAR(10) NOT NULL REFERENCES public.os_travel_districts(code) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  place_name VARCHAR(255),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  transport VARCHAR(80),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_memories_district ON public.os_travel_memories (district_code);
CREATE INDEX IF NOT EXISTS idx_travel_memories_date ON public.os_travel_memories (date DESC);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.os_travel_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_travel_memories ENABLE ROW LEVEL SECURITY;

-- Public can read all travel districts & memories
DROP POLICY IF EXISTS "Public can view travel districts" ON public.os_travel_districts;
CREATE POLICY "Public can view travel districts" ON public.os_travel_districts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view travel memories" ON public.os_travel_memories;
CREATE POLICY "Public can view travel memories" ON public.os_travel_memories
  FOR SELECT USING (true);

-- Authenticated admins and service_role have full CRUD
DROP POLICY IF EXISTS "Admins have full access to travel districts" ON public.os_travel_districts;
CREATE POLICY "Admins have full access to travel districts" ON public.os_travel_districts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to travel districts" ON public.os_travel_districts;
CREATE POLICY "Service role has full access to travel districts" ON public.os_travel_districts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to travel memories" ON public.os_travel_memories;
CREATE POLICY "Admins have full access to travel memories" ON public.os_travel_memories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to travel memories" ON public.os_travel_memories;
CREATE POLICY "Service role has full access to travel memories" ON public.os_travel_memories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- Seed: Canonical 64 Bangladesh Districts + Zahid's Initial Travel Ledger
-- ==============================================================================
INSERT INTO public.os_travel_districts (code, name, bn_name, division, slug, status, visits_count, rating, notes, places, last_visited_at)
VALUES
  -- DHAKA DIVISION (13)
  ('bd-dhk', 'Dhaka', 'ঢাকা', 'dhaka', 'dhaka', 'visited', 15, 5, 'Home base & engineering hub. Explored extensively across Dhanmondi, Gulshan, Uttara and Old Dhaka.', ARRAY['Lalbagh Fort', 'Ahsan Manzil', 'Dhanmondi Lake', 'Hatirjheel', 'Old Dhaka'], '2026-10-28'),
  ('bd-gaz', 'Gazipur', 'গাজীপুর', 'dhaka', 'gazipur', 'visited', 3, 4, 'Lush Sal forest belt and resort escapes just outside capital city limits.', ARRAY['Bhawal National Park', 'Nuhash Polli'], '2026-02-10'),
  ('bd-nar', 'Narayanganj', 'নারায়ণগঞ্জ', 'dhaka', 'narayanganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-mun', 'Munshiganj', 'মুন্সীগঞ্জ', 'dhaka', 'munshiganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-nar2', 'Narsingdi', 'নরসিংদী', 'dhaka', 'narsingdi', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-man', 'Manikganj', 'মানিকগঞ্জ', 'dhaka', 'manikganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-tan', 'Tangail', 'টাঙ্গাইল', 'dhaka', 'tangail', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-kis', 'Kishoreganj', 'কিশোরগঞ্জ', 'dhaka', 'kishoreganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-far', 'Faridpur', 'ফরিদপুর', 'dhaka', 'faridpur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-gop', 'Gopalganj', 'গোপালগঞ্জ', 'dhaka', 'gopalganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-mad', 'Madaripur', 'মাদারীপুর', 'dhaka', 'madaripur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-raj2', 'Rajbari', 'রাজবাড়ী', 'dhaka', 'rajbari', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-sha', 'Shariatpur', 'শরীয়তপুর', 'dhaka', 'shariatpur', 'not_visited', 0, NULL, '', '{}', NULL),

  -- CHATTOGRAM DIVISION (11)
  ('bd-ctg', 'Chattogram', 'চট্টগ্রাম', 'chattogram', 'chattogram', 'visited', 3, 5, 'Port city of green hills and sea breeze. CRB and Patenga are personal favorites.', ARRAY['Patenga Sea Beach', 'CRB Shirishtola', 'Foy''s Lake', 'Naval Beach'], '2025-11-04'),
  ('bd-cox', 'Cox''s Bazar', 'কক্সবাজার', 'chattogram', 'coxs-bazar', 'visited', 4, 5, 'Worlds longest natural sea beach. Marine Drive route is breathtaking during golden hour.', ARRAY['Inani Beach', 'Marine Drive', 'Himchari Waterfall', 'Saint Martin Island'], '2025-12-18'),
  ('bd-cum', 'Cumilla', 'কুমিল্লা', 'chattogram', 'cumilla', 'visited', 3, 5, 'Historic seat of Buddhist archaeological heritage and original Rasmalai.', ARRAY['Mainamati Shalban Vihara', 'Dharmasagar Dighi', 'Kotbari'], '2026-03-12'),
  ('bd-bra', 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'chattogram', 'brahmanbaria', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-cha', 'Chandpur', 'চাঁদপুর', 'chattogram', 'chandpur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-fen', 'Feni', 'ফেনী', 'chattogram', 'feni', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-lak', 'Lakshmipur', 'লক্ষ্মীপুর', 'chattogram', 'lakshmipur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-noa', 'Noakhali', 'নোয়াখালী', 'chattogram', 'noakhali', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-ban', 'Bandarban', 'বান্দরবান', 'chattogram', 'bandarban', 'planned', 0, 5, 'Top wishlist expedition: Trekking to Keokradong, exploring Nafakhum waterfalls, and staying above clouds at Nilgiri.', ARRAY['Keokradong', 'Nilgiri', 'Nafakhum Waterfall', 'Golden Temple'], NULL),
  ('bd-kha', 'Khagrachhari', 'খাগড়াছড়ি', 'chattogram', 'khagrachhari', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-ran', 'Rangamati', 'রাঙ্গামাটি', 'chattogram', 'rangamati', 'planned', 0, 5, 'Kaptai Lake boat voyage to Shuvolong waterfall and visiting tribal textile weavers.', ARRAY['Kaptai Lake', 'Shuvolong Waterfall', 'Hanging Bridge'], NULL),

  -- SYLHET DIVISION (4)
  ('bd-syl', 'Sylhet', 'সিলেট', 'sylhet', 'sylhet', 'visited', 2, 5, 'Land of two leaves and a bud, mystical shrines, crystal clear stone rivers, and freshwater swamp forests.', ARRAY['Ratargul Swamp Forest', 'Jaflong', 'Bichnakandi', 'Shah Jalal Dargah'], '2025-09-24'),
  ('bd-mou', 'Moulvibazar', 'মৌলভীবাজার', 'sylhet', 'moulvibazar', 'visited', 2, 5, 'Lush undulating tea estates of Sreemangal and rainforest canopy walks in Lawachara.', ARRAY['Sreemangal Tea Gardens', 'Lawachara National Park', 'Madhabkunda Waterfall'], '2025-09-22'),
  ('bd-hab', 'Habiganj', 'হবিগঞ্জ', 'sylhet', 'habiganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-sun', 'Sunamganj', 'সুনামগঞ্জ', 'sylhet', 'sunamganj', 'not_visited', 0, NULL, '', '{}', NULL),

  -- RAJSHAHI DIVISION (8)
  ('bd-raj', 'Rajshahi', 'রাজশাহী', 'rajshahi', 'rajshahi', 'planned', 0, 4, 'Silk city on the banks of mighty river Padma, famous for Fazli mangoes and terracotta Bagha Mosque.', ARRAY['Padma River Bank', 'Varendra Research Museum', 'Bagha Mosque'], NULL),
  ('bd-bog', 'Bogura', 'বগুড়া', 'rajshahi', 'bogura', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-joy', 'Joypurhat', 'জয়পুরহাট', 'rajshahi', 'joypurhat', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-nae', 'Naogaon', 'নওগাঁ', 'rajshahi', 'naogaon', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-nat', 'Natore', 'নাটোর', 'rajshahi', 'natore', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-cha2', 'Chapai Nawabganj', 'চাঁপাইনবাবগঞ্জ', 'rajshahi', 'chapai-nawabganj', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-pab', 'Pabna', 'পাবনা', 'rajshahi', 'pabna', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-sir', 'Sirajganj', 'সিরাজগঞ্জ', 'rajshahi', 'sirajganj', 'not_visited', 0, NULL, '', '{}', NULL),

  -- KHULNA DIVISION (10)
  ('bd-khu', 'Khulna', 'খুলনা', 'khulna', 'khulna', 'planned', 0, 5, 'Gateway to Sundarbans mangrove forest, Kotka wildlife sanctuary and Jamtola beach.', ARRAY['Sundarbans Mangrove', 'Kotka Beach', 'Karamjal Wildlife Center'], NULL),
  ('bd-bag', 'Bagerhat', 'বাগেরহাট', 'khulna', 'bagerhat', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-sat', 'Satkhira', 'সাতক্ষীরা', 'khulna', 'satkhira', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-jes', 'Jashore', 'যশোর', 'khulna', 'jashore', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-jhe', 'Jhenaidah', 'ঝিনাইদহ', 'khulna', 'jhenaidah', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-mag', 'Magura', 'মাগুরা', 'khulna', 'magura', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-nar3', 'Narail', 'নড়াইল', 'khulna', 'narail', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-kus', 'Kushtia', 'কুষ্টিয়া', 'khulna', 'kushtia', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-chu', 'Chuadanga', 'চুয়াডাঙ্গা', 'khulna', 'chuadanga', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-meh', 'Meherpur', 'মেহেরপুর', 'khulna', 'meherpur', 'not_visited', 0, NULL, '', '{}', NULL),

  -- BARISHAL DIVISION (6)
  ('bd-bar', 'Barishal', 'বরিশাল', 'barishal', 'barishal', 'planned', 0, 4, 'Venice of Bengal: Floating guava market in canals and sunset over Kirtankhola river.', ARRAY['Floating Guava Market', 'Durga Sagar Dighi', 'Kirtankhola River'], NULL),
  ('bd-bho', 'Bhola', 'ভোলা', 'barishal', 'bhola', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-pat', 'Patuakhali', 'পটুয়াখালী', 'barishal', 'patuakhali', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-pii', 'Pirojpur', 'পিরোজপুর', 'barishal', 'pirojpur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-jal', 'Jhalakathi', 'ঝালকাঠি', 'barishal', 'jhalakathi', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-bar2', 'Barguna', 'বরগুনা', 'barishal', 'barguna', 'not_visited', 0, NULL, '', '{}', NULL),

  -- RANGPUR DIVISION (8)
  ('bd-ran2', 'Rangpur', 'রংপুর', 'rangpur', 'rangpur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-din', 'Dinajpur', 'দিনাজপুর', 'rangpur', 'dinajpur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-pan', 'Panchagarh', 'পঞ্চগড়', 'rangpur', 'panchagarh', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-tha', 'Thakurgaon', 'ঠাকুরগাঁও', 'rangpur', 'thakurgaon', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-nil', 'Nilphamari', 'নীলফামারী', 'rangpur', 'nilphamari', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-lal', 'Lalmonirhat', 'লালমনিরহাট', 'rangpur', 'lalmonirhat', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-kur', 'Kurigram', 'কুড়িগ্রাম', 'rangpur', 'kurigram', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-gai', 'Gaibandha', 'গাইবান্ধা', 'rangpur', 'gaibandha', 'not_visited', 0, NULL, '', '{}', NULL),

  -- MYMENSINGH DIVISION (4)
  ('bd-mym', 'Mymensingh', 'ময়মনসিংহ', 'mymensingh', 'mymensingh', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-jam', 'Jamalpur', 'জামালপুর', 'mymensingh', 'jamalpur', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-net', 'Netrokona', 'নেত্রকোণা', 'mymensingh', 'netrokona', 'not_visited', 0, NULL, '', '{}', NULL),
  ('bd-she', 'Sherpur', 'শেরপুর', 'mymensingh', 'sherpur', 'not_visited', 0, NULL, '', '{}', NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  bn_name = EXCLUDED.bn_name,
  division = EXCLUDED.division,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  visits_count = EXCLUDED.visits_count,
  rating = EXCLUDED.rating,
  notes = EXCLUDED.notes,
  places = EXCLUDED.places,
  last_visited_at = EXCLUDED.last_visited_at;

-- Seed Initial Trip Memories
INSERT INTO public.os_travel_memories (id, district_code, title, place_name, date, transport, rating, notes, tags)
VALUES
  ('mem-dhk-1', 'bd-dhk', 'Old Dhaka Heritage & Food Walk', 'Lalbagh Fort', '2026-08-14', 'Rickshaw & Walking', 5, 'Explored Lalbagh Fort, Ahsan Manzil, and sampled traditional Kacchi & Beauty Lassi.', ARRAY['Heritage', 'Food', 'Culture']),
  ('mem-dhk-2', 'bd-dhk', 'Tech Meetup & Developer Summit', 'Agargaon', '2026-05-20', 'Metro Rail', 5, 'Attended full-stack engineering conference at Agargaon.', ARRAY['Tech', 'Networking']),
  ('mem-cox-1', 'bd-cox', 'Marine Drive Road Trip & Inani Beach', 'Inani Beach', '2025-12-18', 'Open Jeep', 5, 'Cruised the 80km Marine Drive with hills on left and ocean on right. Sunset at coral beach Inani.', ARRAY['Beach', 'Road Trip', 'Nature']),
  ('mem-ctg-1', 'bd-ctg', 'Patenga Sunset & CRB Shirishtola', 'CRB Shirishtola', '2025-11-04', 'Train (Suborno Express)', 5, 'Walked under century-old rain trees at CRB, followed by fresh spicy sea crab at Patenga.', ARRAY['Nature', 'Sea', 'Train']),
  ('mem-syl-1', 'bd-syl', 'Ratargul Swamp Boat Ride', 'Ratargul', '2025-09-24', 'Wooden Dinghy Boat', 5, 'Navigated narrow submerged forest channels under freshwater evergreen canopy.', ARRAY['Swamp', 'Adventure', 'Nature']),
  ('mem-mou-1', 'bd-mou', 'Sreemangal Tea Trails & Rainforest Trek', 'Lawachara', '2025-09-22', 'Trekking & Train', 5, 'Early morning birdwatching inside Lawachara forest followed by 7-layer tea at Nilkantha.', ARRAY['Tea', 'Rainforest', 'Wildlife']),
  ('mem-gaz-1', 'bd-gaz', 'Bhawal National Park Woodland Walk', 'Bhawal National Park', '2026-02-10', 'Cycling & Car', 4, 'Cycling through quiet Sal forest trails on a cool winter morning.', ARRAY['Forest', 'Cycling', 'Outdoors']),
  ('mem-cum-1', 'bd-cum', 'Shalban Vihara Archaeological Tour', 'Mainamati', '2026-03-12', 'Private Car', 5, 'Explored 8th-century Buddhist monastery excavations, followed by legendary Matri Bhandar Rasmalai.', ARRAY['Architecture', 'History'])
ON CONFLICT (id) DO UPDATE SET
  district_code = EXCLUDED.district_code,
  title = EXCLUDED.title,
  place_name = EXCLUDED.place_name,
  date = EXCLUDED.date,
  transport = EXCLUDED.transport,
  rating = EXCLUDED.rating,
  notes = EXCLUDED.notes,
  tags = EXCLUDED.tags;

