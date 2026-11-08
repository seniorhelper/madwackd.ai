# Navigation and information architecture plan (Nov 8, 2026)

Review folder, untracked. Written from the working tree (branch `genie-live`, which tracks `main`) and the sibling notes
(dashboard ladder, free-tools redesign). Zach's brief: "look at navigation, what pages do we need, seems confusing, I want
better nav and better plan; three dashboards: free (and a free producer tools page), Pro dashboard, and the Dream-it dash;
WE MUST MAKE CLEAR: what do you want it to be, what tools do you need in one, make it easy to see; site looks a little
clown-looking, clean up a little, final UX pass."

Prices are quoted from the live /pricing/ page and were not changed. Nothing new is promised; "rolling out" wording is kept
where it already exists.

## 1. Page inventory (every public URL)

Legend: **Keep** as is, **Keep (nav)** gets a primary-nav slot, **Footer** reachable from the footer only, **Merge/Retire**
recommended for Zach (not done in this pass).

| URL | Title (short) | Purpose | Who it is for | Call |
|---|---|---|---|---|
| / | Madwackd Studio: AI video ads and music videos with voice | Home. Genie stage show, Pro Creator Studio demo, AI video hero, TV spots, showcase, music videos, three ways, how it works, tank, FAQ | Everyone | Keep. Three stacked heroes (stage, Pro Studio, AI video) is the main "clown" signal; see section 6 |
| /choose/ (new) | Choose your dashboard | The chooser: three questions, three plain-link answers each, side-by-side table | Anyone who does not yet know which dashboard fits | **Build** (this pass) |
| /creator-studio/ | Free Tools: nine browser tools, no card | **Free dash.** The free producer tools page (dark studio floor) | Looking around, posting from a phone, not spending yet | Keep (nav: Free Tools) |
| /pro-studio/ | Pro Creator Studio | **Pro dash.** Console included with every paid plan, ladder up and down | Creators rendering every week | Keep (nav: Pro Studio) |
| /custom-creator-studio/ | Custom Creator Studio: tell Genie, poof | **Dream-it dash.** Genie page with the Founding Creator offer | Creators who want a studio built around their brand | Keep (nav: Genie) |
| /pricing/ | Pricing | Plans, Three dashboards table, packs, done-for-you, estimator, policy | Buyers | Keep (nav) |
| /producers/ | Hire a video producer | Done-for-you packages, quoted per project | Businesses handing it off | Keep (nav) |
| /studio/ | Studio (app) | Render workspace; `Start for $5` lands here. noindex, robots-disallowed | Signed-in users | Keep (CTA button + footer). Not a nav item: it is the app, not a page to read |
| /dashboard/ | Creator Dashboard (app) | Mixer and editor, Free limits. noindex | Signed-in users | Keep (footer). App shell keeps its own header |
| /vault/ | Video Vault | Proof: real renders and two full music videos | Everyone | Footer (Learn). Home shows the videos; leaves the nav to make room for the dashboards |
| /features/ | Features | Feature list with Launching pills | Evaluators | Footer (Learn). Pills conflict with the no-coming-soon rule, see section 5 |
| /how-it-works/ | How it works | Workflow | Evaluators | Footer (Learn) |
| /voice/ | AI voiceover | Voice options, consent check | Evaluators, SEO | Footer (Learn) |
| /compare/elevenlabs/ | ElevenLabs vs Madwackd | SEO comparison | Searchers | Footer (Learn) |
| /producers-corner/ (+5 guides) | Producer's Corner | Guides | Searchers | Footer (Learn) |
| /launch-pad/ | Launch Pad | "Every tool in one place" plus a free call with Zach | Founders launching a brand | Footer (Company). **Merge candidate**: overlaps the new /choose/ and /pricing/#dashboards; keep for its call CTA until Zach decides |
| /creator-dashboard-demo/ | Custom Creator Dashboard demo | Sample-data dashboard. noindex | Prospects from the Genie page | Keep, no nav. Linked from pricing table and the Genie page |
| /early-access/ | Early access | Invite list form | Legacy | **Retire candidate**: the site now sells a $5 Test Drive and three dashboards; the list form duplicates /support/ and /apply/. Kept in the footer so it is not orphaned |
| /apply/ | Request a quote | Done-for-you intake form | Businesses | Keep, linked from /producers/ |
| /collaborate/ | Collaborators | Pitch form | Partners | Footer (Company) |
| /awards/ | Madwackd Picks | Monthly picks, none announced yet | Creators | Footer (Company) |
| /about/, /our-mission/, /vision/, /trust/, /support/ | Company pages | | | Footer (Company) |
| /terms/, /privacy/, /refunds/, /acceptable-use/, /ai-disclosure/ | Legal | noindex | | Footer (Legal) |
| /owner/, /studio-board/ | Owner console, Studio board (apps) | noindex, own chrome | Zach, Studio tier | Keep, no links from marketing pages |

