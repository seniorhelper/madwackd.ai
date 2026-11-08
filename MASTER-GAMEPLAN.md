# madwackd.ai: master gameplan

Living document. One per project in the network. Plain language, no secrets, no margin math (that lives in the private plans). Updated Nov 8, 2026.

## What this site is
Madwackd Studio: an AI video studio with voice and real human producers. Public marketing pages plus the studio apps (`/studio/`, `/studio-board/`, `/dashboard/`, `/creator-studio/`). GitHub Pages, repo `seniorhelper/madwackd.ai`. Forms post to the network lead server. The Studio API runs on Cloud Run.

## Lanes

### 1. Genie launch: the Custom Creator Studio
- Page: `/custom-creator-studio/`. Tell Genie what you dream of; the page itemizes your studio; START puts you on the Founding Creator list; THINK ABOUT IT saves the plan under your email.
- Offer: Founding Creator (beta), $99 a month locked for 12 months, then the regular price ($299), cancel anytime, 14-day money-back, 120 Fast credits a month, 3 Talking Z minutes, one published press release, a Creator Spotlight. Billing terms sit next to the button and are repeated at checkout with a required consent box.
- Done today (Nov 8): page built and staged; three-scene painting-reveal hero (storyboard, a painted frame from Tell Me Why, the sample dashboard); real Producer Z claymation; Built-in resources; FAQ and schema (Product/Offer, FAQPage, breadcrumbs); sitemap and llms.txt entries; "coming soon" removed from every page.
- Next: the `/v2/wish` endpoint (spec in `_review/GENIE-WISHBOX-ENDPOINT.md`) so the plan comes from the model instead of the client-side starter logic; Stripe prices and schedule for `creators_beta`; the producer review queue; founding rate limiter set by Zach on Nov 8: first 100 founding creators or through Nov 22, 2026, whichever comes first (Zach closes it by hand); moving Producer Z rig on the page.

### 2. Pricing
- Live numbers (and the repo, since Nov 8): Free $0; Starter $29 (250 credits); Pro $89 (900 credits); Studio $299 (2,880 credits); packs $14 / $63 / $115 / $515; Test Drive $5.
- Founding Creator $99 (beta) and Genie Production Team $499 live on the Genie page; the $499 rung is a hidden catalog item until Zach lists it.
- Rule: one source of truth. When a price changes, change `/pricing/`, the home ladder, `/creator-studio/`, the Genie page, `billing.py` and the guide knowledge in the same push.

### 3. SEO, AIO and agent readiness
- Every public page: unique title and description, one H1, canonical, Open Graph, JSON-LD that matches the visible page, `sitemap.xml`, `llms.txt` and `llms-full.txt` kept current, `robots.txt` open to AI crawlers for public pages and closed for app screens.
- Claims policy: only what is true today; "rolling out" for anything being wired; no vendor or model names on marketing pages; results language always carries "results vary".
- Next: refresh `llms-full.txt` with the Genie page's questions and answers; add the Genie page to the Producer Z guide's page list; Search Console check after launch.

### 4. Quality gates before any push
- `quality-standards` and `site-security-check` (0 blockers), Lighthouse mobile 95+ performance and 100 accessibility/best practices/SEO where the shared layout allows, 360 and 390 px checks, no console errors, every link resolves, forms post to the lead server with honeypot and timer.
- Known shared-layout accessibility items (footer heading order, brand link name, Producer Z bubble button contrast) are tracked here until fixed in `site.css` and the widget.

## What was done today (Nov 8, 2026)
- Creators Dashboard product plan and hero brief written; market check done (no competitor sells an intake-personalized creator studio at $99).
- Genie page built, reviewed and ported onto `main` as branch `genie-live`; launch waits for Zach's go in the build session.
- Pricing working copy aligned with the live site; "coming soon" removed everywhere; footer links to the new page on every page.

## Next steps (in order)
1. Zach approves the screenshots and the push; verify live (200, hero plays, wish box posts, no console errors).
2. Lead server email fix (DNS + v2 `send.php`) so Genie leads alert by email.
3. Stripe: `creators_beta` price and 12-month schedule, consent text, portal cancel; then swap the START success copy to a direct checkout.
4. `/v2/wish` endpoint; moving Producer Z rig; MASTER-GAMEPLAN kept current after each push.
