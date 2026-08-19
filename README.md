# ParlWatch

ParlWatch is an open-source project that makes Swiss parliamentary data easier to browse across client platforms.

## Monorepo layout

This repository uses `npm` workspaces so additional apps can be added without reshaping the repo again later.

- `apps/ionic`: the Ionic + Angular + Capacitor application
- `docs`: shared project documentation

## Getting started

### Prerequisites

- Node.js
- npm

### Run the Ionic app

1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
2. Start the Ionic workspace through the root script:
   ```bash
   npm run start
   ```

The root scripts forward to `apps/ionic`, so the whole developer workflow stays available from the repo root.

## Common commands

- `npm run start`
- `npm run build`
- `npm run build:prd`
- `npm run lint`
- `npm run test:ci`
- `npm run ios:prepare`
- `npm run ios:deploy:testflight`

## iOS deployment

Automated iOS deployments (TestFlight/App Store) are available via Fastlane and GitHub Actions.

- Setup and usage guide: [docs/ios-deployment.md](docs/ios-deployment.md)
- Local commands:
  - `cp .env.example .env` and load env vars before deploy
  - `npm run ios:fastlane:install`
  - `npm run ios:deploy:testflight`
  - `npm run ios:deploy:appstore`

## API

The parliamentary data comes from the Swiss government's public API. ParlWatch does not operate or manage that API.
