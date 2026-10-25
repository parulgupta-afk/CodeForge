# CodeForge intro add-on

Adds the animated "eye made of code" intro in front of the CodeForge site.

## Install (about 1 minute)

1. Unzip this folder.
2. Copy the `client` folder from here into your project root. Say yes to merge folders.
   - **New files:** `client/public/codeforge-intro.html`, `client/src/pages/Intro.tsx`
   - **Replaced file:** `client/src/App.tsx` (it only adds the intro route; the other routes are the same as the latest commit)
3. Run:

   ```bash
   cd client
   npm run dev
   ```

4. Open the site. The intro shows first. Press **Enter CodeForge** (or the Enter key) to go to Home.

## How it behaves

- `/` shows the intro once per browser session, then Home.
- `/intro` always shows the intro (useful for demos and screenshots).
- Nothing else in the site changes.

## Notes

- The intro loads Tailwind and fonts from the internet, so it needs a connection.
- To change the intro text, edit `client/public/codeforge-intro.html` (look for `cf-h1` and `cf-sub`).
- If your `App.tsx` has changed since the latest commit, don't overwrite it. Add the `Intro` import, the `Entry` and `IntroRoute` components, and the `/intro` and `/` routes by hand.
