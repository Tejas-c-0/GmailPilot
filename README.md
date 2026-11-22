# EmailPilot

EmailPilot is a local-first, browser-based email management agent created as a B.Tech CSE mini project at Dayananda Sagar University.

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown by Vite.

## Production build

```bash
npm run build
npm run preview
```

The static result is in `dist/`. Run the agent test with `npm test`.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. Import the repository at `vercel.com/new`.
3. Use framework preset **Vite**, build command `npm run build`, and output directory `dist`.
4. Deploy. Redeployment is automatic for future pushes.

## Deploy to Netlify

1. Push this project to a GitHub repository.
2. Add a new site in Netlify from Git.
3. Set build command to `npm run build` and publish directory to `dist`.
4. Deploy. Alternative manual upload: run `npm run build`, then drag `dist/` to the Netlify dashboard.

## Deploy to GitHub Pages

1. Set repository name and update `GITHUB_PAGES=true` in the build workflow or build locally.
2. Set repository Pages source to **GitHub Actions**.
3. Add `.github/workflows/deploy.yml` from the Vite Pages template.
4. Push to `main`. GitHub builds and publishes `dist/`.

`vite.config.js` uses `/emailpilot/` as the GitHub Pages base when `GITHUB_PAGES=true`.

## Optional LLM

In the live demo, choose `LLMBrain` and paste a key. The key is held only in React component memory for that page session. It is not written to localStorage, a server, or the browser console. If the provider is unavailable or rejects a request, the demo continues with `RuleBrain`.

## Project structure

- `src/App.jsx` assembles the report and demo page.
- `src/components/HeroVisual.jsx` renders a lazy-loaded, reduced-motion-aware Three.js visual.
- `src/agent/brain.js` classifies emails and provides RuleBrain and LLMBrain.
- `src/agent/scoring.js` calculates the priority score.
- `src/agent/tools.js` contains summaries, tasks, replies, scheduling and search.
- `src/agent/sampleInbox.js` contains the 12 fictional emails.
- `src/agent/tests.js` verifies the labels and tools.
- `emailpilot.py` is the readable matching Python implementation.
