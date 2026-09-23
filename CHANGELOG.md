## [2026.9.23](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.9.12...2026.9.23) (2026-09-23)

### Bug Fixes

* **business:** keep the iOS header hairline off the parliament switcher ([bae19ae](https://github.com/michaelschoenbaechler/parlwatch/commit/bae19aee807239db38a80b6adb79c5c9a05bb382))
* **layout:** keep the intro's only exit on "Jetzt entdecken" ([96aa1c3](https://github.com/michaelschoenbaechler/parlwatch/commit/96aa1c34819c432dee4e3e2a0bb1bbee50571a36))
* **parliament:** full accent line when a canton colour is white ([0192428](https://github.com/michaelschoenbaechler/parlwatch/commit/01924283ace9dc68d2b2c054e1d8fe272b39f329))
* **parliament:** keep every tab on the active parliament ([28a385f](https://github.com/michaelschoenbaechler/parlwatch/commit/28a385fdfbf70e9eb3266a4af9e79874b87aad98))
* **parliament:** polish what a walk through the app turned up ([400bada](https://github.com/michaelschoenbaechler/parlwatch/commit/400badaac547f3f024c8e9d629783b2aeb2dba06))
* **parliament:** query OpenParlData the way it actually answers ([333b11f](https://github.com/michaelschoenbaechler/parlwatch/commit/333b11f708bb45374a579553138a12807052412f))
* **parliament:** theme overlays and tidy the switcher ([17fe9fe](https://github.com/michaelschoenbaechler/parlwatch/commit/17fe9fe5674e3f2425814574b5f6c9a8f5113f0e))

### Features

* **business:** list and show cantonal business from OpenParlData ([a3b359e](https://github.com/michaelschoenbaechler/parlwatch/commit/a3b359e297ffe09041110cbf98e667b81d5ec722))
* **business:** search cantonal business inside its documents ([61d7713](https://github.com/michaelschoenbaechler/parlwatch/commit/61d771340c8583ae8aa6d0b5f4b679f9da5a8ced))
* **business:** watch a business and get told when it changes ([eb13679](https://github.com/michaelschoenbaechler/parlwatch/commit/eb13679b9571572e2d31c7354c873266eb0011bb)), closes [#41](https://github.com/michaelschoenbaechler/parlwatch/issues/41)
* **business:** watch from the timeline and the parliament switcher ([53955cb](https://github.com/michaelschoenbaechler/parlwatch/commit/53955cb93ddf9f0e0e119db406b98705bdfd4173))
* **council-member:** list and show cantonal members from OpenParlData ([97e383e](https://github.com/michaelschoenbaechler/parlwatch/commit/97e383e75beecad08b1cab3100cc8fe86937c4b1))
* **layout:** introduce the app on a single screen ([265b4d2](https://github.com/michaelschoenbaechler/parlwatch/commit/265b4d24daabe955c88d09be7dd89f4707ffdbb5))
* **parliament:** add cantonal theme, switcher, hint card and notice ([3b252d5](https://github.com/michaelschoenbaechler/parlwatch/commit/3b252d57c4349214d0d79a136dae45ba5f06af55))
* **parliament:** add parliament key, OpenParlData boundary and routing ([defca5a](https://github.com/michaelschoenbaechler/parlwatch/commit/defca5ab8ec476ff16b7bede0cce118cb7911189))
* **parliament:** follow at most four cantons ([39664d5](https://github.com/michaelschoenbaechler/parlwatch/commit/39664d5e765dd8758c1e6378ff61bf1eafe144e7))
* **settings:** add canton selection, welcome step and cantonal i18n ([d4fece2](https://github.com/michaelschoenbaechler/parlwatch/commit/d4fece2909a8af5a89fe2babec7c807432cade08))
* **settings:** reopen the intro from the settings ([e826c16](https://github.com/michaelschoenbaechler/parlwatch/commit/e826c161c8e8465ab5a07ba4babf109931546e4e))
* **votes:** list and show cantonal votes from OpenParlData ([ca65c78](https://github.com/michaelschoenbaechler/parlwatch/commit/ca65c783498b942102fd0dae82dad72d46239474))

## [2026.9.12](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.4.1...2026.9.12) (2026-09-12)

### Bug Fixes

* **business:** detail has its own state now ([f98c2b0](https://github.com/michaelschoenbaechler/parlwatch/commit/f98c2b06ad16492061237adf23f989864d7fb65f))
* **business:** show current status as active ([356c4d7](https://github.com/michaelschoenbaechler/parlwatch/commit/356c4d79019c8f08549cc90be67e8bf07e584dfb))
* ci ([625ac01](https://github.com/michaelschoenbaechler/parlwatch/commit/625ac01008a302423c827d11c253e26fb2cb9482))
* extend tests ([c7a70a1](https://github.com/michaelschoenbaechler/parlwatch/commit/c7a70a1e2c85c2b1ea70a24b7de0bde9e56d1080))
* include selectedBusinessId in patchState during business update ([48a6273](https://github.com/michaelschoenbaechler/parlwatch/commit/48a62732751a4ccfdda5b89ea83a0da9ede47608))
* make suggestions scrollable ([f9b6300](https://github.com/michaelschoenbaechler/parlwatch/commit/f9b63001e11e313b5f95b6f004c4619a4271d16d))
* prettier ([846696f](https://github.com/michaelschoenbaechler/parlwatch/commit/846696f45fa52db09071085ae37c598c1f1da9aa))

### Features

* always display loading screen ([e17380a](https://github.com/michaelschoenbaechler/parlwatch/commit/e17380a014961436748a38852d98e62fd0282d49))
* **business:** add debates ([9fc0293](https://github.com/michaelschoenbaechler/parlwatch/commit/9fc029369903573f8a338585e5e02ccf23624a84))
* **business:** add timeline and related businesses ([a52a2ee](https://github.com/michaelschoenbaechler/parlwatch/commit/a52a2eee9d72a2285d3d11441f8a8567cdfdd641))
* **business:** add votes to business detail ([2306519](https://github.com/michaelschoenbaechler/parlwatch/commit/2306519949e0d7775e6637a394f3ed96ddadda80))
* **business:** default to current session filter and other perforamnce improvements ([0ad7e45](https://github.com/michaelschoenbaechler/parlwatch/commit/0ad7e45d9f1e1a477ca3c5acdafd3b331305c58b))
* **business:** recenlty used ([7d30e4e](https://github.com/michaelschoenbaechler/parlwatch/commit/7d30e4e759c7f5769d8e196aed5c79fe2aaa5cca))
* **council-member:** add more interests ([bc83a3a](https://github.com/michaelschoenbaechler/parlwatch/commit/bc83a3a20c4a6872c20add3818e4a83feeb25bba))
* **members:** show speeches ([a4f094d](https://github.com/michaelschoenbaechler/parlwatch/commit/a4f094d56be9197bec6ab65b2e8b33695d40a6fe))
* **routing:** nested routes under tabs ([7121612](https://github.com/michaelschoenbaechler/parlwatch/commit/7121612e68ddf6e66fd23ab9289342d8443fda14))
* streamline typography ([89d868a](https://github.com/michaelschoenbaechler/parlwatch/commit/89d868a2cb1c2fbc04b093c92aa848b3ae5eb074))
* **votes:** add more information to vote detail page ([4fe42b6](https://github.com/michaelschoenbaechler/parlwatch/commit/4fe42b6f4cfe1413c7fc650cf20b2670549205c3))
* **votes:** breakdown by ParlGroup ([b80e689](https://github.com/michaelschoenbaechler/parlwatch/commit/b80e689addc9c5b059bd19aad3fd28b83397072d))
* **votes:** group votes by business ([d41c072](https://github.com/michaelschoenbaechler/parlwatch/commit/d41c072fc4d96bb2793f8a3475ee70e1e2fe2498))
* **votes:** improve search ([37e931b](https://github.com/michaelschoenbaechler/parlwatch/commit/37e931b1e5d43da53487ef180c908ce66a291ba5))
* **votes:** recenlty used ([2c0d68e](https://github.com/michaelschoenbaechler/parlwatch/commit/2c0d68ea45bfbeb29d2d501193f447f229457142))

## [2026.4.1](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.3.30...2026.4.1) (2026-04-01)

* fix: override vulnerable picomatch and handlebars ([e1d0c9d](https://github.com/michaelschoenbaechler/parlwatch/commit/e1d0c9d))
* fix: regenerate package-lock.json to sync dependencies ([e4107e7](https://github.com/michaelschoenbaechler/parlwatch/commit/e4107e7))
* fix(deps): resolve dependabot security alerts ([e1ffe1e](https://github.com/michaelschoenbaechler/parlwatch/commit/e1ffe1e))
* fix(deps): resolve dependabot security alerts ([5141bd9](https://github.com/michaelschoenbaechler/parlwatch/commit/5141bd9))
* fix(deps): resolve dependabot security alerts ([5aea7bb](https://github.com/michaelschoenbaechler/parlwatch/commit/5aea7bb))
* fix(deps): resolve dependabot security alerts ([0f39217](https://github.com/michaelschoenbaechler/parlwatch/commit/0f39217))



## [2026.3.14](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.3.11...2026.3.14) (2026-03-14)

* fix(deps): resolve dependabot security alerts ([378d6cc](https://github.com/michaelschoenbaechler/parlwatch/commit/378d6cc))



## [2026.3.11](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.3.10...2026.3.11) (2026-03-11)

* chore: update to Angular 21 ([5d2cd52](https://github.com/michaelschoenbaechler/parlwatch/commit/5d2cd52))
* ci: use Xcode 26 on macOS 15 runner for iOS deploy ([be9b375](https://github.com/michaelschoenbaechler/parlwatch/commit/be9b375))



## [2026.3.9](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.3.3...2026.3.9) (2026-03-09)

* fix(deps): bump tar to 7.5.9 ([9b0c583](https://github.com/michaelschoenbaechler/parlwatch/commit/9b0c583))
* fix(deps): resolve dependabot security alerts ([eec5199](https://github.com/michaelschoenbaechler/parlwatch/commit/eec5199))
* test: add Karma/Jasmine testing setup with coverage and CI ([82d3ef0](https://github.com/michaelschoenbaechler/parlwatch/commit/82d3ef0))
* ci: update Info.plist to specify app does not use non-exempt encryption ([463b3dc](https://github.com/michaelschoenbaechler/parlwatch/commit/463b3dc))



## [2026.3.9](https://github.com/michaelschoenbaechler/parlwatch/compare/2026.3.3...2026.3.9) (2026-03-09)

* test: add Karma/Jasmine testing setup with coverage and CI ([82d3ef0](https://github.com/michaelschoenbaechler/parlwatch/commit/82d3ef0))
* fix(deps): bump tar to 7.5.9 ([9b0c583](https://github.com/michaelschoenbaechler/parlwatch/commit/9b0c583))
* ci: update Info.plist to specify app does not use non-exempt encryption ([463b3dc](https://github.com/michaelschoenbaechler/parlwatch/commit/463b3dc))



## [2026.3.3](https://github.com/michaelschoenbaechler/parlwatch/compare/1.0.4...2026.3.3) (2026-03-03)

* ci: add iOS deployment guide and automation ([5fca8b4](https://github.com/michaelschoenbaechler/parlwatch/commit/5fca8b4))
* ci: improve iOS deployment process and provisioning profile handling ([92bd53c](https://github.com/michaelschoenbaechler/parlwatch/commit/92bd53c))
* ci: switch iOS code signing to manual and update Fastlane for provisioning profile config ([1bc7687](https://github.com/michaelschoenbaechler/parlwatch/commit/1bc7687))
* ci: switch iOS code signing to manual and update Fastlane for provisioning profile config ([9b6b988](https://github.com/michaelschoenbaechler/parlwatch/commit/9b6b988))
* ci: update Fastlane to skip provisioning profile detection in iOS builds ([53c84d7](https://github.com/michaelschoenbaechler/parlwatch/commit/53c84d7))
* fix: address tar and tmp vulnerabilities via npm overrides ([ef501ee](https://github.com/michaelschoenbaechler/parlwatch/commit/ef501ee))
* fix: update Angular to 20.3.16 to address XSS vulnerability (GHSA-jrmj-c5cx-3cw6) ([fd2b84c](https://github.com/michaelschoenbaechler/parlwatch/commit/fd2b84c))
* fix: upgrade to ESLint 9 to address stack overflow vulnerability (GHSA-p5wg-g6qr-c7cg) ([b7357f8](https://github.com/michaelschoenbaechler/parlwatch/commit/b7357f8))
* chore: add html to prettier ([63a29c4](https://github.com/michaelschoenbaechler/parlwatch/commit/63a29c4))
* chore: add ngrx toolkit ([8ef6702](https://github.com/michaelschoenbaechler/parlwatch/commit/8ef6702))
* chore: increment changelog generation ([de5080c](https://github.com/michaelschoenbaechler/parlwatch/commit/de5080c))
* chore: lint ([991427d](https://github.com/michaelschoenbaechler/parlwatch/commit/991427d))
* chore: update packages to fix security vulnerabilities and update dependencies ([a1c8074](https://github.com/michaelschoenbaechler/parlwatch/commit/a1c8074))
* refactor: migration to output function ([0c1f3c2](https://github.com/michaelschoenbaechler/parlwatch/commit/0c1f3c2))
* refactor: migration to self-closing tags ([3a98f75](https://github.com/michaelschoenbaechler/parlwatch/commit/3a98f75))
* refactor: migration to signal inputs ([0b1ad4f](https://github.com/michaelschoenbaechler/parlwatch/commit/0b1ad4f))
* refactor: migration to signal queries ([d57c629](https://github.com/michaelschoenbaechler/parlwatch/commit/d57c629))
* refactor(business): introduce scalable signal store architecture ([06a12de](https://github.com/michaelschoenbaechler/parlwatch/commit/06a12de))
* refactor(council-member): introduce scalable signal store architecture ([fff6769](https://github.com/michaelschoenbaechler/parlwatch/commit/fff6769))
* refactor(votes): introduce scalable signal store architecture ([0b951aa](https://github.com/michaelschoenbaechler/parlwatch/commit/0b951aa))
* docs: improve documentation of request state ([f7cfa7c](https://github.com/michaelschoenbaechler/parlwatch/commit/f7cfa7c))
* docs: remove version of frameworks ([304670f](https://github.com/michaelschoenbaechler/parlwatch/commit/304670f))



## <small>1.0.4 (2025-08-02)</small>

* chore: add copilot instructions ([8f9ae96](https://github.com/michaelschoenbaechler/parlwatch/commit/8f9ae96))
* chore: bump angular version ([23d4aab](https://github.com/michaelschoenbaechler/parlwatch/commit/23d4aab))
* chore: bump app version ([7233e34](https://github.com/michaelschoenbaechler/parlwatch/commit/7233e34))
* chore: bump ionic and capacitor version ([abd3947](https://github.com/michaelschoenbaechler/parlwatch/commit/abd3947))
* chore: bump ios build number ([1b60f6e](https://github.com/michaelschoenbaechler/parlwatch/commit/1b60f6e))
* chore: update eslint dependencies ([01afa2d](https://github.com/michaelschoenbaechler/parlwatch/commit/01afa2d))
* feat(i18n): add i18n ([2147e1e](https://github.com/michaelschoenbaechler/parlwatch/commit/2147e1e))



## <small>1.0.3 (2024-11-20)</small>

* chore: bump version to 1.0.3 ([8bf46d2](https://github.com/michaelschoenbaechler/parlwatch/commit/8bf46d2))
* chore: configure ionic schematics ([cd51bc3](https://github.com/michaelschoenbaechler/parlwatch/commit/cd51bc3))
* chore: enable eslint 'prefer-control-flow' rule ([378f56a](https://github.com/michaelschoenbaechler/parlwatch/commit/378f56a))
* chore: update dependencies ([5a2157c](https://github.com/michaelschoenbaechler/parlwatch/commit/5a2157c))
* chore: update dependencies ([4d1dd4e](https://github.com/michaelschoenbaechler/parlwatch/commit/4d1dd4e))
* chore: update dependencies ([7d68ffe](https://github.com/michaelschoenbaechler/parlwatch/commit/7d68ffe))
* chore: update dependencies ([cb3125d](https://github.com/michaelschoenbaechler/parlwatch/commit/cb3125d))
* chore: update swissparl ([6e13d70](https://github.com/michaelschoenbaechler/parlwatch/commit/6e13d70))
* fix: routing and remaining imports ([ed35b5f](https://github.com/michaelschoenbaechler/parlwatch/commit/ed35b5f))
* fix: update .browserslistrc to recommended settings for Ionic v7 ([b563223](https://github.com/michaelschoenbaechler/parlwatch/commit/b563223))
* fix: upgrade all eslint dependencies to v18 ([055d943](https://github.com/michaelschoenbaechler/parlwatch/commit/055d943))
* refactor: configure and apply import order ([9ea7464](https://github.com/michaelschoenbaechler/parlwatch/commit/9ea7464))
* refactor: improve naming ([53e29d0](https://github.com/michaelschoenbaechler/parlwatch/commit/53e29d0))
* refactor: migrate to new built-in control flow ([d597c9e](https://github.com/michaelschoenbaechler/parlwatch/commit/d597c9e))
* refactor: standalone architecture ([284b7e6](https://github.com/michaelschoenbaechler/parlwatch/commit/284b7e6))
* refactor(business): introduce ngrx signals ([dff7ff8](https://github.com/michaelschoenbaechler/parlwatch/commit/dff7ff8))
* refactor(business): rename css class ([18a8be2](https://github.com/michaelschoenbaechler/parlwatch/commit/18a8be2))
* refactor(council-member): introduce ngrx signals ([01e2057](https://github.com/michaelschoenbaechler/parlwatch/commit/01e2057))



## <small>1.0.2 (2024-01-15)</small>

* chore: bump version to 1.0.2 ([fb235ee](https://github.com/michaelschoenbaechler/parlwatch/commit/fb235ee))
* chore: update dependencies ([af75de6](https://github.com/michaelschoenbaechler/parlwatch/commit/af75de6))
* fix: update zonejs polyfills import ([0ba883c](https://github.com/michaelschoenbaechler/parlwatch/commit/0ba883c))



## <small>1.0.1 (2023-10-10)</small>

* chore: bump version to 1.0.1 ([83a3878](https://github.com/michaelschoenbaechler/parlwatch/commit/83a3878))
* chore: update dependencies ([1ab552d](https://github.com/michaelschoenbaechler/parlwatch/commit/1ab552d))
* docs: update changelog ([243b922](https://github.com/michaelschoenbaechler/parlwatch/commit/243b922))



## 1.0.0 (2023-10-08)

* docs: add privacy policy ([9fbd317](https://github.com/michaelschoenbaechler/parlwatch/commit/9fbd317))



## 1.0.0-rc.4 (2023-10-08)

* chore: bump version to 1.0.0-rc.4 ([eb6e269](https://github.com/michaelschoenbaechler/parlwatch/commit/eb6e269))
* chore: incerase xcode build number ([18e963e](https://github.com/michaelschoenbaechler/parlwatch/commit/18e963e))
* fix(business): show search suggestions depending on keyboard state ([8013111](https://github.com/michaelschoenbaechler/parlwatch/commit/8013111))
* docs: use lowercase and no italic for feature ([af92534](https://github.com/michaelschoenbaechler/parlwatch/commit/af92534))



## 1.0.0-rc.3 (2023-10-07)

* chore: bump version to 1.0.0-rc.3 ([32f2a2b](https://github.com/michaelschoenbaechler/parlwatch/commit/32f2a2b))
* docs: improve readme ([1865928](https://github.com/michaelschoenbaechler/parlwatch/commit/1865928))
* docs: remove license and usage ([e679c82](https://github.com/michaelschoenbaechler/parlwatch/commit/e679c82))
* docs: remove square brackets ([db9e892](https://github.com/michaelschoenbaechler/parlwatch/commit/db9e892))
* feat: ux improvements ([8e2fb76](https://github.com/michaelschoenbaechler/parlwatch/commit/8e2fb76))
* feat(council-member): add loading spinner ([8241add](https://github.com/michaelschoenbaechler/parlwatch/commit/8241add))
* feat(council-member): expand search ([4d3a8af](https://github.com/michaelschoenbaechler/parlwatch/commit/4d3a8af))
* feat(vote): remove session name in card ([8ec5aa2](https://github.com/michaelschoenbaechler/parlwatch/commit/8ec5aa2))
* fix: navigate to votes after welcome screen ([1ff49e1](https://github.com/michaelschoenbaechler/parlwatch/commit/1ff49e1))
* fix: translate remaining english copy ([2d65347](https://github.com/michaelschoenbaechler/parlwatch/commit/2d65347))
* fix(business): use indexed ID for detailed search ([06ef938](https://github.com/michaelschoenbaechler/parlwatch/commit/06ef938))
* refactor(vote): simplify search for business number ([326b20a](https://github.com/michaelschoenbaechler/parlwatch/commit/326b20a))



## 1.0.0-rc.2 (2023-09-18)

* chore: bump version to 1.0.0-rc.2 ([e9687d0](https://github.com/michaelschoenbaechler/parlwatch/commit/e9687d0))
* chore: remove unused dependency ([68e4482](https://github.com/michaelschoenbaechler/parlwatch/commit/68e4482))
* chore: remove unused dependency ([42e146c](https://github.com/michaelschoenbaechler/parlwatch/commit/42e146c))
* chore: revert version format ([57c657b](https://github.com/michaelschoenbaechler/parlwatch/commit/57c657b))
* build: add script for production build ([b91d48a](https://github.com/michaelschoenbaechler/parlwatch/commit/b91d48a))
* build: change xcode project name ([1885d1b](https://github.com/michaelschoenbaechler/parlwatch/commit/1885d1b))
* build: update name, version and build number ([a626f6e](https://github.com/michaelschoenbaechler/parlwatch/commit/a626f6e))
* fix: improve wording ([5dd79d3](https://github.com/michaelschoenbaechler/parlwatch/commit/5dd79d3))
* fix: keyboard listener ([4f35f0a](https://github.com/michaelschoenbaechler/parlwatch/commit/4f35f0a))
* fix: set global background color to white ([fbbe4dd](https://github.com/michaelschoenbaechler/parlwatch/commit/fbbe4dd))
* fix(business): search suggestions ([9899f8d](https://github.com/michaelschoenbaechler/parlwatch/commit/9899f8d))
* fix(business): set error to false after retry ([0c2d979](https://github.com/michaelschoenbaechler/parlwatch/commit/0c2d979))
* fix(council-members): display canton flags ([94fd8fc](https://github.com/michaelschoenbaechler/parlwatch/commit/94fd8fc))
* feat: add refresher in all list views ([3aa289b](https://github.com/michaelschoenbaechler/parlwatch/commit/3aa289b))
* feat(business): add search suggestions ([d211f82](https://github.com/michaelschoenbaechler/parlwatch/commit/d211f82))
* feat(business): display date of latest status change ([212f3c4](https://github.com/michaelschoenbaechler/parlwatch/commit/212f3c4))
* feat(shared): extend text-card with subtitle input ([a79b359](https://github.com/michaelschoenbaechler/parlwatch/commit/a79b359))
* feat(vote): make use of text-card subtitle ([bbef62e](https://github.com/michaelschoenbaechler/parlwatch/commit/bbef62e))
* docs: update contributing guide ([ae81f5a](https://github.com/michaelschoenbaechler/parlwatch/commit/ae81f5a))
* refactor(service): introduce swissparl service ([1760f97](https://github.com/michaelschoenbaechler/parlwatch/commit/1760f97))



## 1.0.0-rc.1 (2023-09-09)

* initial commit ([20d05e9](https://github.com/michaelschoenbaechler/parlwatch/commit/20d05e9))



