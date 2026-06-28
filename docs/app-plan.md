# Amsterdam July planner app plan

## Recommendation
Use a React + TypeScript + Vite frontend with a simple local JSON data layer for the first version. This is the best fit for:
- month / week / day calendar views
- map-driven activity selection
- category filters
- a polished, interactive experience without a lot of setup

## Core experience
The app should let a user:
- browse July 2026 by month, week, or day
- see activities, markets, concerts, routes, restaurants, breweries, and other city plans
- click an event and see its location on an interactive map
- get bike and metro directions to that activity
- filter by category such as markets, concerts, routes, breweries, restaurants, and outdoor events

## Suggested stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Calendar: FullCalendar
- Map: Leaflet with react-leaflet or MapLibre GL JS
- Routing: OpenStreetMap-based directions, with a fallback to external links for transit
- Data: local JSON or a small SQLite / Supabase layer later
- Optional backend: none for MVP; add FastAPI later if we want richer data import or user accounts

## Data model
Each activity should have fields such as:
- id
- title
- startDate / endDate
- category
- subcategory
- locationName
- address
- lat / lng
- description
- notes
- costHint
- bestFor
- source

Recommended categories:
- market
- concert
- event
- route
- restaurant
- brewery
- outdoor
- culture
- nightlife

## UI structure
1. Header
   - month / week / day toggle
   - search box
   - filter chips

2. Main layout
   - left: calendar view
   - right: map view
   - bottom or side panel: selected activity details

3. Filters
   - activity type: markets, concerts, routes, breweries, restaurants, etc.
   - daypart: morning / afternoon / evening
   - transport: bike / metro / walk
   - weather-friendly or outdoor-only

## Interaction model
- Clicking a calendar event highlights it on the map
- Clicking a map marker opens the event details panel
- The details panel should include:
  - title
  - time
  - location
  - short description
  - category tags
  - a “bike directions” button
  - a “metro directions” button

## Directions approach
For the first version, use a practical approach:
- Bike directions: show an in-app route from home or the current selected start point to the location
- Metro directions: open a Citymapper / Google Maps / OpenTripPlanner-based link with the destination prefilled

If we want true in-app transit routing later, we can add OpenTripPlanner with GTFS data.

## Phased build plan
### Phase 1 — MVP
- create the React app shell
- add a July calendar with month / week / day views
- add a map with markers for activities
- load data from a JSON file
- support clicking an activity to see details and location
- add category filters

### Phase 2 — Better planning
- add route planning and direction buttons
- add a “best day” recommendation per activity
- add weather and backup suggestions
- make the calendar and map stay in sync more smoothly

### Phase 3 — Richer experience
- add restaurant and brewery-specific detail cards
- add saved favorites and personal itinerary planning
- support editing activities through a simple admin view
- connect to live event data or APIs

## Suggested folder structure
- src/
  - components/
  - data/
  - pages/
  - types/
  - utils/
  - styles/

## First implementation steps
1. scaffold the React app
2. add FullCalendar with July 2026 data
3. add Leaflet map and sample markers
4. create the filter sidebar
5. wire event selection between the calendar and the map
6. add direction actions and details panel

## Recommendation on scope
Start with a clean MVP that works well for this July plan. Do not overbuild routing or a backend on day one. The calendar + map + filters + selection flow are the core value.
