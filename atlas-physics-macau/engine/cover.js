// A chapter opens like a book from its card on the contents page, and closes back into it (the brand link or the
// browser's Back): the book zooms between the card's place and its own while its cover swings about the spine, and
// the contents page zooms with it, in one movement. Both run as the view transition between the two pages. The cover
// is the browser's picture of the card itself; opening, the chapter's live pages are its inside, closing, their pictures.
// On both pages, a classic script in <head>, so it is listening before the first frame.
(() => {
  const html = document.documentElement, $ = id => document.getElementById(id);
  const wide = () => !matchMedia('(max-width: 900px), (max-height: 520px), (prefers-reduced-motion: reduce)').matches;
  const path = url => new URL(url, location).pathname;
  const T = { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }, P = 'perspective(2600px)';
  const vt = (part, frames, t = T) => html.animate(frames, { ...t, pseudoElement: `::view-transition-${part}` });
  // the card c and the open book's right page r. Shut, the book is the card: its spine (q, open) on the card's left
  // edge (k), the pages scaled by s about it. Both pages and the contents page scale linearly in the eased time, so
  // the card stays under the book all the way.
  function geo(c, r) {
    const s = c.height / r.height, k = [c.left, c.top + c.height / 2], q = [r.left, r.top + r.height / 2];
    return { s, k, q, w: c.width / s,
      shut: `translate(${k[0] - q[0]}px, ${k[1] - q[1]}px) scale(${s})`, open: 'translate(0px, 0px) scale(1)',
      cover: [`translate(0px, 0px) scale(1) ${P} rotateY(0deg)`, `translate(${q[0] - k[0]}px, ${q[1] - k[1]}px) scale(${1 / s}) ${P} rotateY(-180deg)`],
      zoomed: `translate(${q[0] - k[0] / s}px, ${q[1] - k[1] / s}px) scale(${1 / s})` };
  }

  if (!document.currentScript.hasAttribute('data-contents')) {   // a chapter
    addEventListener('pagereveal', e => {
      const opening = sessionStorage.opening === location.pathname; delete sessionStorage.opening;
      const t = e.viewTransition;
      if (!opening || !t || !wide()) return;
      const book = $('book'), right = $('right'), r = right.getBoundingClientRect(), g = geo(JSON.parse(sessionStorage.card), r);
      const b = book.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
      const dx = g.k[0] - bx - g.s * (g.q[0] - bx), dy = g.k[1] - by - g.s * (g.q[1] - by);
      html.classList.add('book-vt'); book.style.viewTransitionName = 'book';
      // shut, the right page is cut to the card's width; it widens as the book opens
      const anims = [
        book.animate([{ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${g.s})`, clipPath: `inset(-50px ${book.offsetWidth - right.offsetLeft - g.w}px -50px -50px)` },
                      { transform: 'translate(-50%, -50%) scale(1)', clipPath: 'inset(-50px)' }], T),
        $('left').animate([{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }], T)];
      anims.forEach(a => a.pause());
      t.ready.then(() => {
        anims.push(vt('old(cover)', [{ transform: g.cover[0] }, { transform: g.cover[1] }]),
                   vt('old(root)', [{ transform: 'none' }, { transform: g.zoomed }]),
                   vt('new(root)', [{ opacity: 0 }, { opacity: 0, offset: .3 }, { opacity: 1, offset: .75 }, { opacity: 1 }], { ...T, easing: 'linear' }));   // the chapter around the book, as it lands
        anims.forEach(a => a.pause());
      });
      anims[0].finished.then(() => { anims.slice(0, 2).forEach(a => a.cancel()); dispatchEvent(new Event('resize')); });   // the book's own (the transition ends with its); the figure re-reads where it is
      t.finished.finally(() => { html.classList.remove('book-vt'); book.style.viewTransitionName = ''; });
      // shut on the card until the pages are drawn (at most a moment), so it opens onto them. Once: playing a
      // finished animation would run it again.
      let go = () => { go = () => {}; t.ready.then(() => anims.forEach(a => a.play())); };
      addEventListener('bookready', () => go(), { once: true }); setTimeout(() => go(), 1500);
    });
    // leaving for the contents page: the pages go as pictures, for it to shut into the card
    addEventListener('pageswap', e => {
      const to = e.activation?.entry.url;
      if (!e.viewTransition || !to || path(to) !== path('../') || !wide()) return;
      $('left').style.viewTransitionName = 'left'; $('right').style.viewTransitionName = 'right';
      sessionStorage.closing = JSON.stringify({ p: location.pathname, r: $('right').getBoundingClientRect() });
    });
    addEventListener('pageshow', () => $('left').style.viewTransitionName = $('right').style.viewTransitionName = '');
    // come from the contents page, the brand link goes back to it: where it was scrolled to, and from the cache
    addEventListener('click', e => {
      const a = e.target.closest?.('a.brand');
      if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || window.navigation?.entries()[navigation.currentEntry.index - 1]?.url !== a.href) return;
      e.preventDefault(); history.back();
    });
    return;
  }

  // the contents page: leave the card's place for the chapter, and the card itself as the cover
  let opened;
  addEventListener('click', e => {
    const a = e.target.closest?.('a.card');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    a.style.transition = a.style.transform = 'none';   // off its hover tilt, so the book sits exactly on it
    sessionStorage.card = JSON.stringify(a.getBoundingClientRect()); sessionStorage.opening = path(a.href); opened = a;
  });
  addEventListener('pageswap', e => e.viewTransition && opened && wide() && (opened.style.viewTransitionName = 'cover'));
  addEventListener('pagereveal', e => {
    const cards = [...document.querySelectorAll('a.card')];
    cards.forEach(a => a.style.transition = a.style.transform = a.style.viewTransitionName = ''); opened = null;
    const shut = sessionStorage.closing && JSON.parse(sessionStorage.closing); delete sessionStorage.closing;
    const a = shut && cards.find(a => path(a.href) === shut.p), t = e.viewTransition;
    if (!a || !t || !wide()) return;
    if (a.getBoundingClientRect().top < 0 || a.getBoundingClientRect().bottom > innerHeight) a.scrollIntoView({ block: 'center' });
    const g = geo(a.getBoundingClientRect(), shut.r);
    html.classList.add('book-vt'); a.style.viewTransitionName = 'cover';
    // the left page swings shut over the right, its back the card; both shrink into the card's place
    t.ready.then(() => {
      vt('old(left)', [{ transform: `${g.open} ${P} rotateY(0deg)` }, { transform: `${g.shut} ${P} rotateY(180deg)` }]);
      vt('old(right)', [{ transform: g.open, clipPath: 'inset(0px 0px 0px 0px)' }, { transform: g.shut, clipPath: `inset(0px ${shut.r.width - g.w}px 0px 0px)` }]);
      vt('new(cover)', [{ transform: g.cover[1] }, { transform: g.cover[0] }]);
      vt('new(root)', [{ transform: g.zoomed, opacity: 0 }, { transform: 'none', opacity: 1 }]);
      vt('old(root)', [{ opacity: 1 }, { opacity: 0 }]);
    });
    t.finished.finally(() => { html.classList.remove('book-vt'); a.style.viewTransitionName = ''; });
  });
})();
