# Atlas of Physics

An interactive textbook. Each chapter is one simple motion drawn in 3D like a textbook diagram
(paper solids, ink edges, one lit thing). No apparatus: only the
moving object, its vectors, axes and graphs. Scroll turns the pages and moves the camera; hover
lights a thing; click breaks it down (a vector into components, a graph into slope and area).

```
index.html              contents (chapter cards)
atlas.css               shared tokens (Anatomy light theme)
engine/
  render.js             renderer: paper shading + normal/depth ink edges, picking, explode, camera
  parts.js              paper materials, solid arrows, line helpers
kinematics/
  model.js              the physics (a ball thrown up; a projectile): every motion and number
  checks.mjs            invariants of the model — node <chapter>/checks.mjs (every chapter has one)
  world.js              the figure: ball, axis, arrows, strobe, graphs, projectile and shadow
  pages.js              chapter text (after the AP Physics graphic organizers), cameras, breakdowns
  practice.js           AP-style questions per page ({ pageIndex: [{ q, choices, answer, why } | { q, solution }] })
  main.js               scroll → page turn + camera; hover / click / Esc
newton/ circular/ energy/ momentum/ oscillations/ rotation/ fluids/
                        AP Physics 1 + Physics C: Mechanics, chapters 2–8 (Physics C pages tagged in their kicker)
electrostatics/ gauss/ potential/ capacitors/ circuits/ magnetism/ induction/
                        AP Physics C E&M, chapters 9–15
                        every chapter: model, checks, world, pages, main, index.html
engine/book.js          the shared book: scroll → page turn + camera, hover / click / tap, labels,
                        practice, deep links (<chapter>/#<page index>), pager on small screens
engine/xrefs.js         "Compare" analogies between chapters, shown on both pages
equations/              the AP equation sheets, each equation linked to the pages that show it
tools/shoot.mjs         headless screenshots of every page and a few opened parts
tools/uitest.mjs        one page by deep link: practice, compare links, overflow (any viewport, touch)
tools/taptest.mjs       phone viewport: a tap opens a breakdown
tools/perf.mjs          per-chapter load time, fps, script and layout cost
tools/allpages.mjs      every page by deep link: practice present, no console errors
tools/dumptext.mjs      the rendered text of every page of a chapter, for proofreading
tools/prof.mjs          CPU profile of one chapter; tools/loadprof.mjs the same for page load
tools/picktest.mjs      hover near a moving part, then click: does it open?
tools/scrolltest.mjs    scroll an overflowing left page to the bottom and screenshot it
```

Tools need `npm install` (puppeteer-core) and Chrome (set `CHROME` to its path if not at the macOS default). Screenshots: `CHAPTER=newton PARTS=rest:0,car:5 node tools/shoot.mjs shots/newton` (PARTS = key or key:page)

Run: `python3 -m http.server 8137` (any static server; three.js loads from jsDelivr) and open http://127.0.0.1:8137/
Keys: ← → turn pages, Esc puts a part back. Links: `newton/#4` opens page 2.4.
Phones and tablets: the figure stacks over the text, swipes snap to whole pages, a tap breaks a part down;
resolution steps down by itself if frames run slow.

AP® is a trademark of the College Board, which does not endorse this site. The equation sheet follows the published AP Physics equation tables.

MIT licensed.
