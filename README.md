# Naxshin — نەخشین · Print & Design

Kurdish print-on-demand shop. Static site on GitHub Pages + Firebase (Auth + Firestore).

```
index.html              page markup (no inline scripts)
firestore.rules         Firestore security rules — paste into the Firebase Console
manifest.webmanifest    install-as-app settings
sw.js                   offline helper (network first, cache only when offline)
assets/app.css          design (soft-glass, light + automatic dark mode, RTL)
assets/js/*.js          app code (main, shop, account, dashboard, ui, i18n, …)
assets/img/*            logo mark and app icons
assets/vendor/qrcode.js QR code maker for two-step sign-in (MIT, Kazuhiko Arase)
```

## Deploying this version (order matters)

1. **Upload the files** to the `main` branch (replace `index.html`, add the rest).
   **Delete `index.secure.html`** — it's an old copy that is still publicly reachable.
2. Wait for the GitHub Action to finish (green tick on the commit).
3. **Right after**, open Firebase Console → Firestore Database → **Rules**, replace everything
   with the contents of `firestore.rules`, and press **Publish**.
   (New code works with the old rules for a few minutes, but the old code does not work with the new rules.)
4. Sign in as the admin and open **Dashboard → Users** once. This builds the public
   designer list that the Designers page now uses.
5. While you're on that page, check that nobody you don't recognise has the **Admin** role —
   the old rules let any signed-in person give themselves that role.

## Quick checks in the Rules Playground (Firestore → Rules → Rules Playground)

| Simulate | Path | Signed in as | Expected |
|---|---|---|---|
| update, data `{"role":"admin"}` | `users/<your uid>` | a normal customer (same uid) | **Denied** |
| get | `products/<a pending product id>` | not signed in | **Denied** |
| get | `products/<an active product id>` | not signed in | Allowed |
| get | `designers/<any id>` | not signed in | Allowed |
| update, data `{"role":"designer","status":"active"}` | `users/<someone>` | the admin | Allowed |

## What changed in the data

- New sign-ups are always `role: "customer"`; a partner request is saved as `requestedRole` + `status: "pending"`
  and an admin approves it under **Dashboard → Requests**. Old pending records still show up there.
- `designers/{uid}` — new public collection (name, bio, photo only) for the Designers page.
- Orders now store `designerIds` (so designers see only their own sales) and `totalIQD`
  (the exact amount the customer saw). Older orders still display.
- Ratings use one document per person per designer (`<designerId>_<raterId>`). Older duplicates are merged.
- Cart is stored as product ids only (the old cart stored whole photos and could fill the browser storage).

## Good to know

- Two-step sign-in is a lock in the app, not something the Firebase servers enforce.
- Prices are checked against the product when the admin views an order (⚠ icon on mismatches).
- Product photos are stored inside Firestore documents (1 MB limit each). The upload form shrinks photos
  and refuses a product that would be too large.

## Testing locally

Open `http://localhost:<port>/?emulator` to use the Firebase emulators
(Auth on 127.0.0.1:9099, Firestore on 127.0.0.1:8080) instead of the live project.
