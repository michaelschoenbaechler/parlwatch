# iOS Deployment (TestFlight and App Store)

This project now supports one-command iOS deployment through Fastlane.

## Local deployment

1. Install Ruby dependencies once:
   ```bash
   npm run ios:fastlane:install
   ```
2. Create local env vars file and load it:
   ```bash
   cp .env.example .env
   set -a; source .env; set +a
   ```
3. From repo root, run one of:
   ```bash
   npm run ios:deploy:testflight
   npm run ios:deploy:appstore
   ```

The commands build web assets, sync the Capacitor iOS project, archive the app, and upload to App Store Connect.

## Required environment variables

Set these for both local runs and GitHub Actions:

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY` (base64-encoded `.p8` contents)

Set these for GitHub Actions:

- `IOS_DISTRIBUTION_CERTIFICATE_BASE64` (base64-encoded `.p12`)
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD` (password used when exporting `.p12`)
- `IOS_APPSTORE_PROVISIONING_PROFILE_BASE64` (base64-encoded `.mobileprovision`)
- `IOS_PROVISIONING_PROFILE_NAME` (profile name from Apple Developer)
- `KEYCHAIN_PASSWORD` (any strong password used in CI keychain setup)

Optional:

- `APP_IDENTIFIER` (default: `ch.michaelschoenbaechler.parlwatch`)
- `APPLE_TEAM_ID` (default: `65DUBW68Z2`)
- `IOS_MARKETING_VERSION` (overrides `CFBundleShortVersionString`)
- `IOS_BUILD_NUMBER` (overrides `CFBundleVersion`)

Local note:

- Local deploy expects signing certificate/profile to already be available in your login keychain.

Versioning note:

- In CI, if `IOS_MARKETING_VERSION` is not provided, Fastlane auto-sets `CFBundleShortVersionString` to a date format `YYYY.M.D` (for example `2026.3.3`).
- This avoids App Store Connect rejections when the approved version is already higher than your checked-in version string.

## GitHub Actions deployment

Use the `iOS Deploy` workflow (`.github/workflows/ios-deploy.yml`) and choose:

- `testflight` to upload a build for testers
- `appstore` to upload a build for App Store submission

Add these repository secrets before running the workflow:

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY`
- `IOS_DISTRIBUTION_CERTIFICATE_BASE64`
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`
- `IOS_APPSTORE_PROVISIONING_PROFILE_BASE64`
- `IOS_PROVISIONING_PROFILE_NAME`
- `KEYCHAIN_PASSWORD`

## Prepare values for GitHub secrets

### 1) Create App Store Connect API key

1. Open App Store Connect > Users and Access > Keys > App Store Connect API.
2. Create a key with at least `App Manager` access.
3. Save:
   - `Key ID` -> `APP_STORE_CONNECT_KEY_ID`
   - `Issuer ID` -> `APP_STORE_CONNECT_ISSUER_ID`
4. Download `AuthKey_<KEYID>.p8` (only downloadable once).
5. Convert to base64:
   ```bash
   base64 -i AuthKey_<KEYID>.p8 | tr -d '\n'
   ```
6. Use output as `APP_STORE_CONNECT_API_KEY`.

### 2) Export distribution certificate as .p12

1. On a Mac where the iOS Distribution certificate is installed, open `Keychain Access`.
2. In `My Certificates`, find your `Apple Distribution` certificate with private key.
3. Right-click > Export > save as `.p12`.
4. Set an export password.
5. Convert `.p12` to base64:
   ```bash
   base64 -i distribution.p12 | tr -d '\n'
   ```
6. Use output as `IOS_DISTRIBUTION_CERTIFICATE_BASE64`.
7. Use the export password as `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`.

### 3) Download App Store provisioning profile

1. Open Apple Developer > Certificates, IDs & Profiles > Profiles.
2. Open your App Store profile for bundle id `ch.michaelschoenbaechler.parlwatch`.
3. Download the `.mobileprovision` file.
4. Copy profile name exactly (for `IOS_PROVISIONING_PROFILE_NAME`).
5. Convert profile to base64:
   ```bash
   base64 -i profile.mobileprovision | tr -d '\n'
   ```
6. Use output as `IOS_APPSTORE_PROVISIONING_PROFILE_BASE64`.

### 4) Choose keychain password for CI

1. Generate any strong random value.
2. Save it as `KEYCHAIN_PASSWORD`.

## Add secrets in GitHub

1. Open GitHub repository > `Settings` > `Secrets and variables` > `Actions`.
2. Add these repository secret names exactly:
   - `APP_STORE_CONNECT_KEY_ID`
   - `APP_STORE_CONNECT_ISSUER_ID`
   - `APP_STORE_CONNECT_API_KEY`
   - `IOS_DISTRIBUTION_CERTIFICATE_BASE64`
   - `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`
   - `IOS_APPSTORE_PROVISIONING_PROFILE_BASE64`
   - `IOS_PROVISIONING_PROFILE_NAME`
   - `KEYCHAIN_PASSWORD`
3. Trigger workflow: `Actions` > `iOS Deploy` > `Run workflow`.
4. Select target: `testflight` or `appstore`.
5. Optional: set `marketing_version` if you want a manual short version for that run.
