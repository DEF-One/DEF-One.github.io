-- =====================================================================
-- WG Manager – Datenbankschema (Supabase / PostgreSQL)
-- Einmal komplett im Supabase SQL Editor ausführen.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------

-- Ein Haushalt = eine WG
create table if not exists public.households (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null default 'Unsere WG',
  invite_code          text not null unique default upper(substr(md5(random()::text), 1, 8)),
  timezone             text not null default 'Europe/Berlin',
  plan_start_date      date not null default current_date,
  rotation_weeks       int  not null default 1 check (rotation_weeks between 1 and 8),
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Genau zwei Plätze (A und B) pro Haushalt. user_id ist leer, bis die zweite Person beitritt.
create table if not exists public.household_members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  slot          text not null check (slot in ('A','B')),
  user_id       uuid references auth.users(id) on delete set null,
  display_name  text not null,
  color         text not null default '#3b82f6',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (household_id, slot),
  unique (household_id, user_id)
);

-- Aufgaben inkl. Wiederholungsregel
create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references public.households(id) on delete cascade,
  name               text not null,
  description        text not null default '',
  category           text not null default 'Allgemein',
  frequency          text not null check (frequency in ('once','daily','weekly','monthly')),
  repeat_every       int  not null default 1 check (repeat_every between 1 and 365),
  weekdays           int[] not null default '{}',          -- 0 = Montag … 6 = Sonntag (für weekly)
  day_of_month       int check (day_of_month between 1 and 31), -- für monthly
  start_date         date not null default current_date,
  due_time           text,                                   -- 'HH:MM' oder null = ganztägig
  estimated_minutes  int check (estimated_minutes between 0 and 1440),
  assignment_mode    text not null default 'rotation' check (assignment_mode in ('rotation','fixed','personal')),
  rotation_group     text not null default 'A' check (rotation_group in ('A','B')), -- wer die Aufgabe in Rotationswoche 1 hat
  fixed_slot         text check (fixed_slot in ('A','B')),
  sort_order         int not null default 0,
  archived_at        timestamptz,                            -- „gelöscht“: Historie bleibt erhalten
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists tasks_household_idx on public.tasks(household_id);

-- Erledigungen je Termin (Historie)
create table if not exists public.task_completions (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references public.households(id) on delete cascade,
  task_id            uuid not null references public.tasks(id) on delete cascade,
  occurrence_date    date not null,                       -- ursprünglicher Termin
  scope              text not null default 'shared' check (scope in ('shared','A','B')),
  completed_by_slot  text not null check (completed_by_slot in ('A','B')),
  completed_by_user  uuid references auth.users(id) on delete set null,
  minutes            int,                                 -- Zeitaufwand zum Zeitpunkt der Erledigung
  completed_at       timestamptz not null default now(),
  unique (task_id, occurrence_date, scope)
);
create index if not exists completions_household_idx on public.task_completions(household_id, occurrence_date);

-- Abweichungen je Termin: manuelle Zuweisung und/oder Verschiebung
create table if not exists public.task_assignments (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references public.households(id) on delete cascade,
  task_id            uuid not null references public.tasks(id) on delete cascade,
  occurrence_date    date not null,
  scope              text not null default 'shared' check (scope in ('shared','A','B')),
  assigned_slot      text check (assigned_slot in ('A','B')),
  moved_to           date,
  note               text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (task_id, occurrence_date, scope)
);
create index if not exists assignments_household_idx on public.task_assignments(household_id);

-- Persönliche Einstellungen je Nutzer
create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  household_id           uuid references public.households(id) on delete set null,
  notifications_enabled  boolean not null default false,
  notify_hour            int not null default 8 check (notify_hour between 0 and 23),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at automatisch pflegen
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['households','household_members','tasks','task_assignments','user_settings'] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Hilfsfunktion für RLS
-- ---------------------------------------------------------------------
create or replace function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.tasks             enable row level security;
alter table public.task_completions  enable row level security;
alter table public.task_assignments  enable row level security;
alter table public.user_settings     enable row level security;

drop policy if exists households_select on public.households;
drop policy if exists households_update on public.households;
create policy households_select on public.households for select using (public.is_household_member(id));
create policy households_update on public.households for update using (public.is_household_member(id)) with check (public.is_household_member(id));

drop policy if exists members_select on public.household_members;
drop policy if exists members_update on public.household_members;
create policy members_select on public.household_members for select using (public.is_household_member(household_id));
create policy members_update on public.household_members for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

do $$
declare t text;
begin
  foreach t in array array['tasks','task_completions','task_assignments'] loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select using (public.is_household_member(household_id))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (public.is_household_member(household_id))', t);
    execute format('create policy %1$s_update on public.%1$s for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (public.is_household_member(household_id))', t);
  end loop;
end $$;

drop policy if exists user_settings_own on public.user_settings;
create policy user_settings_own on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- RPCs: WG anlegen und beitreten (laufen mit erhöhten Rechten, prüfen selbst)
-- ---------------------------------------------------------------------
create or replace function public.create_household(
  p_name text, p_my_name text, p_partner_name text, p_start_date date default current_date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'Du bist bereits Mitglied einer WG';
  end if;

  insert into households (name, plan_start_date, created_by)
  values (coalesce(nullif(trim(p_name), ''), 'Unsere WG'), coalesce(p_start_date, current_date), auth.uid())
  returning id into hid;

  insert into household_members (household_id, slot, user_id, display_name, color)
  values (hid, 'A', auth.uid(), coalesce(nullif(trim(p_my_name), ''), 'Person A'), '#3b82f6'),
         (hid, 'B', null,       coalesce(nullif(trim(p_partner_name), ''), 'Person B'), '#10b981');

  insert into user_settings (user_id, household_id) values (auth.uid(), hid)
  on conflict (user_id) do update set household_id = excluded.household_id;

  return hid;
end $$;

create or replace function public.join_household(p_code text, p_display_name text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid; free_slot text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'Du bist bereits Mitglied einer WG';
  end if;

  select id into hid from households where invite_code = upper(trim(p_code));
  if hid is null then raise exception 'Einladungscode nicht gefunden'; end if;

  select slot into free_slot from household_members
   where household_id = hid and user_id is null order by slot limit 1 for update;
  if free_slot is null then raise exception 'Diese WG ist bereits voll (2 Personen)'; end if;

  update household_members
     set user_id = auth.uid(),
         display_name = coalesce(nullif(trim(p_display_name), ''), display_name)
   where household_id = hid and slot = free_slot;

  insert into user_settings (user_id, household_id) values (auth.uid(), hid)
  on conflict (user_id) do update set household_id = excluded.household_id;

  return hid;
end $$;

-- Tabellenrechte für angemeldete Nutzer (Zugriff wird zusätzlich per RLS eingeschränkt)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.households, public.household_members, public.tasks,
  public.task_completions, public.task_assignments, public.user_settings
  to authenticated;

grant execute on function public.create_household(text, text, text, date) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Realtime: Änderungen live an beide Geräte senden
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['households','household_members','tasks','task_completions','task_assignments'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
