# Database setup

WordFindLab can run as a static site, but the backend is now ready to use a real PostgreSQL database through Supabase.

## Tables

Run [`schema.sql`](./schema.sql) to create:

- `words` for the word corpus
- `dictionary_cache` for cached dictionary lookups
- `wotd_words` for Word of the Day rotation

## Environment variables

Set these in Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORD_INDEX_SOURCE`  
  - Default is `db`, which tries the database first and falls back to the public word sources if the table is not populated yet
  - Set it to `proxy` only if you want to bypass the database temporarily

## How the site behaves now

- Dictionary lookups first check `dictionary_cache`, then fall back to the free Dictionary API.
- Word of the Day first checks `wotd_words`, then falls back to the built-in list.
- Word list loading uses the new API endpoints first, then falls back to the current public text files until the database corpus is ready.

## What still needs provisioning

To make the database the canonical source for the big word corpus, import your word list into `words`, then switch `WORD_INDEX_SOURCE` to `db`.

That lets the site keep working during the transition and avoids a hard cutover.
