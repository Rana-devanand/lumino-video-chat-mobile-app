-- Migration: 05 Invitations and Contacts
-- Purpose: Support personal invitation links and bidirectional auto-syncing of contacts.

-- 1. Create Contacts Table
-- Stores bidirectional relationships between users.
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Basic Development Policies
CREATE POLICY "Users can view their own contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);

-- 2. Update sync_user_profile function
-- This updated version accepts an optional referrer_id.
-- If provided, it creates a mutual contact record between the new user and the referrer.

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

    -- 1. Upsert into profiles
    INSERT INTO public.profiles (id, phone_number, full_name, created_at)
    VALUES (user_id, user_phone, final_name, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET phone_number = EXCLUDED.phone_number,
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

    -- 2. Upsert into user_presence
    INSERT INTO public.user_presence (id, is_online, last_seen)
    VALUES (user_id, true, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET is_online = true,
        last_seen = NOW();

    -- 3. Handle Referral / Auto-Sync
    -- If a referrer_id is provided and it's not the user themselves, create mutual contacts.
    IF referrer_id IS NOT NULL AND referrer_id != user_id THEN
        -- Check if referrer actually exists in profiles
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = referrer_id) THEN
            -- Create A -> B
            INSERT INTO public.contacts (user_id, contact_id)
            VALUES (user_id, referrer_id)
            ON CONFLICT DO NOTHING;
            
            -- Create B -> A (Mutual)
            INSERT INTO public.contacts (user_id, contact_id)
            VALUES (referrer_id, user_id)
            ON CONFLICT DO NOTHING;
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
