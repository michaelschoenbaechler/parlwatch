# Push for a Capacitor iOS app without user accounts

Research for #46. Researched 2026-10-09 against the app as it is on
`main`: Capacitor 8.5 (`@capacitor/core`, `@capacitor/ios`),
Angular 21, Ionic 8, iOS deployment target 16.0, bundle ID
`ch.michaelschoenbaechler.parlwatch`, team `65DUBW68Z2`. The iOS project has no
push entitlement, no background modes and no `BGTaskSchedulerPermittedIdentifiers` yet.

## Answer

- **Accounts are not needed for any option.** Every option identifies a
  device by its push token (APNs device token, FCM registration token or
  OneSignal subscription). The server stores `token → followed topics` and
  nothing else.
- **APNs directly is the cheapest and simplest** for an iOS-only app that is
  getting a backend anyway (proposed on [Running service or static nightly build?](https://github.com/michaelschoenbaechler/parlwatch/issues/49)): free with the Apple Developer Program
  we already pay for, one official Capacitor plugin, and a server that signs
  an ES256 JWT and makes HTTP/2 POSTs.
- **FCM** is also free and is worth it only if Android is planned; on iOS it
  is a layer on top of APNs (same `.p8` key uploaded to Firebase) plus the
  Firebase SDK in the app.
- **OneSignal** removes the server-side sending code but not the server-side
  change detection, adds a third party holding device data, and costs money
  above 1,000 monthly active users.
- **Background fetch plus local notifications is not a reliable substitute.**
  iOS decides if and when it runs, gives roughly 30 seconds, favours apps used
  regularly, and stops entirely after the user swipes the app away until they
  open it again. Fine as an opportunistic "refresh before I open the app"
  bonus, not for "notify me when a business in my topic changes".

## Option 1: APNs directly

### Apple side

- Apple Developer Program: 99 USD per membership year; Push Notifications is
  listed as an included capability with no stated quota.
  ([Apple: What's included](https://developer.apple.com/programs/whats-included/))
  APNs itself has no per-message charge.
- Create an APNs auth key in the developer account. Apple gives a 10-character
  **Key ID** and a **`.p8`** signing key. Team-scoped keys are restricted to
  either Sandbox or Production, max two per environment; topic-specific keys
  are also available.
  ([Apple: Establishing a token-based connection to APNs](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns))
- Enable the Push Notifications capability on the App ID / target (adds the
  `aps-environment` entitlement).

### App side

- `@capacitor/push-notifications` 8.1.3 (peer `@capacitor/core >=8.0.0`).
  On iOS the `registration` event's token "contains the APNS token".
  Setup: enable the Push Notifications capability and add the two
  `AppDelegate.swift` methods that forward
  `didRegisterForRemoteNotificationsWithDeviceToken` /
  `didFailToRegister...` to Capacitor. The plugin does not support iOS silent
  push. ([Capacitor: Push Notifications](https://capacitorjs.com/docs/apis/push-notifications))
- The app sends `{token, topics[]}` to our API whenever the token or the
  follows change. No login: the token is the identity.

### Server side

- JWT: header `alg: ES256`, `kid: <Key ID>`; claims `iss: <Team ID>`,
  `iat: <now>`. Refresh it "no more than once every 20 minutes and no less
  than once every 60 minutes"; tokens older than an hour get
  `ExpiredProviderToken (403)`.
  ([Apple: token-based connection](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns))
- Transport: HTTP/2 with TLS 1.2+ to `api.push.apple.com` (production) or
  `api.sandbox.push.apple.com` (development builds), `POST /3/device/<token>`,
  header `authorization: bearer <jwt>`, `apns-topic: <bundle id>`,
  `apns-push-type: alert`. Payload max 4 KB.
  ([Apple: Sending notification requests to APNs](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns))
- Handle responses: `410 Unregistered` / `ExpiredToken` means delete the
  token; do not retry `BadDeviceToken`, `Unregistered` etc.; back off on
  `429 TooManyRequests`.
  ([Apple: Handling notification responses](https://developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns))
- In Node this is `node:http2` plus `node:crypto` (ES256 signing) or a small
  library; no extra hosted infrastructure beyond the proposed insights service.
- Change detection (diffing `ws.parlament.ch` for new/changed businesses per
  `TagNames` topic) is needed in **every** server option; push providers only
  deliver.

### Cost

99 USD/year (already paid for TestFlight/App Store), 0 per message.

## Option 2: Firebase Cloud Messaging

- Pricing: FCM is a no-cost product on both Spark and Blaze plans.
  ([Firebase pricing](https://firebase.google.com/pricing))
- Still needs the APNs `.p8` key, uploaded to the Firebase console ("At least
  one is required"). The Firebase SDK swizzles the app delegate to map the
  APNs token to an FCM token (can be disabled).
  ([Firebase: Set up an FCM client on Apple platforms](https://firebase.google.com/docs/cloud-messaging/ios/client))
- App: `@capacitor/push-notifications` alone only yields the raw APNs token on
  iOS, so an FCM token needs a Firebase plugin such as
  `@capacitor-firebase/messaging` 8.5.2 (community, peer `firebase ^12.6.0`,
  `@capacitor/core >=8.0.0`) plus `GoogleService-Info.plist`.
- Server: Firebase Admin SDK with a service account (OAuth instead of our own
  JWT). FCM topic messaging could map 1:1 to parliament topics, letting
  the app subscribe to a topic without the server storing per-device follows.
- Gains: one API for iOS and Android, topic fan-out. Costs: Google SDK and
  data flow in a privacy-sensitive civic app, more native setup.

## Option 3: OneSignal (representative hosted service)

- Pricing: Free plan up to 1,000 monthly active users with unlimited mobile
  push; Growth from 19 USD/month plus 0.012 USD per MAU (MAU counts every
  device active in 30 days, opted in or not).
  ([OneSignal pricing](https://onesignal.com/pricing))
- Setup: `@onesignal/capacitor-plugin`, the `.p8` key uploaded to OneSignal,
  a Notification Service Extension target and an App Group for receipts and
  badges. Subscriptions are created on first app open; an External ID is
  optional, so no login is needed.
  ([OneSignal: Ionic/Capacitor SDK setup](https://documentation.onesignal.com/docs/ionic-capacitor-cordova-sdk-setup))
- Follows can be stored as OneSignal tags and targeted via segments, so the
  server only calls OneSignal's REST API when it detects a change.
- Trade-off: least server code, but a third party stores the device list and
  follow tags, there is a recurring cost once past 1,000 MAU, and our server is
  still required for change detection.

## Option 4: no server — background fetch plus local notifications

### What iOS offers

- `BGAppRefreshTaskRequest` via `BGTaskScheduler`: "The system decides the
  best time to launch your background task, and provides your app up to 30
  seconds of background runtime."
  ([Apple: Choosing background strategies](https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app))
  Requires the "Background fetch" mode and each identifier in
  `BGTaskSchedulerPermittedIdentifiers`; resubmitting replaces the previous
  request.
  ([Apple: Using background tasks to update your app](https://developer.apple.com/documentation/uikit/using-background-tasks-to-update-your-app))
- `earliestBeginDate` is only a lower bound; there is no way to request a
  frequency.

### How often it really runs

Apple DTS (Quinn "The Eskimo!") in the pinned
[iOS Background Execution Limits](https://developer.apple.com/forums/thread/685525)
post:

- Refresh is heuristic: "if you expect that the app refresh mechanism will
  grant you background execution time, say, every 15 minutes, you'll be
  disappointed." In common scenarios it grants none at all.
- "The system applies a range of heuristics to decide which apps get app
  refresh time and when." The Capacitor Background Runner docs add that the
  schedule depends partly on how often the app is used, so rarely opened apps
  get little or no refresh time.

### Force-quit

Same post: swiping the app away in the app switcher "sets a flag that prevents
the app from being launched in the background", cleared only when the user
next launches the app manually, with no documented way to override it. Many
users swipe apps away habitually, so this alone rules it out for alerts.

### Capacitor support

- `@capacitor/background-runner` 3.0.0 (peer `@capacitor/core >=8.0.0`)
  wraps `BGTaskScheduler`. Config: `label` (must match the plist identifier),
  `src` (a separate JS file run in a sandboxed JS context, not the Angular
  app), `event`, `repeat`, `interval` in minutes. Inside the runner: `fetch`
  (limited options), `CapacitorKV` storage, and
  `CapacitorNotifications.schedule` for local notifications. Limits from the
  docs: "approximately up to 30 seconds of runtime", iOS "will determine when
  and how often" it runs, it does not run in the simulator, and runner state
  does not persist between runs.
  ([Capacitor: Background Runner](https://capacitorjs.com/docs/apis/background-runner))
- `@capacitor/local-notifications` 8.3.1 handles notifications from the
  foreground app; the runner has its own `CapacitorNotifications` API for
  the background path.
  ([Capacitor: Local Notifications](https://capacitorjs.com/docs/apis/local-notifications))
- Practical issues for parlwatch: the follow-check logic (OData query on
  `ws.parlament.ch`, diff against last seen state) must be duplicated in the
  runner's plain JS sandbox; a 30-second budget is tight for several OData
  requests on mobile networks.

### Verdict

Unpredictable timing (hours to never), nothing at all after force-quit or for
rarely opened apps. Acceptable only as a "best effort, keep data fresh" add-on,
not for notifications users rely on.

## Side note: silent pushes are not a workaround either

Background (silent) pushes wake the app but are low priority, may be delayed
or dropped, should be capped at "two or three per hour", and are discarded if
the app was force-quit.
([Apple: Pushing background updates](https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app))
The official Capacitor push plugin does not support them on iOS anyway. Send
visible `alert` pushes with the change text in the payload instead.

## Comparison

| | APNs direct | FCM | OneSignal | Background fetch |
|---|---|---|---|---|
| Server needed | Yes (proposed insights service) | Yes | Yes (change detection) | No |
| Extra cost | none | none | 0 to 1k MAU, then 19 USD + 0.012/MAU/month | none |
| Apple setup | `.p8` key, push capability | same, key uploaded to Firebase | same, key uploaded to OneSignal, NSE + App Group | Background fetch mode, plist IDs |
| App plugin | `@capacitor/push-notifications` | `@capacitor-firebase/messaging` + Firebase SDK | `@onesignal/capacitor-plugin` | `@capacitor/background-runner` |
| Third party holds device data | No (Apple only) | Google | OneSignal | No |
| Reliability | Reliable delivery | Reliable | Reliable | Unpredictable, off after force-quit |
| Android later | Separate path needed | Built in | Built in | Different API on Android |

## Recommendation

Use APNs directly from the proposed insights service: `@capacitor/push-notifications`
in the app, an anonymous `POST /devices {token, topics}` endpoint, a
production and a sandbox `.p8` key in server secrets, and token cleanup on
`410`. Revisit FCM only if an Android app becomes a goal.
