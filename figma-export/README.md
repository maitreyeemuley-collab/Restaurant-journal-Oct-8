# Figma export

Editable SVG snapshots of the real app screens, ready to drag into Figma. Taken from the running app in demo mode with the sample Seattle data.

## Put them in your Figma file

1. Open your Figma file and go to the page where the designs should live.
2. In Finder, select the SVG files you want (or a whole folder) and **drag them onto the Figma canvas**.
   Each SVG arrives as one frame whose layers are real rectangles, text, icons and shadows, so you can edit them.
3. Fonts: the text uses **Fraunces** (headings) and **Inter** (body). Both are on Google Fonts and available in Figma by default. If a layer shows a missing-font warning, pick the font from the list.
4. Optional: select the frames, then **Arrange → Tidy up** (or use the grid) to lay them out in a row.

## What's here

| File                    | Contents                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00-design-tokens.svg`  | Colors, type styles, spacing, radius and shadows, read from `src/styles/tokens.css`. Use it to create Figma color and text styles.                                                                                                                                                                                                                                                                       |
| `mobile/` (375 × 812)   | 01 Sign in · 02 Create account · 03 Sign-in errors · 04 Discover · 05 Discover filters open · 06 Discover with a hosting guest · 07 My Places · 08 My Places, no results · 09 Quick save · 10 Quick save with details · 11 Place detail (visited) · 12 Place detail (want to try) · 13 Add to a list · 14 Log a visit · 15 Map · 16 Hosting · 17 Guest form · 18 Lists · 19 List editor · 20 Public list |
| `desktop/` (1280 × 800) | 01 Discover · 02 My Places · 03 Place detail · 04 Map · 05 Hosting · 06 List editor                                                                                                                                                                                                                                                                                                                      |

## What to expect

- **Faithful layout:** positions, sizes, colors, borders, corner radii, shadows and icons are taken from the live page.
- **Not auto layout, components or variants:** everything is plain layers. Build components from the repeated pieces (button, chip, card, tab bar) and apply styles from the tokens sheet.
- **Text** can shift by a pixel or two if your Figma fonts differ slightly from the browser.
- **The map** includes the real OpenStreetMap tiles as images, with the terracotta and olive pins and the Leaflet controls as shapes.
- **Emoji** in cards and the brand name render with your system emoji font.
- Screens are the first 812px (phone) or 800px (desktop). Long lists are cut at the frame edge, as they would be on a device.
- Taken in demo mode, so the Sign in screens have the "Preview" note removed. In real use that note never shows.

## Re-making the export

If the app's look changes, regenerate:

```bash
npm run dev                                   # app on http://localhost:5173
node figma-export/tools/receiver.mjs "$PWD"   # saves files, listens on :5199
```

Then, on each screen in the browser console:

```js
const m = await import('/figma-export/tools/dom-to-svg.js?v=' + Date.now())
await m.capture('mobile/04-discover') // writes figma-export/mobile/04-discover.svg
```

Use a 375px-wide window for `mobile/` and 1280px for `desktop/`. Regenerate the tokens sheet with `python3 figma-export/tools/make-tokens-sheet.py`.
`tools/` is developer tooling only: it isn't imported by the app or included in the production build.
