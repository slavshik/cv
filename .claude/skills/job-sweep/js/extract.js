// Pulls job cards out of a LinkedIn guest results page (or the
// seeMoreJobPostings HTML fragment, which renders as a bare <li> list).
(() => {
  const seen = new Set();
  const out = [];
  document.querySelectorAll("li").forEach(li => {
    const a = li.querySelector("a.base-card__full-link, a.base-search-card__link");
    if (!a) return;
    const url = a.href.split("?")[0];
    if (seen.has(url)) return;
    seen.add(url);
    out.push({
      title: li.querySelector(".base-search-card__title")?.innerText.trim(),
      company: li.querySelector(".base-search-card__subtitle")?.innerText.trim(),
      loc: li.querySelector(".job-search-card__location")?.innerText.trim(),
      date: li.querySelector("time")?.getAttribute("datetime"),
      url
    });
  });
  return JSON.stringify(out);
})()
