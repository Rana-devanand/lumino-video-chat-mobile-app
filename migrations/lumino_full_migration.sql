-- Lumino Full Database Schema & Functions
-- This file consolidates all migrations for profiles, presence, signaling, and contacts.
-- Use this to set up a fresh Supabase project for the Lumino app.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Cleanup (Optional: Drop existing tables to start fresh)
DROP TABLE IF EXISTS public.webrtc_ice_candidates CASCADE;
DROP TABLE IF EXISTS public.webrtc_rooms CASCADE;
DROP TABLE IF EXISTS public.user_presence CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create Tables

-- Profiles Table (Stores user data linked to Firebase UIDs)
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY, -- Firebase UID
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Presence Table (Tracks online/offline status)
CREATE TABLE public.user_presence (
    id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts Table (Bidirectional relationships for chat/calling)
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_id)
);

-- WebRTC Signaling: Rooms
CREATE TABLE public.webrtc_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id TEXT NOT NULL REFERENCES public.profiles(id),
    guest_id TEXT REFERENCES public.profiles(id),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'connecting', 'active', 'ended')),
    offer JSONB,
    answer JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WebRTC Signaling: ICE Candidates
CREATE TABLE public.webrtc_ice_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.webrtc_rooms(id) ON DELETE CASCADE,
    candidate JSONB NOT NULL,
    type TEXT CHECK (type IN ('caller_candidate', 'callee_candidate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_ice_candidates ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies (Development Mode)
-- NOTE: In production, tighten these for security.

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);

-- Presence
CREATE POLICY "Anyone can view user presence" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "Anyone can update presence" ON public.user_presence FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert presence" ON public.user_presence FOR INSERT WITH CHECK (true);

-- Contacts
CREATE POLICY "Anyone can view contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);

-- WebRTC Rooms
CREATE POLICY "Anyone can create WebRTC rooms" ON public.webrtc_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update WebRTC rooms" ON public.webrtc_rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can view WebRTC rooms" ON public.webrtc_rooms FOR SELECT USING (true);

-- WebRTC ICE Candidates
CREATE POLICY "Anyone can insert ICE candidates" ON public.webrtc_ice_candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view ICE candidates" ON public.webrtc_ice_candidates FOR SELECT USING (true);

-- 6. RPC Functions

-- function: sync_user_profile
-- Atomically sync Firebase User data to Supabase and handle referrals.
CREATE OR REPLACE FUNCTION sync_user_profile(
    user_id TEXT, 
    user_phone TEXT, 
    user_name TEXT DEFAULT NULL,
    referrer_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_name TEXT;
BEGIN
    final_name := COALESCE(user_name, 'User ' || right(user_phone, 4));

    -- Upsert into profiles
    INSERT INTO public.profiles (id, phone_number, full_name, created_at)
    VALUES (user_id, user_phone, final_name, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET phone_number = EXCLUDED.phone_number,
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

    -- Upsert into user_presence
    INSERT INTO public.user_presence (id, is_online, last_seen)
    VALUES (user_id, true, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET is_online = true,
        last_seen = NOW();

    -- Handle Referral / Auto-Sync
    IF referrer_id IS NOT NULL AND referrer_id != user_id THEN
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = referrer_id) THEN
            -- Create mutual contacts
            INSERT INTO public.contacts (user_id, contact_id) VALUES (user_id, referrer_id) ON CONFLICT DO NOTHING;
            INSERT INTO public.contacts (user_id, contact_id) VALUES (referrer_id, user_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN json_build_object(
        'status', 'success',
        'id', user_id,
        'full_name', final_name,
        'referred_by', referrer_id
    );
END;
$$;

-- function: get_registered_contacts
CREATE OR REPLACE FUNCTION get_registered_contacts(phone_numbers TEXT[])
RETURNS TABLE (
  id TEXT,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.phone_number, p.avatar_url
  FROM public.profiles p
  WHERE p.phone_number = ANY(phone_numbers);
END;
$$;

-- 7. Realtime Setup
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_ice_candidates;
