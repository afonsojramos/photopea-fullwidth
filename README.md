<table align="center">
  <tr>
    <td align="center" bgcolor="#0d1117">
      <img src="assets/photopea-wordmark.png" alt="Photopea" width="630">
    </td>
  </tr>
</table>

<h1 align="center">Photopea Full Width</h1>

<p align="center">
  Give Photopea's editor the space reserved for its advertising column.
</p>

<p align="center">
  <a href="https://github.com/afonsojramos/photopea-fullwidth/actions/workflows/ci.yml"><img src="https://github.com/afonsojramos/photopea-fullwidth/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/afonsojramos/photopea-fullwidth/actions/workflows/photopea-compatibility.yml"><img src="https://github.com/afonsojramos/photopea-fullwidth/actions/workflows/photopea-compatibility.yml/badge.svg" alt="Photopea compatibility status"></a>
  <a href="PRIVACY.md"><img src="https://img.shields.io/badge/privacy-no_data_collected-20a89e" alt="Privacy: no data collected"></a>
</p>

Photopea Full Width removes the empty ad column so the editor fills your browser
window. It also hides the large Photopea logo on the Home screen and removes the
source-code warning caused by the width adjustment.

The extension leaves normal dialogs, file errors, update notices, and premium
prompts alone. It does not collect data. See the [privacy policy](PRIVACY.md) for
details.

## Install

### Chrome and Chromium browsers

1. Download `photopea-fullwidth-chromium.zip` from the
   [latest release](https://github.com/afonsojramos/photopea-fullwidth/releases/latest).
2. Extract the zip file.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Select **Load unpacked**, then choose the extracted folder.

### Firefox

1. Download `photopea-fullwidth-firefox.zip` from the
   [latest release](https://github.com/afonsojramos/photopea-fullwidth/releases/latest).
2. Extract the zip file.
3. Open `about:debugging#/runtime/this-firefox`.
4. Select **Load Temporary Add-on**.
5. Choose `manifest.json` from the extracted folder.

Firefox removes temporary add-ons when the browser closes.

### Userscript

Install [Tampermonkey](https://www.tampermonkey.net/) or
[Violentmonkey](https://violentmonkey.github.io/), then install the
[latest userscript](https://github.com/afonsojramos/photopea-fullwidth/releases/latest/download/photopea-fullwidth.user.js).

## What it changes

- Expands the editor into Photopea's reserved ad space.
- Adapts when you resize the browser window.
- Hides the large logo on the Home screen.
- Removes only the source-code warning caused by the width adjustment.

## Development

You need Node.js 20.19.x or 22.12 and newer, npm, and the system `zip` command.

```sh
npm ci
npm run verify
npm run package
```

`npm run package` writes these release files to `dist/`:

- `photopea-fullwidth-chromium.zip`
- `photopea-fullwidth-firefox.zip`
- `photopea-fullwidth.user.js`

Run `npm run fmt` to format the project. Run `npm run lint` to check it with
Oxlint.

### Check live Photopea compatibility

The monthly compatibility workflow loads the built Chromium extension on the
live Photopea site. It checks the editor width, browser resizing, logo hiding,
and warning removal. Run the same check locally with these commands:

```sh
npx playwright install --no-shell chromium
npm run check:photopea
```

### Make a release

Release Please reads Conventional Commit messages and opens a release pull
request against `main`:

- `fix:` creates a patch release.
- `feat:` creates a minor release.
- `feat!:` or a `BREAKING CHANGE:` footer creates a major release.

Merge the release pull request to create the GitHub release and upload all three
packages. The workflow keeps the package, Chromium extension, Firefox extension,
and userscript versions in sync.

This project is not affiliated with Photopea.
