# Add the chapter logo across the site

The uploaded PDF is a lockup: the Alfaisal University crest, a divider, the ISACA
mark and wordmark, with "Student Chapter" underneath. It has a lot of empty space
around it and only works on light backgrounds, so it needs preparation before use.

## Prepare the artwork

1. Render the PDF at high resolution and trim the surrounding whitespace.
2. Produce two versions:
   - **Full lockup** (crest + ISACA + "Student Chapter") — for the footer and a
     light-background credibility strip.
   - **Compact lockup** (crest + ISACA only, without the "Student Chapter" line) —
     for the header, where vertical space is ~32px.
3. Both saved as transparent PNGs at 2x for crisp retina rendering, hosted on the
   CDN rather than committed as binaries.

## Where it appears

- **Header**: compact lockup on the left, replacing the current "ISACA / Student
  Chapter · Alfaisal" text wordmark. Capped at ~32px tall on desktop, ~28px on
  mobile, with the "Student Chapter · Alfaisal" text kept beside it on wider
  screens so the navy/dark type still reads as the site title.
- **Footer**: full lockup at ~56px tall above the existing description paragraph,
  replacing the text wordmark there.
- **Home hero**: the hero band is dark navy, and the logo's navy type would
  disappear on it. Instead of forcing the logo onto the gradient, place the full
  lockup in a small white "card" chip just under the hero, or on a light strip
  directly below the hero reading "In partnership with Alfaisal University" —
  this keeps the logo legible and looks intentional rather than pasted on.
- **Favicon**: generated from the ISACA circles mark alone (the crest is
  unreadable at 32px), replacing the default Lovable icon.
- **Mobile menu**: compact lockup at the top of the slide-out sheet.

## Notes

- Alt text on every instance: "ISACA Student Chapter — Alfaisal University".
- The logo is never stretched; width auto, height fixed, so proportions hold.
- No layout restructuring beyond swapping the wordmark for the image and adding
  the light logo strip under the hero.

## Technical

- Trim/crop and split the lockup with ImageMagick from the rendered PDF, upload
  each PNG via `lovable-assets`, and commit only the `.asset.json` pointers.
- `src/components/site-header.tsx` and `src/components/site-footer.tsx` import the
  pointers and render `<img>` with fixed heights.
- Favicon: a real square PNG in `public/favicon.png`, referenced from
  `head().links` in `src/routes/__root.tsx`; the default `favicon.ico` is removed.