## 2. Primary nav (6 items, same on every marketing page)

| # | Label | Href | Why |
|---|---|---|---|
| 1 | Dashboards | /choose/ | One click to "What do you want it to be? What tools do you need in one?" |
| 2 | Free Tools | /creator-studio/ | Free dash |
| 3 | Pro Studio | /pro-studio/ | Pro dash |
| 4 | Genie | /custom-creator-studio/ | Dream-it dash |
| 5 | Pricing | /pricing/ | |
| 6 | Producers | /producers/ | Hand it off |
| | 1-800-481-8638 | tel: | unchanged |
| | Start for $5 (button) | /studio/?buy=test_drive | unchanged; this is how people reach the Video Studio |

Removed from the nav: Video Studio (it is the app behind Start for $5; still in the footer) and Video Vault (footer, Learn).
`aria-current="page"` is set on the matching item (Free Tools, Pro Studio, Genie, Pricing, Producers, Dashboards on /choose/).
The guide tour (`guide-z.js`) looks for `data-tour="start|creator-studio|pricing"` and falls back to `a[href]`, so the
`data-tour` markers stay on Free Tools and Pricing; the Start for $5 button carries `data-tour="start"`.

Mobile (390 px): same list in the hamburger, Start for $5 last, 44 px rows.

## 3. Footer groups (brand column + four lists)

- **Dashboards**: Choose your dashboard, Free dash: Free Tools, Pro dash: Pro Creator Studio, Dream-it dash: the Genie,
  Creator Dashboard (mixer), Video Studio
- **Learn**: How it works, Features, Voice, Pricing, Video Vault, Producer's Corner, ElevenLabs vs Madwackd
- **Company**: Human producers, Launch Pad, About, Our mission, Founder's vision, Collaborate, Madwackd Picks, Early access,
  Support, Madwackd Productions
- **Legal**: Terms of Service, Privacy Policy, Credits and refunds, Acceptable use, AI disclosure

Footer headings become `<h2 class="foot-h">` (same small look) so the heading order no longer skips a level.

## 4. /choose/ outline (Choose your dashboard)

Template: the standard marketing page (site.css, dash-ladder.css for the table, guide widget, same CSP). Indexed, in the
sitemap and llms.txt. Schema: WebPage + BreadcrumbList + ItemList of the three dashboards (name, url, description).

1. **Hero**: kicker "Three dashboards". H1 "What do you want it to be?" Sub: "Three dashboards, one studio. Answer three
   quick questions, or jump straight to the one you already know you want." Three quick-jump buttons.
2. **Question 1: What do you want it to be?** Three answer cards, each a plain link:
   a channel I run myself for free (Free dash), a studio I run every week with my numbers in one place (Pro dash),
   a studio built around my brand with a producer behind it (Dream-it dash).
3. **Question 2: What tools do you need in one?** Free: hook writer, script fitter, captions, teleprompter, beat cuts, a
   mixer to try. Pro: everything free plus earnings goal meter, pitch room, publish kit for 8 platforms, mailing list, tip jar
   (0% cut), full mixer and editor by plan. Dream-it: every studio tool set to your brand, a plan the Genie drafts, a human
   producer within one business day.
4. **Question 3: What do you want to spend?** $0, no card (Free). Included with Starter $29, Pro $89 or Studio $299 a month
   (Pro). Founding Creator $99 a month for 12 months, then $299, cancel anytime (Dream-it).
