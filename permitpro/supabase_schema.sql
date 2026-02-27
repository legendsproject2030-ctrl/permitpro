-- Run this in your Supabase SQL editor

-- Permit sessions table
create table permit_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  permit_name text not null,
  municipality text,
  original_pdf_url text,
  pdf_co_url text,
  completed_pdf_url text,
  file_name text,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  current_step integer default 1,
  total_steps integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Permit fields table
create table permit_fields (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references permit_sessions(id) on delete cascade not null,
  field_name text not null,
  question text not null,
  helper text,
  input_type text default 'text' check (input_type in ('text', 'date', 'number', 'dropdown')),
  dropdown_options text default '[]',
  step_number integer not null,
  answer text,
  x_position float default 0,
  y_position float default 0,
  page_number integer default 1,
  created_at timestamptz default now()
);

-- Row Level Security
alter table permit_sessions enable row level security;
alter table permit_fields enable row level security;

-- Policies for permit_sessions
create policy "Users can view own sessions"
  on permit_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on permit_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on permit_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on permit_sessions for delete
  using (auth.uid() = user_id);

-- Policies for permit_fields (via session ownership)
create policy "Users can view own fields"
  on permit_fields for select
  using (
    exists (
      select 1 from permit_sessions
      where permit_sessions.id = permit_fields.session_id
      and permit_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own fields"
  on permit_fields for insert
  with check (
    exists (
      select 1 from permit_sessions
      where permit_sessions.id = permit_fields.session_id
      and permit_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update own fields"
  on permit_fields for update
  using (
    exists (
      select 1 from permit_sessions
      where permit_sessions.id = permit_fields.session_id
      and permit_sessions.user_id = auth.uid()
    )
  );

-- Storage bucket for permit PDFs
insert into storage.buckets (id, name, public) values ('permits', 'permits', true);

create policy "Users can upload own permits"
  on storage.objects for insert
  with check (bucket_id = 'permits' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own permits"
  on storage.objects for select
  using (bucket_id = 'permits' and auth.uid()::text = (storage.foldername(name))[1]);
