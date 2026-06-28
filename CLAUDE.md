# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Amsterdam activity planner for a July 2026 trip. Two parts: planning docs (routes, itinerary) and a vanilla JS web app that shows activities on a calendar with map integration.

## Running the App

```bash
cd app && python3 -m http.server 4173
```

Open http://localhost:4173. There is no build step, bundler, or test suite — it's plain ES modules served as static files.

## Deployment

GitHub Pages deploys the `app/` directory on push to `main` via `.github/workflows/static.yml`. No build step in CI either.

## Architecture

The app is a single-page vanilla JS application with no framework or dependencies:

- **`app/index.html`** — Shell page, loads `src/main.js` as an ES module
- **`app/src/main.js`** — Entry point, mounts the app into `#app`
- **`app/src/app.js`** — Main application: layout, state management, rendering, filter/category logic, recurring activity expansion
- **`app/src/calendar.js`** — Calendar grid renderer (month/week/day views)
- **`app/src/map.js`** — Map panel using OpenStreetMap embeds (no API key needed)
- **`app/src/dataLoader.js`** — Merges static activity data with live content fetched via Jina proxy (`r.jina.ai`)
- **`app/src/contentSources.js`** — Display-only list of public content sources shown in the UI
- **`app/data/activities.js`** — Seeded activity data (all activities with coordinates, categories, and optional recurrence)

All styling is inline — there are no CSS files. The UI is a two-column layout: left panel has calendar + activity list, right panel has filters + details + map.

## Key Concepts

**Categories** split into two groups that affect UI behavior:
- Calendar categories (`market`, `concert`, `event`) — shown on the calendar grid
- Non-calendar categories (`route`, `walking-tour`, `brewery`, `restaurant`, `sandwich`, `coffeeshop`) — listed without calendar placement

**Recurring activities** use `repeatDaysOfWeek` (array of JS day numbers 0-6) and get expanded into per-day instances at render time.

**Live content** is fetched from public event/route URLs through the Jina reader proxy and merged alongside seeded data. These fetches may fail silently.

## Content Guidelines (from AGENTS.md)

- Scope is Amsterdam city activities and walks; major museums are out of scope
- Prefer local/accessible suggestions over tourist-heavy ones
- Do not invent coordinates, event details, or opening hours unless documented or marked as TODO
- `PROJECT_NOTES.md` is the authoritative planning reference
- Planning files go in: `routes/` for routes, `itinerary/` for day-by-day plans
