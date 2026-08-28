# dev-kaiki.github.io

Personal site — [dev-kaiki.github.io](https://dev-kaiki.github.io/)

Static HTML and CSS, no build step and no dependencies. Push to `main` and
GitHub Pages redeploys automatically.

## Files

| | |
|---|---|
| `index.html` | English (default) |
| `pt.html` | Portuguese (pt-BR) |
| `styles.css` | shared by both pages |
| `demos.js` | the two interactive demos, shared by both pages |
| `assets/` | real screenshots of the software running |
| `favicon.svg` | |

**`demos.js` builds its own markup** and picks the language from `<html lang>`, so the demo
copy lives in one file instead of being duplicated across the two pages. Each page only carries
the empty `#demo-flow` / `#demo-gcode` containers.

**The two pages are independent.** A change to the content of one must be made
in the other as well — there is no shared template. The `<link rel="alternate"
hreflang=...>` tags in both heads tell search engines they are translations of
each other, so keep them in sync if a page is ever renamed.
