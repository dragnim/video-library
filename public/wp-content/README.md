# Dev-shell stylesheets

Copies of the WordPress host's stylesheets, so `npm run dev` renders against something like the real page. Don't edit them.

Fetched 2026-08-02 from `https://dyalogprod.gos.dyalog.com/video-library/` (page-id-7145, body class
`wp-child-theme-dyalog-2026 elementor-kit-6`). Paths mirror the live ones.

| File | |
| --- | --- |
| `themes/hello-elementor/theme.min.css` | Parent theme, tag-level defaults |
| `themes/hello-elementor/style.min.css` | Parent theme layout |
| `themes/dyalog-2026/style.css` | Child theme |
| `plugins/elementor/assets/css/frontend.min.css` | Elementor frontend base |
| `uploads/elementor/css/post-6.css` | Kit 6 — typography/colour tokens, Klavika `@font-face` |

The live page loads 41 sheets; these are the five that affect what the app inherits.
`themes/dyalog-2026/video-library/dist/index.css` is excluded — that's dvl's deployed stylesheet, the one
we're replacing.

Klavika isn't vendored. `post-6.css` declares it with absolute URLs to the host, as do all the other `url()`s
in these files, so `npm run dev` needs network access for correct typography. Offline you get a fallback face.

## Refreshing

```sh
cd public/wp-content
B=https://dyalogprod.gos.dyalog.com/wp-content
curl -sSL -o themes/hello-elementor/theme.min.css          "$B/themes/hello-elementor/theme.min.css"
curl -sSL -o themes/hello-elementor/style.min.css          "$B/themes/hello-elementor/style.min.css"
curl -sSL -o themes/dyalog-2026/style.css                  "$B/themes/dyalog-2026/style.css"
curl -sSL -o plugins/elementor/assets/css/frontend.min.css "$B/plugins/elementor/assets/css/frontend.min.css"
curl -sSL -o uploads/elementor/css/post-6.css              "$B/uploads/elementor/css/post-6.css"
```
