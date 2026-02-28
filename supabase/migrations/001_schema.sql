-- profiles: extend auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  grade text,
  exam_target text,
  total_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- study_sessions
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  hours numeric not null,
  passed_quiz boolean not null default false,
  created_at timestamptz not null default now()
);

-- session_questions
create table if not exists public.session_questions (
  id uuid primary key default gen_random_uuid(),
  study_session_id uuid not null references public.study_sessions(id) on delete cascade,
  question_text text not null,
  user_answer text,
  is_correct boolean,
  order_index integer not null
);

-- exam_analyses (enum: tekrar çalıştırmada hata vermemesi için)
do $$ begin
  create type exam_type_enum as enum ('tyt', 'ayt', 'middle_school');
exception
  when duplicate_object then null;
end $$;
create table if not exists public.exam_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_type exam_type_enum not null,
  input_data jsonb,
  analysis_text text not null,
  created_at timestamptz not null default now()
);

-- exam_predictions
create table if not exists public.exam_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade text,
  curriculum_input text,
  prediction_text text not null,
  created_at timestamptz not null default now()
);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.exam_analyses enable row level security;
alter table public.exam_predictions enable row level security;
alter table public.chat_messages enable row level security;

-- policies (drop if exists ile tekrar çalıştırılabilir)
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "study_sessions_select_own" on public.study_sessions;
drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions for select using (auth.uid() = user_id);
create policy "study_sessions_insert_own" on public.study_sessions for insert with check (auth.uid() = user_id);

drop policy if exists "session_questions_select_own" on public.session_questions;
drop policy if exists "session_questions_insert_own" on public.session_questions;
create policy "session_questions_select_own" on public.session_questions for select
  using (exists (select 1 from public.study_sessions s where s.id = study_session_id and s.user_id = auth.uid()));
create policy "session_questions_insert_own" on public.session_questions for insert
  with check (exists (select 1 from public.study_sessions s where s.id = study_session_id and s.user_id = auth.uid()));

drop policy if exists "exam_analyses_select_own" on public.exam_analyses;
drop policy if exists "exam_analyses_insert_own" on public.exam_analyses;
create policy "exam_analyses_select_own" on public.exam_analyses for select using (auth.uid() = user_id);
create policy "exam_analyses_insert_own" on public.exam_analyses for insert with check (auth.uid() = user_id);

drop policy if exists "exam_predictions_select_own" on public.exam_predictions;
drop policy if exists "exam_predictions_insert_own" on public.exam_predictions;
create policy "exam_predictions_select_own" on public.exam_predictions for select using (auth.uid() = user_id);
create policy "exam_predictions_insert_own" on public.exam_predictions for insert with check (auth.uid() = user_id);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages for select using (auth.uid() = user_id);
create policy "chat_messages_insert_own" on public.chat_messages for insert with check (auth.uid() = user_id);

-- trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, updated_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- increment points (for leaderboard); only own user
create or replace function public.increment_user_points(p_user_id uuid, p_points integer)
returns void as $$
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Can only increment own points';
  end if;
  update public.profiles
  set total_points = total_points + p_points, updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- allow authenticated users to call increment (only for self can be enforced in app by passing auth.uid())
grant execute on function public.increment_user_points(uuid, integer) to authenticated;
grant execute on function public.increment_user_points(uuid, integer) to service_role;
