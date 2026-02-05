# Homeschool 4-Year Planner

A web app for planning high-school curriculum units across four years. Assign units to years via drag-and-drop or selection controls, configure optional choices and credits, and view category/hour breakdowns.

Primarily aimed at homeschooling families that use the Gather 'Round curriculum.

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Plain CSS (no framework) |
| **Drag and drop** | [@dnd-kit](https://dndkit.com/) (core, sortable, utilities) |
| **Backend / data** | [Supabase](https://supabase.com/) (Postgres, PostgREST, auth) |
| **Scripts / data prep** | Python 3 (CSV/JSON parsing, seed SQL generation) |

- **Build:** `npm run build` in `app/`
- **Dev server:** `npm run dev` in `app/` (Vite)
- **Env:** Copy `app/.env.example` to `app/.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## High-level overview

- **Curriculum data** lives in Supabase: unit–category–subcategory hours, option groups (e.g. “Required Reading” per unit), optional items (labs, add-ons), and recommended books. The app loads this via the `useCurriculum` hook and computes per-unit hours from choices and overrides.
- **Planning surface:** A sidebar lists unassigned units; four year columns (1–4) are drop targets. Users drag units from the pool into a year (or back to unassigned). Years can be locked to avoid accidental changes.
- **Selection mode:** In the unassigned pool, an edit/list control turns on selection. Multiple units can be checked and then assigned together by dragging one of them to a year, or by using “Assign to year:” (Y1–Y4) or “Assign here” on a year header.
- **Optional choices:** Many units have option groups (e.g. pick one required-reading set). The app lets users set choices and optional inclusions; hours and breakdowns update accordingly. Units with missing choices are flagged.
- **Persistence:** Year assignments, locked years, option choices, optional inclusions, and config (hours-per-credit, min credits for graduation) are stored in the browser (e.g. `localStorage`) so plans are device-local unless you add sync later.
- **Auth:** Supabase Auth is wired for sign-in/sign-up (e.g. for future per-user plans or sync); the UI shows AuthUI in the header.
- **Data pipeline:** The `data/` and `scripts/` trees hold source curriculum (e.g. Gather Round CSVs/JSON) and Python scripts that parse them and generate Supabase seed SQL under `supabase/migrations/`.

## Repository layout

- **`app/`** — Vite + React app (components, hooks, Supabase client, types).
- **`supabase/`** — Config and migrations (tables, RLS, seeds for curriculum and options).
- **`data/`** — Source curriculum files (CSV, JSON) used by scripts.
- **`scripts/`** — Python one-offs and generators (parse curriculum, split option types, generate seed SQL).
