# Android Deployment (Play Store internal testing and production)

This project supports one-command Android deployment through Fastlane, mirroring the iOS setup described in [ios-deployment.md](ios-deployment.md).

The repository root exposes the deployment commands and forwards them to the Ionic workspace in `apps/ionic`.

## Local deployment

1. Install Ruby dependencies once:
   ```bash
   npm run android:fastlane:install
   ```
2. Create local env vars file and load it:
   ```bash
   cp .env.example .env
   set -a; source .env; set +a
   ```
3. From the repository root, run one of:
   ```bash
   npm run android:deploy:internal
   npm run android:deploy:production
   ```

The commands build the Ionic workspace web assets, sync the Capacitor Android project, build a signed Android App Bundle (`bundleRelease`), and upload it to Google Play.

## Required environment variables

Set these for both local runs and GitHub Actions:

- `ANDROID_KEYSTORE_PASSWORD` (password of the upload keystore)
- `ANDROID_KEY_ALIAS` (alias of the signing key inside the keystore)
- `ANDROID_KEY_PASSWORD` (password of that key)
- `PLAY_STORE_SERVICE_ACCOUNT_JSON` (base64-encoded service account JSON key)

Provide the keystore itself in one of two ways:

- `ANDROID_KEYSTORE_BASE64` (base64-encoded `.keystore`/`.jks`), used by GitHub Actions
- `ANDROID_KEYSTORE_PATH` (absolute path to an existing keystore), convenient locally

Optional:

- `ANDROID_PACKAGE_NAME` (default: `ch.michaelschoenbaechler.parlwatch`)
- `ANDROID_VERSION_NAME` (overrides `versionName`)
- `ANDROID_VERSION_CODE` (overrides `versionCode`)

Local note:

- Nothing is read from the Play Console UI at build time. The keystore and the service account key are the only signing/authentication material needed.
- Neither the keystore nor the decoded service account key is ever committed; both are ignored by `.gitignore`.

Versioning note:

- In CI, if `ANDROID_VERSION_NAME` is not provided, Fastlane auto-sets `versionName` to a date format `YYYY.M.D` (for example `2026.3.3`), matching the iOS marketing version.
- If `ANDROID_VERSION_CODE` is not provided, Fastlane falls back to `GITHUB_RUN_ID`, then `GITHUB_RUN_NUMBER`. Google Play rejects a `versionCode` above `2100000000` and `GITHUB_RUN_ID` is larger than that, so Fastlane automatically falls back to `GITHUB_RUN_NUMBER` in that case. Set `ANDROID_VERSION_CODE` explicitly if you need full control.
- Every upload needs a `versionCode` strictly higher than the one already on the track, otherwise Google Play rejects it.

## Play Store tracks

- `internal` — Internal testing track. Fast review-free distribution to a fixed list of testers, used for day-to-day builds. Uploaded with `release_status: 'completed'`, so testers get the build immediately.
- `production` — Public track. Uploaded with `release_status: 'draft'`, so the build lands in the Play Console without being rolled out. A human has to open the release and confirm the rollout.

## GitHub Actions deployment

Use the `Android Deploy` workflow (`.github/workflows/android-deploy.yml`) and choose:

- `internal` to upload a build for internal testers
- `production` to upload a build as a production draft

Add these repository secrets before running the workflow:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `PLAY_STORE_SERVICE_ACCOUNT_JSON`

## One-time Play Console setup

Google Play only accepts API uploads for an app that already exists and has had at least one bundle uploaded by hand. Before the first CI deploy can succeed:

1. Create the app in the [Play Console](https://play.google.com/console) with package name `ch.michaelschoenbaechler.parlwatch`.
2. Complete the required app content declarations (privacy policy, data safety, content rating, target audience).
3. Build a signed bundle locally (`npm run android:deploy:internal` fails at the upload step until this is done, so use `cd apps/ionic/android && ./gradlew bundleRelease` with the signing env vars set) and upload `app/build/outputs/bundle/release/app-release.aab` manually to the internal testing track.
4. Enroll the app in Play App Signing (offered during that first upload) and keep the upload keystore safe — it is the key CI signs with.
5. Only after that first manual release exists will `supply` accept uploads through the API.

## Prepare values for GitHub secrets

### 1) Create the upload keystore

1. Create a keystore (keep the generated file and passwords in a password manager, they cannot be recovered):
   ```bash
   keytool -genkeypair -v \
     -keystore parlwatch-upload.keystore \
     -alias parlwatch \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Save:
   - keystore password -> `ANDROID_KEYSTORE_PASSWORD`
   - key alias (`parlwatch` above) -> `ANDROID_KEY_ALIAS`
   - key password -> `ANDROID_KEY_PASSWORD`
3. Convert the keystore to base64:
   ```bash
   base64 -i parlwatch-upload.keystore | tr -d '\n'
   ```
4. Use output as `ANDROID_KEYSTORE_BASE64`.

### 2) Create a Google Play service account

1. Open Play Console > `Users and permissions` > `Invite new users`, or use Google Cloud directly.
2. In the Google Cloud project linked to the Play Console, create a service account and a JSON key for it.
3. In Play Console, grant that service account access to the app with at least `Release manager` permissions (needs `Release apps to testing tracks` and `Release to production`).
4. Convert the JSON key to base64:
   ```bash
   base64 -i play-store-service-account.json | tr -d '\n'
   ```
5. Use output as `PLAY_STORE_SERVICE_ACCOUNT_JSON`.

Permission changes in the Play Console can take a few minutes to propagate before `supply` accepts uploads.

## Add secrets in GitHub

1. Open GitHub repository > `Settings` > `Secrets and variables` > `Actions`.
2. Add these repository secret names exactly:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
   - `PLAY_STORE_SERVICE_ACCOUNT_JSON`
3. Trigger workflow: `Actions` > `Android Deploy` > `Run workflow`.
4. Select target: `internal` or `production`.
5. Optional: set `version_name` if you want a manual version name for that run.
