// Pulls the full description off a LinkedIn guest job-view page.
(() => {
  const d = document.querySelector(".description__text, .show-more-less-html__markup, .core-section-container__content");
  const crit = [...document.querySelectorAll(".description__job-criteria-item")]
    .map(e => e.innerText.replace(/\s+/g, " ").trim());
  return JSON.stringify({
    title: document.querySelector("h1")?.innerText.trim(),
    company: document.querySelector(".topcard__org-name-link, .topcard__flavor")?.innerText.trim(),
    criteria: crit,
    body: (d?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000)
  });
})()
