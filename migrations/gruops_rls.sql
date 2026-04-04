-- 1. CLEANUP: Remove everything from previous attempts
-- First, drop the constraint that prevents dropping the 'groups' table
ALTER TABLE IF EXISTS public.webrtc_rooms DROP CONSTRAINT IF EXISTS webrtc_rooms_group_id_fkey;

DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Any authenticated user can create a group" ON public.groups;
DROP POLICY IF EXISTS "Allow group creation" ON public.groups;
DROP POLICY IF EXISTS "Allow group management" ON public.groups;
DROP POLICY IF EXISTS "see_groups" ON public.groups;
DROP POLICY IF EXISTS "create_groups" ON public.groups;
DROP POLICY IF EXISTS "manage_groups" ON public.groups;

DROP POLICY IF EXISTS "Members can view peers" ON public.group_members;
DROP POLICY IF EXISTS "Users can join/leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Members can view their group peers" ON public.group_members;
DROP POLICY IF EXISTS "Allow adding members" ON public.group_members;
DROP POLICY IF EXISTS "Manage memberships" ON public.group_members;
DROP POLICY IF EXISTS "see_members" ON public.group_members;
DROP POLICY IF EXISTS "add_members" ON public.group_members;
DROP POLICY IF EXISTS "remove_members" ON public.group_members;

DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP FUNCTION IF EXISTS public.check_group_membership(uuid);

-- 2. CREATE: Groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. CREATE: Group Members table
CREATE TABLE public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

-- 4. UPDATE: Webrtc Rooms
ALTER TABLE public.webrtc_rooms 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 5. FUNCTION: Membership Checker (Security Definer avoids recursion)
CREATE OR REPLACE FUNCTION public.check_group_membership(target_group_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = target_group_id
    AND group_members.user_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS: Enable security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 7. POLICIES: Groups
CREATE POLICY "see_groups" ON public.groups FOR SELECT USING (check_group_membership(id));
CREATE POLICY "create_groups" ON public.groups FOR INSERT WITH CHECK (auth.uid()::text = created_by);
CREATE POLICY "manage_groups" ON public.groups FOR ALL USING (auth.uid()::text = created_by);

-- 8. POLICIES: Group Members
CREATE POLICY "see_members" ON public.group_members FOR SELECT USING (check_group_membership(group_id));

-- This allows creators to add others, AND anyone to add themselves.
CREATE POLICY "add_members" ON public.group_members FOR INSERT WITH CHECK (
    auth.uid()::text = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_members.group_id AND created_by = auth.uid()::text)
);

-- Allow admins to remove members or users to leave
CREATE POLICY "remove_members" ON public.group_members FOR DELETE USING (
    auth.uid()::text = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_members.group_id AND created_by = auth.uid()::text)
);
