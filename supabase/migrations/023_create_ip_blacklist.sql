-- IP blacklist table for automated abuse prevention
create table if not exists public.ip_blacklist (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null unique,
  violation_count integer not null default 0,
  banned_at timestamptz,
  ban_expires_at timestamptz,
  reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Fast lookup for currently-banned IPs
create index if not exists idx_ip_blacklist_banned
  on public.ip_blacklist (ip_address)
  where banned_at is not null;

-- Enable RLS with no user policies (admin-client-only access)
alter table public.ip_blacklist enable row level security;
