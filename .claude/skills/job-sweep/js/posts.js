// Pulls hiring posts out of a SIGNED-IN LinkedIn page — the feed, a content
// search, or a single post. This one is not run by browser.go: agent-browser
// is a guest and cannot see any of this. It is evaluated in Alexander's own
// Chrome, by the agent, with him watching. See SKILL.md, "Posts".
//
// Read-only by construction: it queries the DOM and returns JSON. It clicks
// nothing, so it can neither like a post nor follow anybody, and the feed it
// reports is the one he was already looking at.
(() => {
  const seen = new Set();
  const out = [];

  // A post is a container carrying an activity urn. The feed, the content
  // search and a permalink page all render one, under class names that
  // LinkedIn rewrites often — the urn attribute is the stable part.
  document.querySelectorAll("[data-urn], [data-id]").forEach(el => {
    const urn = el.getAttribute("data-urn") || el.getAttribute("data-id") || "";
    const m = urn.match(/urn:li:activity:(\d+)/);
    if (!m) return;
    if (seen.has(m[1])) return;
    seen.add(m[1]);

    const text = (el.innerText || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    // "…see more" means the DOM holds a truncated copy. Say so rather than
    // scoring half a post as if it were the whole one.
    const truncated = /…\s*(see more|more)\b/i.test(text);

    // Author and headline sit in the actor block; every other line of the
    // card is reshared furniture we do not want in the text.
    const actor = el.querySelector(".update-components-actor__title, .feed-shared-actor__title");
    const sub = el.querySelector(".update-components-actor__description, .feed-shared-actor__description");

    // Links out of the post are where the application usually lives.
    const links = [...el.querySelectorAll("a[href]")]
      .map(a => a.href)
      .filter(h => !/linkedin\.com\/(in|company|feed|posts|search|hashtag)\b/.test(h))
      .slice(0, 5);

    out.push({
      author: actor?.innerText.trim().split("\n")[0] || "",
      headline: sub?.innerText.trim().split("\n")[0] || "",
      date: el.querySelector("time")?.getAttribute("datetime") || "",
      text: text.slice(0, 4000),
      truncated,
      links,
      url: "https://www.linkedin.com/feed/update/urn:li:activity:" + m[1] + "/"
    });
  });

  return JSON.stringify(out);
})()
