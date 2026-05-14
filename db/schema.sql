create table if not exists words (
  word text primary key,
  word_lower text not null unique,
  length smallint not null,
  first_letter char(1) not null,
  last_letter char(1) not null,
  sorted_key text not null,
  is_common boolean not null default false,
  source text not null default 'imported',
  created_at timestamptz not null default now()
);

create index if not exists words_length_idx on words(length);
create index if not exists words_first_letter_idx on words(first_letter);
create index if not exists words_last_letter_idx on words(last_letter);
create index if not exists words_common_idx on words(is_common);
create index if not exists words_sorted_key_idx on words(sorted_key);

create table if not exists dictionary_cache (
  word_lower text primary key,
  word text not null,
  phonetic text,
  primary_part_of_speech text,
  primary_definition text,
  primary_example text,
  meanings jsonb not null default '[]'::jsonb,
  synonyms jsonb not null default '[]'::jsonb,
  antonyms jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists dictionary_cache_updated_idx on dictionary_cache(updated_at);

create table if not exists wotd_words (
  day_slot smallint primary key,
  word text not null,
  word_lower text not null unique,
  active boolean not null default true,
  source text not null default 'seed',
  updated_at timestamptz not null default now()
);

create index if not exists wotd_words_active_idx on wotd_words(active);
