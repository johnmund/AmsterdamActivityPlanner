# Amsterdam July Planner

A lightweight planner for July 2026 activities in Amsterdam, with a calendar, filters, map links, walking routes, and shareable activity details.

## Run locally

Open the app locally from the app directory with a simple static server:

```bash
python3 -m http.server 4173 --directory .
```

Then open http://127.0.0.1:4173/.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repository settings, enable GitHub Pages.
3. Choose the GitHub Actions deployment source.
4. The workflow in .github/workflows/deploy.yml will build and publish the app.
