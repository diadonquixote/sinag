-- Sinag database schema. Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists users (
  id serial primary key,
  name text not null,
  email text not null,
  password_hash text not null,
  role text not null check (role in ('chairperson','secretary','treasurer','kagawad','kabataan')),
  barangay text,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_idx on users (lower(email));

-- Profile details. Added after launch, so they are ALTERs that are safe to re-run.
alter table users add column if not exists bio text;                 -- short "about me", shown on profile
alter table users add column if not exists purok text;               -- purok or sitio
alter table users add column if not exists phone text;               -- private: only SK officials can see it
alter table users add column if not exists skills text;              -- what they can help with, comma separated
alter table users add column if not exists committee text;           -- officials only, e.g. "Committee on Education"
alter table users add column if not exists avatar bytea;             -- small square JPEG, resized in the browser
alter table users add column if not exists avatar_type text;
alter table users add column if not exists avatar_updated_at timestamptz;

create table if not exists settings (
  key text primary key,
  value text not null
);

-- Youth project ideas
create table if not exists ideas (
  id serial primary key,
  author_id int not null references users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  est_budget numeric(12,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','approved','polling','selected','proposed','rejected')),
  review_note text,
  created_at timestamptz not null default now()
);
create index if not exists ideas_status_idx on ideas (status);

-- Polls: kabataan spread a fixed number of votes across candidate ideas
create table if not exists polls (
  id serial primary key,
  title text not null,
  closes_at timestamptz not null,
  status text not null default 'open' check (status in ('open','closed')),
  max_votes int not null default 3 check (max_votes between 1 and 20),
  created_at timestamptz not null default now()
);

create table if not exists poll_ideas (
  poll_id int not null references polls(id) on delete cascade,
  idea_id int not null references ideas(id) on delete cascade,
  primary key (poll_id, idea_id)
);

create table if not exists votes (
  poll_id int not null references polls(id) on delete cascade,
  idea_id int not null references ideas(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, idea_id, user_id)
);
create index if not exists votes_user_idx on votes (user_id);

-- Projects / events (proposal -> approved -> scheduled -> ongoing -> completed)
create table if not exists projects (
  id serial primary key,
  idea_id int references ideas(id) on delete set null,
  title text not null,
  description text not null,
  category text not null,
  budget numeric(12,2) not null default 0,
  status text not null default 'proposed'
    check (status in ('proposed','approved','scheduled','ongoing','completed','cancelled')),
  proposal jsonb,
  lead_id int references users(id) on delete set null,
  location text,
  start_date date,
  end_date date,
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists projects_status_idx on projects (status);
create index if not exists projects_start_idx on projects (start_date);

create table if not exists project_updates (
  id serial primary key,
  project_id int not null references projects(id) on delete cascade,
  author_id int references users(id) on delete set null,
  body text not null,
  progress int,
  created_at timestamptz not null default now()
);
create index if not exists project_updates_project_idx on project_updates (project_id, created_at desc);

create table if not exists project_volunteers (
  project_id int not null references projects(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Secretary's minutes: draft -> pending (submitted) -> published (approved by chairperson)
create table if not exists minutes (
  id serial primary key,
  title text not null,
  session_date date not null,
  raw_notes text not null,
  content text not null,
  data jsonb,
  status text not null default 'draft' check (status in ('draft','pending','published')),
  author_id int not null references users(id),
  published_by int references users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists minutes_status_idx on minutes (status, published_at desc);

-- Treasurer's ledger. Entries are never deleted: a mistake is voided (kept, struck through, with a reason).
create table if not exists transactions (
  id serial primary key,
  project_id int references projects(id) on delete set null,
  kind text not null check (kind in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  category text,
  tx_date date not null default current_date,
  reference text,
  created_by int references users(id) on delete set null,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_date_idx on transactions (tx_date desc);
create index if not exists transactions_project_idx on transactions (project_id);

create table if not exists reports (
  id serial primary key,
  title text not null,
  period text not null,
  content text not null,
  data jsonb,
  status text not null default 'draft' check (status in ('draft','pending','published')),
  author_id int not null references users(id),
  published_by int references users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on reports (status, published_at desc);

-- Who did what, and when
create table if not exists audit_log (
  id serial primary key,
  user_id int references users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id int,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);
