### Kudos to [Nikola Genov](https://www.instagram.com/nik0la_02/)

# 🐍 Snake Game

Retro arcade Snake game built with plain HTML, CSS and JavaScript (ES modules).

## Project structure

```
.
├── .github/workflows/deploy.yml   # Manual deploy to GitHub Pages + release
├── scripts/
│   ├── serve.js                   # Local dev server (no dependencies)
│   └── build.js                   # Copies src/ -> dist/
├── src/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── game.js                # Game logic, rendering, input
│       └── sound.js               # Web Audio sound effects
└── package.json
```

## Run locally

Requires Node.js 18+.

```bash
npm start
```

Then open <http://localhost:3000> (use `PORT=8080 npm start` for another port).

## Deploy

1. Push the project to GitHub.
2. In the repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Go to **Actions → "Deploy to GitHub Pages & Release" → Run workflow** and enter:
   - **version** – e.g. `1.0.0` (a `v` prefix is optional)
   - **draft** – whether the GitHub release should be marked as a draft

The workflow builds the site, deploys it to GitHub Pages and creates a release
(tag `v<version>`) with a zip of the built game attached.
