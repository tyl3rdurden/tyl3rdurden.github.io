# Portfolio site

This repository builds a bilingual personal resume and project portfolio for GitHub Pages. It began with the [Start Bootstrap Resume theme](https://startbootstrap.com/theme/resume/) and retains its MIT license and some theme styles. The current site uses Bootstrap 5.3.6 for both the compiled CSS and browser JavaScript.

## Requirements

- Node.js 20 and npm

Run `npm ci` to install the dependencies from `package-lock.json`.

## Build and preview

- `npm run build` regenerates the site.
- `npm start` builds the site, serves `dist/`, and watches the source files for changes.
- `npm run start:debug` does the same with a Node inspector for the watcher.

The build writes preview files to `dist/`. It also copies compiled CSS and JavaScript to the root `css/styles.css` and `js/scripts.js`, and generates the published English and Korean pages at `index.html` and `kr/index.html`. The root files are committed for GitHub Pages; `dist/` is ignored.

## Where to edit

| Input | Purpose |
| --- | --- |
| `src/pug/index.pug` | Page structure and shared content |
| `content/carousels.json` | Project carousel slides and links |
| `localization.json` | English and Korean text selected by element ID |
| `src/scss/` | Site styling, including Bootstrap 5 imports |
| `src/js/scripts.js` | Navigation, scroll behavior, and image lightbox |
| `assets/` | Images and downloadable files |

`src/pug/index.pug` and `content/carousels.json` produce `templates/index.template.html` during a full build. The template plus `localization.json` produce both root HTML pages. You can edit the template to preview a localization change; the watcher will regenerate both pages, but the next full build replaces that template. Put lasting markup changes in the Pug source or carousel data.

The watcher covers `src/`, `assets/`, `content/`, `templates/`, and `localization.json`. Changes to the template or localization file regenerate the localized pages. Other watched changes run the full build. BrowserSync reloads the `dist/` preview; for the localized pages, open the root pages through a local static server or rebuild and inspect them directly.

## License

The original Start Bootstrap Resume theme and this repository include the [MIT license](LICENSE).
