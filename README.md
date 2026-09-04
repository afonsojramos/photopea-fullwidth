# Photopea Full Width

Photopea Full Width reclaims the space reserved for Photopea's advertising column. It also hides the oversized home-screen logo and removes the specific source-code-modification warning caused by the width override.

It does not remove ordinary dialogs, file errors, update notices, or premium prompts.

This project is not affiliated with Photopea.

## Build

Node.js 20.19.x or 22.12 and newer, npm, and the system `zip` command are
required.

```sh
npm ci
npm run verify
npm run package
```

Run `npm run fmt` to format the project and `npm run lint` to run Oxlint. The
`verify` command checks formatting and linting before it builds and validates the
extension packages.

## Photopea compatibility

The `Photopea compatibility` workflow loads the built Chromium extension against
the live Photopea site on the first day of each month. It fails if Photopea
changes the workspace or home-logo markup, if the width override stops filling
the viewport after growing or shrinking the window, or if warning removal stops
working. You can also run it manually from GitHub Actions.

For a local check, install Playwright's Chromium build once and run the test:

```sh
npx playwright install --no-shell chromium
npm run check:photopea
```

The release files are written to `dist/`:

- `photopea-fullwidth-chromium.zip`
- `photopea-fullwidth-firefox.zip`
- `photopea-fullwidth.user.js`

## Install locally

For Chrome, run `npm run build`, open `chrome://extensions`, enable Developer mode, choose Load unpacked, and select `dist/chromium`.

For Firefox, run `npm run build`, open `about:debugging#/runtime/this-firefox`, choose Load Temporary Add-on, and select `dist/firefox/manifest.json`.

The userscript works with Tampermonkey and Violentmonkey. Install `dist/photopea-fullwidth.user.js` after building.

## Releases

Release Please reads Conventional Commit messages and opens a release pull request against `main`.

- `fix:` creates a patch release.
- `feat:` creates a minor release.
- `feat!:` or a `BREAKING CHANGE:` footer creates a major release.

Merging the release pull request creates the GitHub release and uploads all three packages. The workflow keeps `package.json` and both browser manifests on the same version. The userscript gets that version during the build.

Before the first run, enable read and write workflow permissions and allow GitHub Actions to create pull requests in the repository settings.

Upload the Chromium zip to the Chrome Web Store and the Firefox zip to Mozilla Add-ons. Each store handles signing after submission. The userscript release asset has stable update URLs that point to the latest GitHub release.