5. **Side by side**: the same compact table as /pricing/#dashboards (price, who, tools, open it).
6. **Still not sure?** Call 1-800-481-8638, ask Producer Z (chat button), or hand it to a human producer. $5 Test Drive link.

No quiz logic, no scoring, no JavaScript beyond the shared site scripts. Every answer is a link.

## 5. Price and claim conflicts for Zach (not changed in this pass)

1. **"Pro dashboard at $99 regular."** Live /pricing/ has Pro at **$89 a month** (900 credits); the only $99 on the site is the
   Founding Creator rate for the Genie studio ($99 for 12 months, then $299). Nav, chooser and footer use the live figures.
   If Pro is meant to be $99, pricing, pro-studio, launch-pad, llms.txt, billing.py and TIERS.md all need the change together.
2. **Guide name.** The chat widget (`guide-widget.js`, `guide-z.js`) greets as "Madi"; so do /features/, /how-it-works/,
   /launch-pad/, /early-access/, /support/, /vault/, the Producer's Corner posts, llms.txt and the home "Three ways" card.
   Home stage, Genie page, pricing and the chooser say **Producer Z**. One `MW_CONFIG.guideName` plus a text pass would unify it.
3. **"Launching" pills on /features/** (Director's notes, Character Lock, Lite export, Rights pack, "Madi") and
   /launch-pad/ "editing and mixing features are still launching" conflict with the no-coming-soon rule; the chat guide is
   live on every page, so "Madi: Launching" is also wrong.
4. **Home "Three ways" card "Madi" links to /pricing/** and says plans from $29/mo; the plan page does not sell a guide.
5. **/early-access/** still offers an invite list while the site sells a $5 Test Drive; recommend retiring or redirecting
   to /choose/.
6. **/launch-pad/** overlaps /choose/ and /pricing/#dashboards; keep for the free-call CTA or merge into /choose/.
7. **Unverified Studio plan bullets** on /pricing/ ("API access", "social feed tools", "Early access to beta tools"), per the
   dashboard-tiers note.
8. **HERO-BRIEF.md** is referenced by the playbook but does not exist in the repo; claims were checked against live pages.
9. **Genie page ladder** says "Starter and Pro plans" and skips Studio (stage files, not edited here).
10. **Vault page nav** was missing Free Tools and Genie (fixed by the shared nav in this pass).

## 6. De-clown pass (site.css, shared components)

What read as clown-like outside the stage: three stacked heroes on the home page, the animated rainbow gradient on hero
highlights, 3 px borders with hard offset shadows on every button, a hero h1 scale up to 6.1 rem, the footer's rainbow
candy logo on every page, and mixed button styles (`btn-lime` is a second pink button).

Done in this pass (CSS only, no stage files):
- Hero highlight gradient is static (pink to violet), no animation; still Poppins 800.
- Buttons: one primary (pink, ink text, 2 px border, 2 px/3 px offset), one outline, `btn-lime` aliased to primary. Press
  states kept. Nav button matches.
- Heading scale capped: h1 max 4.6 rem, h2 max 3 rem, page-hero h1 max 4 rem. Section padding 88/64 px.
- Focus: one rule, 3 px cyan-text outline with 2 px offset, on every interactive element including the guide widget.
- Footer: five columns on desktop, two on tablet, one on phone; headings h2 styled small.
- Accessibility (Lighthouse on shared layout): footer heading order, brand link name (visible sr-only text is the name, no
  aria-label), guide widget `Take the tour` button ink-on-pink (5.9:1).
- The animated neon header logo and candy footer logo stay (brand); the footer candy logo is slightly smaller.

Not done (needs Zach): collapsing the home page's two lower heroes into one; that is content, not chrome.

## 7. Execution checklist

- [ ] Shared header/nav and footer on every marketing page (32 pages + 404), aria-current per page
- [ ] /choose/ built, schema, sitemap.xml, llms.txt
- [ ] site.css de-clown + a11y fixes, guide-widget.css contrast
- [ ] 390 px and desktop checks: home, Genie, Free Tools, Pricing, /choose/
- [ ] quality-standards and site-security-check, Lighthouse accessibility on home
- [ ] push to main, live check
