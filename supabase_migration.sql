-- ─── Know Better — Supabase migration ───────────────────────────────────────
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. check_ins table
create table if not exists public.check_ins (
  check_in_id           uuid primary key default gen_random_uuid(),
  dog_id                uuid not null references public.dogs(dog_id) on delete cascade,
  family_member_id      uuid not null references public.family_members(member_id) on delete cascade,
  check_in_type         text not null default 'morning',
  audio_file_url        text,
  whisper_raw_text      text,
  check_in_text         text,
  transcription_status  text not null default 'completed',
  contributed_to_baseline text not null default 'yes',
  created_at            timestamptz not null default now()
);

-- 2. responses table
create table if not exists public.responses (
  response_id     uuid primary key default gen_random_uuid(),
  check_in_id     uuid not null references public.check_ins(check_in_id) on delete cascade,
  dog_id          uuid not null references public.dogs(dog_id) on delete cascade,
  response_text   text,
  response_type   text not null default 'reassurance',
  response_status text not null default 'delivered',
  was_alert       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- 3. Enable RLS
alter table public.check_ins enable row level security;
alter table public.responses enable row level security;

-- 4. RLS: check_ins — authenticated user may insert/select for their own dog
create policy "Users can insert their own check_ins"
  on public.check_ins for insert
  with check (
    dog_id in (select dog_id from public.dogs where owner_id = auth.uid())
  );

create policy "Users can select their own check_ins"
  on public.check_ins for select
  using (
    dog_id in (select dog_id from public.dogs where owner_id = auth.uid())
  );

-- 5. RLS: responses — authenticated user may insert/select for their own dog
create policy "Users can insert their own responses"
  on public.responses for insert
  with check (
    dog_id in (select dog_id from public.dogs where owner_id = auth.uid())
  );

create policy "Users can select their own responses"
  on public.responses for select
  using (
    dog_id in (select dog_id from public.dogs where owner_id = auth.uid())
  );

-- 6. Storage bucket
insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', true)
on conflict (id) do nothing;

-- 7. Storage RLS: authenticated users can upload and read from the checkins bucket
create policy "Authenticated users can upload to checkins"
  on storage.objects for insert
  with check (bucket_id = 'checkins' and auth.role() = 'authenticated');

create policy "Authenticated users can read checkins"
  on storage.objects for select
  using (bucket_id = 'checkins' and auth.role() = 'authenticated');
