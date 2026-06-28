# Public content sources for Amsterdam planner

## Event and calendar sources
- I amsterdam events calendar: https://www.iamsterdam.com/en/whats-on/calendar
- Amsterdam Festival Guide: https://www.amsterdam.info/events/
- Amsterdam Tourism events: https://www.iamsterdam.com/en/whats-on
- Amsterdam city calendar / events pages from the municipality or local culture portals
- Eventbrite Amsterdam: https://www.eventbrite.com/d/netherlands--amsterdam/events/
- Meetup Amsterdam events: https://www.meetup.com/find/?location=amsterdam
- Time Out Amsterdam events: https://www.timeout.com/amsterdam/things-to-do
- EventConnectors: https://eventconnectors.nl/en/event-connectors/ (useful as an aggregator or event platform connector; may be more commercial than open data)
- data.amsterdam.nl: local open data portal for Amsterdam; great for venue, events, markets, and permit-based datasets
- data.overheid.nl: Dutch government open data portal; useful for municipal event datasets and official culture/permit feeds

## Open data sources
- data.amsterdam.nl: primary Amsterdam open-data portal with datasets for local events, markets, cultural venues, and city services
- data.overheid.nl: national open-data hub that can supply official event and permit data for Amsterdam and regional programming
- Note: these open-data portals are especially useful for building a stable content layer, but they may require additional normalization and filtering compared to page scraping.

## Market sources
- I amsterdam markets and local food pages
- Amsterdam markets listings from local tourism / city guides
- Amsterdam weekly market directories from local neighborhood pages

## Route and walking-tour sources
- I amsterdam walking and cycling routes: https://www.iamsterdam.com/en/see-and-do/nature-and-active/walking-and-cycling-routes
- I amsterdam public art walking route: https://www.iamsterdam.com/en/see-and-do/nature-and-active/walking-and-cycling-routes/public-art-walking-route
- Amsterdam bike route guides from tourism portals
- Local city cycling maps and route pages

## Data collection approach
- For events: search the sources for the selected month and normalize the items into the planner format.
- For routes: load a curated static list from these sources once and keep them in local JSON until refreshed.
- For future expansion: a small backend or serverless function can fetch and normalize these pages automatically.
