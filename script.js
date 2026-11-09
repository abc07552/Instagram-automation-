/* Bloom: a dependency-free, browser-local Instagram planning workspace. */
(() => {
  "use strict";

  const paths = {
    flower:
      '<path d="M12 12c-8-1-7-8-3-8 3 0 3 5 3 8Zm0 0c1-8 8-7 8-3 0 3-5 3-8 3Zm0 0c8 1 7 8 3 8-3 0-3-5-3-8Zm0 0c-1 8-8 7-8 3 0-3 5-3 8-3Z"/><circle cx="12" cy="12" r="2"/>',
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2M8 18h2"/>',
    sparkles:
      '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3ZM20 2v4m-2-2h4M4 18v4m-2-2h4"/>',
    chart: '<path d="M3 3v18h18M7 16v-5m5 5V6m5 10v-8"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    settings:
      '<path d="m10 3-.8 3-2 .9-2.7-.8-2 3.4 2.2 2v2.3l-2.2 2 2 3.4 2.8-.7 2 .9.7 2.6h4l.8-2.6 2-.9 2.7.7 2-3.4-2.2-2v-2.3l2.2-2-2-3.4-2.8.8-2-.9L14 3Z"/><circle cx="12" cy="12" r="3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-right": '<path d="m9 6 6 6-6 6"/>',
    "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
    "arrow-right": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    "arrow-up": '<path d="M12 20V4m-6 6 6-6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    pointer: '<path d="m3 3 7 18 3-8 8-3L3 3Zm10 10 6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5h4"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
    layers:
      '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    zap: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
    bookmark: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    "check-check": '<path d="m2 12 4 4L16 6m-6 10 2 2L22 8"/>',
    search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    lightbulb: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9l-1-2Z"/>',
  };
  const icon = (name, size = 18, extra = "") =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths[name] || paths.sparkles}</svg>`;
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const markup = icon(el.dataset.icon, Number(el.dataset.size) || 19);
    if (el.tagName === "DIV") el.innerHTML = markup;
    else
      el.replaceWith(document.createRange().createContextualFragment(markup));
  });

  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const photo = (name) => `./public/images/${name}.jpg`;
  const safeImage = (value) => {
    if (typeof value !== "string") return photo("cafe");
    if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(value))
      return value;
    const match = value.match(/(?:^|\/)(cafe|coast|coffee)\.jpg$/);
    return photo(match ? match[1] : "cafe");
  };
  const localDate = (days = 1, hour = 18) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const initialPosts = [
    {
      id: 1,
      title: "Little moments, big inspiration ☀️",
      type: "Reel",
      date: localDate(),
      image: photo("cafe"),
      status: "Scheduled",
      caption:
        "Slow mornings, warm coffee, and a little room to create. What’s inspiring you today? #SlowLiving #CreativeLife",
    },
    {
      id: 2,
      title: "A little escape to the coast 🌊",
      type: "Post",
      date: localDate(2, 12),
      image: photo("coast"),
      status: "Scheduled",
      caption:
        "Collecting moments, not things. A little coastal daydream for your feed. #TravelDiaries #CoastalLiving",
    },
    {
      id: 3,
      title: "Behind the scenes of my day",
      type: "Story",
      date: localDate(2, 19),
      image: photo("coffee"),
      status: "Draft",
      caption:
        "Come along for a little behind-the-scenes of my day. What would you like to see next?",
    },
  ];
  function loadArray(key, fallback, valid) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) && value.every(valid) ? value : fallback;
    } catch {
      return fallback;
    }
  }
  const validPost = (post) =>
    post &&
    typeof post.id === "number" &&
    typeof post.title === "string" &&
    typeof post.caption === "string" &&
    ["Reel", "Post", "Story"].includes(post.type) &&
    ["Draft", "Scheduled"].includes(post.status) &&
    !Number.isNaN(new Date(post.date).getTime());
  const baseIdeas = [
    {
      tag: "REEL IDEA",
      color: "pink",
      title: "Your everyday, but make it cinematic",
      text: "Turn 5 little moments from your day into a slow-living reel.",
      type: "Reel",
      icon: "play",
    },
    {
      tag: "CAROUSEL IDEA",
      color: "purple",
      title: "5 things I wish I knew sooner",
      text: "Share the lessons behind your creative journey.",
      type: "Post",
      icon: "layers",
    },
    {
      tag: "STORY IDEA",
      color: "peach",
      title: "Let your audience choose",
      text: "A this-or-that poll to spark real conversations.",
      type: "Story",
      icon: "zap",
    },
  ];
  const pages = {
    overview: {
      name: "Overview",
      title: "Your creative command center.",
      subtitle: "A clear plan. A little inspiration. More room to create.",
    },
    planner: {
      name: "Content planner",
      title: "Good content. Great timing.",
      subtitle: "A calmer way to plan your stories, reels, and posts.",
    },
    assistant: {
      name: "AI assistant",
      title: "Big ideas start with a little spark.",
      subtitle:
        "Your creative partner for ideas, captions, and a clearer content strategy.",
    },
    analytics: {
      name: "Analytics",
      title: "The story behind your numbers.",
      subtitle:
        "Understand your audience. Find what works. Grow with intention.",
    },
    library: {
      name: "Media library",
      title: "Your next great post starts here.",
      subtitle:
        "A little collection of moments, ready to become something more.",
    },
  };
  const state = {
    page: "overview",
    period: "Last 30 days",
    metric: "Reach",
    filter: "All content",
    search: "",
    posts: loadArray("bloom-posts", initialPosts, validPost).map((post) => ({
      ...post,
      image: safeImage(post.image),
    })),
    savedIdeas: loadArray(
      "bloom-ideas",
      [],
      (value) => typeof value === "string",
    ),
    generatedIdeas: [],
    ideaTopic: "slow living",
    messages: [],
    generating: false,
    form: null,
    modal: null,
    focusBeforeModal: null,
  };
  const $ = (selector) => document.querySelector(selector);
  const content = $("#page-content");
  let toastTimer;

  function notify(message) {
    clearTimeout(toastTimer);
    $("#toast").innerHTML = `${icon("check", 17)}${escape(message)}`;
    $("#toast").hidden = false;
    toastTimer = setTimeout(() => {
      $("#toast").hidden = true;
    }, 3500);
  }
  function store(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      notify("Storage unavailable or full. Your changes could not be saved.");
      return false;
    }
  }
  function savePosts(next) {
    if (!store("bloom-posts", next)) return false;
    state.posts = next;
    return true;
  }
  function dateLabel(value) {
    const date = new Date(value);
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  }
  const factor = () =>
    state.period === "Last 7 days"
      ? 0.29
      : state.period === "Last 90 days"
        ? 2.7
        : 1;
  const sampleLabel = () =>
    '<span class="live-label"><span></span>Sample data</span>';
  const periodSelect = () =>
    `<label class="select-wrap">${icon("calendar", 14)}<select data-change="period" aria-label="Reporting period">${["Last 30 days", "Last 7 days", "Last 90 days"].map((p) => `<option${p === state.period ? " selected" : ""}>${p}</option>`).join("")}</select></label>`;
  const sectionHeading = (title, tools = "") =>
    `<div class="section-top"><h2>${title}</h2><div class="section-tools">${tools}</div></div>`;
  const ideaList = () =>
    state.generatedIdeas.length ? state.generatedIdeas : baseIdeas;
  const allIdeas = () => [...baseIdeas, ...state.generatedIdeas];

  function stats() {
    const data = [
      [
        "Total followers",
        (24893 + (factor() === 2.7 ? 2190 : 0)).toLocaleString(),
        "12.8%",
        "+2,824 new connections",
        "users",
        "peach",
      ],
      [
        "Accounts reached",
        Math.round(128450 * factor()).toLocaleString(),
        "24.6%",
        "More eyes on your story",
        "eye",
        "purple",
      ],
      [
        "Engagement rate",
        "4.8%",
        "1.2%",
        "Real moments. Real connection.",
        "heart",
        "pink",
      ],
      [
        "Profile visits",
        Math.round(3842 * factor()).toLocaleString(),
        "18.3%",
        "A little curiosity goes a long way",
        "pointer",
        "mint",
      ],
    ];
    return `<div class="stats-grid">${data.map(([name, value, change, text, symbol, color]) => `<section class="card stat-card"><div class="stat-label"><span>${name}</span><span class="stat-icon ${color}">${icon(symbol, 17)}</span></div><div class="stat-main"><strong>${value}</strong><span>${icon("arrow-up-right", 13)}${change}</span></div><p>${text}</p></section>`).join("")}</div>`;
  }
  function chart() {
    const reach = [
      11, 15, 13, 19, 17, 18, 14, 23, 19, 17, 25, 21, 20, 30, 24, 27, 21, 29,
      24, 35, 28, 32, 26, 38, 32, 35, 30, 42,
    ];
    const engagement = [
      5, 7, 6, 8, 7, 9, 6, 11, 8, 9, 12, 9, 11, 14, 10, 13, 10, 14, 12, 17, 13,
      16, 12, 18, 15, 17, 14, 20,
    ];
    const current = state.metric === "Reach" ? reach : engagement;
    const previous =
      state.metric === "Reach" ? engagement : engagement.map((x) => x * 0.65);
    const max = state.metric === "Reach" ? 45 : 24;
    const coordinates = (array) =>
      array
        .map((n, i) => `${42 + (i * 588) / 27},${147 - (n / max) * 132}`)
        .join(" ");
    const line = coordinates(current);
    const days = Number(state.period.match(/\d+/)[0]);
    return `<section class="card chart-card"><div class="card-heading"><div><h2>A little progress, every day</h2><p class="card-subtitle">The bigger picture of your growing presence.</p></div><select class="chart-select" data-change="metric" aria-label="Chart metric"><option${state.metric === "Reach" ? " selected" : ""}>Reach</option><option${state.metric === "Engagement" ? " selected" : ""}>Engagement</option></select></div><div class="chart-legend"><span><i></i>${state.metric === "Reach" ? "Accounts reached" : "Engagement"}</span><span><i></i>Previous period</span><strong><span>↗</span> ${state.metric === "Reach" ? "24.6" : "18.2"}%</strong></div><div class="chart"><svg class="performance-chart" viewBox="0 0 650 178" preserveAspectRatio="none" role="img" aria-label="Illustrative ${state.metric.toLowerCase()} trend over the last ${days} days. Current period is above the previous period."><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a38bdf" stop-opacity=".22"/><stop offset="100%" stop-color="#a38bdf" stop-opacity="0"/></linearGradient></defs>${[
      0, 1, 2, 3,
    ]
      .map((i) => {
        const y = 147 - i * 44;
        return `<line x1="42" y1="${y}" x2="630" y2="${y}" stroke="#efedf3" stroke-dasharray="3 3"/><text x="33" y="${y + 3}" text-anchor="end">${Math.round(((i * max) / 3) * factor())}k</text>`;
      })
      .join(
        "",
      )}<polygon points="42,147 ${line} 630,147" fill="url(#chart-fill)"/><polyline points="${coordinates(previous)}" fill="none" stroke="#d5cfdf" stroke-width="1.8" stroke-dasharray="4 4"/><polyline points="${line}" fill="none" stroke="#9580d5" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${[0, 5, 10, 15, 20, 27].map((i) => `<text x="${42 + (i * 588) / 27}" y="171" text-anchor="${i === 0 ? "start" : i === 27 ? "end" : "middle"}">${i === 0 ? `${days} days ago` : i === 27 ? "Today" : `${Math.round(days - (i * days) / 27)}d ago`}</text>`).join("")}</svg></div></section>`;
  }
  function postPreview(post) {
    return `<button class="post-preview" data-edit="${post.id}"><div class="post-thumbnail"><img src="${escape(safeImage(post.image))}" alt="${escape(post.title)}"/><span class="format-badge">${icon(post.type === "Reel" ? "play" : post.type === "Story" ? "clock" : "layers", 10)}${post.type}</span><span class="thumbnail-status ${post.status === "Draft" ? "is-draft" : ""}"><span></span>${post.status}</span></div><strong>${escape(post.title)}</strong><span class="post-time">${icon("clock", 11)}${escape(dateLabel(post.date))}</span></button>`;
  }
  function bookmark(idea) {
    const saved = state.savedIdeas.includes(idea.title);
    return `<button class="icon-button ${saved ? "saved" : ""}" data-save-idea="${escape(idea.title)}" aria-label="Save idea" aria-pressed="${saved}">${icon("bookmark", 17, saved ? 'style="fill:currentColor"' : "")}</button>`;
  }
  function overview() {
    return `<div class="dashboard-intro">
      <section class="studio-hero" aria-label="Creative studio">
        <div class="hero-copy"><span class="hero-kicker">A LITTLE FOCUS. A LOT OF POSSIBILITY.</span>
          <h2>Good things<br/>are <em>growing.</em></h2>
          <p>Turn your everyday inspiration into a feed that feels like you. Your next chapter starts with one idea.</p>
          <button class="button hero-button" data-page="planner">Plan something great ${icon("arrow-up-right", 17)}</button>
          <span class="hero-footnote">${icon("check-check", 14)} Your drafts. Your pace. Your creative space.</span>
        </div>
        <div class="hero-art" aria-hidden="true"><div class="hero-orbit"></div><span class="hero-star">✳</span>
          <div class="hero-photo back"><img src="${photo("coast")}" alt=""/><span>A little escape ↗</span></div>
          <div class="hero-photo front"><img src="${photo("cafe")}" alt=""/><span>Small moments. Big ideas.</span></div>
          <div class="hero-note">${icon("sparkles", 16)} Made for your next big idea</div>
        </div>
      </section>
      <section class="card studio-pulse" aria-labelledby="studio-pulse-title">
        <div class="pulse-heading"><span class="pulse-icon">${icon("zap", 19)}</span><span class="mini-label">YOUR WORKSPACE</span></div>
        <h2 id="studio-pulse-title">A little more in flow.</h2><p class="pulse-subtitle">From first spark to ready-to-share.</p>
        <div class="pulse-row"><span>Content in your planner</span><strong>${state.posts.length.toString().padStart(2, "0")}</strong></div>
        <div class="pulse-row"><span>Drafts to come back to</span><strong>${state.posts
          .filter((p) => p.status === "Draft")
          .length.toString()
          .padStart(2, "0")}</strong></div>
        <div class="pulse-row"><span>Ideas you’ve saved</span><strong>${state.savedIdeas.length.toString().padStart(2, "0")}</strong></div>
        <button class="pulse-link" data-page="assistant">Find your next spark ${icon("arrow-right", 16)}</button>
      </section>
    </div>
    <div id="dashboard-connection">${dashboardConnection()}</div>
      ${sectionHeading(`Performance overview ${sampleLabel()}`, `<span class="compare-label">vs. previous period</span>${periodSelect()}`)}${stats()}
      <div class="middle-grid">${chart()}<section class="card assistant-card"><div class="assistant-label"><span class="purple-icon">${icon("sparkles", 18)}</span><h2>A little guidance, just for you</h2></div><p class="card-subtitle">Small shifts. Meaningful growth.</p><div class="advice-item"><span class="advice-icon mint">${icon("clock", 17)}</span><div><strong>Sample insight: an evening crowd</strong><p>Try posting between <b>6 PM – 8 PM</b><br/>for a little extra love.</p></div></div><div class="advice-item"><span class="advice-icon peach">${icon("play", 17)}</span><div><strong>Sample insight: more reels, more discovery</strong><p>In this demo, reels bring <b>68% of reach.</b><br/>Keep those little stories coming.</p></div></div><div class="assistant-foot"><span><span class="tiny-dot"></span>Illustrative insights · not live</span><button data-ask="Give me a deep performance analysis">Ask AI ${icon("arrow-up-right", 14)}</button></div></section></div>
      <div class="bottom-grid"><section class="card upcoming"><div class="card-heading"><div><h2>Good things on the way <span class="count">${state.posts.length}</span></h2><p class="card-subtitle">Your content, right on time.</p></div><button class="text-link" data-page="planner">View planner ${icon("arrow-right", 14)}</button></div><div class="upcoming-posts">${state.posts.slice(0, 3).map(postPreview).join("") || '<p class="card-subtitle">A little space for your next idea. Create your first post.</p>'}</div><div class="local-note">${icon("check-check", 13)}Your creativity. A little more organized.<span>Local schedule · auto-publishing not connected</span></div></section>
      <section class="card idea-card"><div class="card-heading"><div><h2>A spark for your next post ${icon("sparkles", 15, 'class="purple-text"')}</h2><p class="card-subtitle">Fresh ideas, made to feel like you.</p></div><button class="icon-button" data-page="assistant" aria-label="More ideas">${icon("arrow-up-right")}</button></div>${baseIdeas
        .slice(0, 2)
        .map(
          (idea) =>
            `<div class="compact-idea"><div class="idea-icon ${idea.color}">${icon(idea.icon, 19)}</div><button class="idea-title-button" data-create-idea="${escape(idea.title)}"><span class="idea-tag ${idea.color}">${idea.tag}</span><strong>${escape(idea.title)}</strong></button>${bookmark(idea)}</div>`,
        )
        .join(
          "",
        )}<button class="all-ideas" data-page="assistant">Find a little more inspiration ${icon("arrow-right", 14)}</button></section></div>
      <footer class="page-footer"><span>${icon("flower", 14)}A little more you. A little less to do.</span><span>Made for your next chapter.</span></footer>`;
  }
  function postCard(post) {
    return `<article class="planner-post"><div class="planner-image"><img src="${escape(safeImage(post.image))}" alt="${escape(post.title)}"/><span class="format-badge">${icon(post.type === "Reel" ? "play" : post.type === "Story" ? "clock" : "image", 12)}${post.type}</span></div><div class="planner-post-body"><span class="status ${post.status === "Draft" ? "draft" : ""}"><span></span>${post.status}</span><h3>${escape(post.title)}</h3><p>${escape(post.caption)}</p><div class="post-date">${icon("calendar", 14)}${escape(dateLabel(post.date))}</div><div class="post-actions"><button class="button secondary" data-edit="${post.id}">Edit content</button><button class="text-link danger" data-remove="${post.id}">Remove</button></div></div></article>`;
  }
  function plannerCards() {
    const posts = state.posts.filter(
      (post) =>
        (state.filter === "All content" ||
          post.type === state.filter ||
          post.status === state.filter) &&
        `${post.title} ${post.caption}`
          .toLowerCase()
          .includes(state.search.toLowerCase()),
    );
    return `${posts.map(postCard).join("")}${!posts.length && state.search ? '<p class="empty-search">No content matches your search. Try a different word or filter.</p>' : ""}<button class="add-post" data-action="new-post"><span>${icon("plus", 25)}</span><strong>Make room for a new idea</strong><p>Create your next post, reel, or story</p></button>`;
  }
  function planner() {
    return `<div class="planner-note">${icon("calendar", 20)}<div><strong>Your plan, all in one place.</strong><p>Drafts and schedules are saved in this browser. Connect your account below; automatic publishing is not enabled yet.</p></div><button class="button secondary" data-modal="account">Connect account ${icon("arrow-up-right", 14)}</button></div><section class="card planner-card"><div class="planner-toolbar"><div class="tabs" aria-label="Filter content">${["All content", "Reel", "Post", "Story", "Draft"].map((t) => `<button class="${state.filter === t ? "selected" : ""}" data-filter="${t}" aria-pressed="${state.filter === t}">${t}</button>`).join("")}</div><label class="search-input">${icon("search", 16)}<input type="search" aria-label="Search your content" placeholder="Search your content" id="content-search" value="${escape(state.search)}"/></label></div><div class="planner-grid" id="planner-grid">${plannerCards()}</div></section>`;
  }
  function chatMessages() {
    const welcome = `<div class="chat-welcome">${icon("sparkles", 36)}<h2>What shall we create today?</h2><p>Let’s turn a blank page into something that feels like you.</p><div class="prompt-options">${["Plan a week of content", "Analyze my performance", "Write a slow-living reel caption", "Suggest engaging story ideas"].map((text) => `<button data-ask="${escape(text)}">${escape(text)}${icon("arrow-up-right", 14)}</button>`).join("")}</div></div>`;
    return (
      (state.messages.length
        ? state.messages
            .map(
              (m) =>
                `<div class="message ${m.role}"><span class="message-avatar">${m.role === "assistant" ? icon("flower", 18) : "CR"}</span><div><strong>${m.role === "assistant" ? "Bloom assistant" : "You"}</strong><p>${escape(m.text)}</p></div></div>`,
            )
            .join("")
        : welcome) +
      (state.generating
        ? `<div class="thinking" role="status">${icon("sparkles", 16)}Connecting the creative dots…</div>`
        : "")
    );
  }
  function generatedIdeas() {
    return ideaList()
      .map(
        (idea) =>
          `<div class="generated-idea"><span class="idea-tag ${idea.color}">${idea.tag}</span><h3>${escape(idea.title)}</h3><p>${escape(idea.text)}</p><div><button class="text-link" data-create-idea="${escape(idea.title)}">Create this ${icon("arrow-right", 13)}</button>${bookmark(idea)}</div></div>`,
      )
      .join("");
  }
  function assistant() {
    return `<div class="ai-workspace"><section class="card chat-card"><div class="chat-heading"><div class="banner-icon">${icon("sparkles", 24)}</div><div><h2>Meet your creative sidekick</h2><p class="card-subtitle">A fresh perspective, whenever you need one.</p></div><span class="ai-chip">BLOOM AI</span></div><div class="chat-messages" id="chat-messages" aria-live="polite" aria-relevant="additions">${chatMessages()}</div><form class="chat-input" id="chat-form"><input name="prompt" maxlength="1000" required aria-label="Message assistant" placeholder="Ask for an idea, a caption, a little direction…"/><button class="button primary" aria-label="Send message" ${state.generating ? "disabled" : ""}>${icon("arrow-up", 19)}</button></form><div class="ai-disclaimer">Local idea templates · suggestions use sample data, not a connected AI model.</div></section><section class="card idea-generator"><span class="purple-icon">${icon("lightbulb", 20)}</span><h2>Find your next spark</h2><p class="card-subtitle">A few fresh ideas around what you love.</p><form id="ideas-form"><label class="field-label" for="idea-topic">What’s your content about?</label><input class="form-input" id="idea-topic" name="topic" required maxlength="100" value="${escape(state.ideaTopic)}" placeholder="e.g. travel, food, slow living"/><button class="button primary full">${icon("sparkles", 16)}Generate ideas</button></form><div class="generated-ideas" id="generated-ideas">${generatedIdeas()}</div></section></div>`;
  }
  function analytics() {
    return `${sectionHeading(`Your performance, in perspective ${sampleLabel()}`, `${periodSelect()}<button class="button secondary" data-action="export">${icon("download", 15)}Export report</button>`)}${stats()}${chart()}<div class="report-grid"><section class="card report-card"><span class="purple-icon">${icon("sparkles", 22)}</span><h2>Your growth, a little deeper</h2><p class="card-subtitle">A thoughtful read on the last ${state.period.match(/\d+/)[0]} days of demo activity.</p><h3>01 / What’s working</h3><p>Short-form storytelling leads discovery: reels account for 68% of sample reach. Your relatable, everyday content gives new people a reason to stay.</p><h3>02 / Where there’s room to grow</h3><p>Reach is growing faster than profile visits. Make your next step clear with a relevant call to action, and keep your bio aligned with your latest content.</p><h3>03 / Your next experiment</h3><p>Post three 15-second reels between 6–8 PM. Use a clear hook and one question. Compare saves, shares, and follows per 1,000 views after seven days.</p><div class="report-disclaimer">Illustrative analysis only. Live reporting requires an Instagram professional account and approved API access.</div></section><section class="card report-card"><h2>A healthier content mix</h2><p class="card-subtitle">Where your sample reach comes from</p>${[
      ["Reels", 68, "#9480db"],
      ["Posts", 24, "#f4ac88"],
      ["Stories", 8, "#8ec7b4"],
    ]
      .map(
        ([name, value, color]) =>
          `<div class="mix-row"><div><strong>${name}</strong><span>${value}%</span></div><div class="mix-track"><span style="width:${value}%;background:${color}"></span></div></div>`,
      )
      .join(
        "",
      )}<div class="report-tip">${icon("lightbulb", 20)}<p><strong>Don’t leave stories behind.</strong><br/>They’re a great place to nurture your existing community, even when their reach is smaller.</p></div><button class="button secondary full" data-ask="Plan my content based on my performance">Turn insights into a plan ${icon("arrow-right", 16)}</button></section></div>`;
  }
  function library() {
    const media = [
      ["cafe", "Slow mornings.jpg"],
      ["coast", "Coastal daydream.jpg"],
      ["coffee", "Everyday moments.jpg"],
    ];
    return `${sectionHeading('Your little collection <span class="count">3</span>', `<label class="button secondary upload-button">${icon("plus", 16)}Upload media<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="new" hidden/></label>`)}<div class="media-grid">${media.map(([image, name]) => `<section class="card media-card"><img src="${photo(image)}" alt="${name}"/><div><h3>${name}</h3><button class="text-link" data-media="${image}" data-media-title="${name.replace(".jpg", "")}">Create a post ${icon("arrow-up-right", 14)}</button></div></section>`).join("")}</div><section class="saved-section"><h2>Your saved sparks ${icon("bookmark")}</h2>${state.savedIdeas.length ? state.savedIdeas.map((title) => `<div class="card saved-idea">${icon("sparkles", 20)}<strong>${escape(title)}</strong><button class="text-link" data-create-idea="${escape(title)}">Bring it to life ${icon("arrow-right", 14)}</button></div>`).join("") : '<p class="card-subtitle">Save an idea from the assistant to find it here.</p>'}</section>`;
  }
  function render() {
    const page = pages[state.page];
    $("#breadcrumb-page").textContent = page.name;
    document.title = `${page.name} · Bloom`;
    document.querySelectorAll("nav [data-page]").forEach((button) => {
      const active = button.dataset.page === state.page;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    const body = { overview, planner, assistant, analytics, library }[
      state.page
    ]();
    content.innerHTML = `<section class="page-heading"><div><div class="eyebrow">YOUR SPACE TO GROW</div><h1>${page.title}${state.page === "overview" ? ' <span class="greeting-spark" aria-hidden="true">✧</span>' : ""}</h1><p>${page.subtitle}</p></div><button class="button primary" data-action="new-post" aria-label="Create content">${icon("plus", 17)}<span>Create content</span></button></section>${body}`;
  }
  function navigate(page) {
    if (!pages[page]) return;
    state.page = page;
    state.search = "";
    $("#sidebar").classList.remove("mobile-open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
    if (location.hash !== `#${page}`) location.hash = page;
    render();
  }

  function newPost(idea = {}) {
    state.form = {
      title: idea.title || "",
      caption: idea.text || "",
      type: idea.type || "Reel",
      date: localDate(),
      image: idea.image || photo("cafe"),
    };
    openModal("post");
  }
  function postForm() {
    const f = state.form;
    return `<div class="eyebrow">MAKE SOMETHING WORTH SHARING</div><h2 id="modal-title">${f.id ? "A little fine-tuning" : "Your next good thing"}</h2><p class="card-subtitle">From a little idea to a moment worth sharing.</p><form id="post-form"><div class="form-columns"><div class="post-form-image"><img id="post-image" src="${escape(safeImage(f.image))}" alt="Content preview"/><label class="button secondary">Change image<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" data-upload="edit"/></label></div><div class="post-fields"><label class="field-label">Content title<input class="form-input" name="title" required maxlength="160" value="${escape(f.title)}" placeholder="Give your idea a name"/></label><label class="field-label">Format<select class="form-input" name="type">${["Reel", "Post", "Story"].map((type) => `<option${f.type === type ? " selected" : ""}>${type}</option>`).join("")}</select></label><label class="field-label">Caption<textarea class="form-input" name="caption" maxlength="2200" rows="4" placeholder="Tell your little story…">${escape(f.caption)}</textarea></label><button type="button" class="text-link purple-text" data-action="caption">${icon("sparkles", 14)}Help me with a caption</button><label class="field-label">Schedule date & time (your local time)<input class="form-input" type="datetime-local" name="date" required value="${escape(f.date)}"/></label></div></div><div class="form-notice">${icon("help", 16)}<span>This saves a local schedule. Nothing will be posted to Instagram without a connected publishing integration. Image previews only; video publishing is not connected.</span></div><div class="modal-actions"><button type="button" class="button secondary" data-action="save-draft">Save as draft</button><button class="button primary">${icon("calendar", 16)}Schedule content</button></div></form>`;
  }
  function informationModal(type) {
    const title = (text) => `<h2 id="modal-title">${text}</h2>`;
    const feature = (name) =>
      `<span class="modal-feature-icon">${icon(name, 28)}</span>`;
    if (type === "account")
      return `${feature("instagram")}${title("Connect your Instagram")}<p class="modal-copy">Sign in securely through Meta. Your Instagram password and access token never belong in this website’s forms.</p><div id="connection-panel"><p class="connection-loading" role="status">Checking backend…</p></div>${connectionHelp()}<p class="connection-policy-links"><a href="./privacy.html" target="_blank" rel="noopener">Privacy policy</a> · <a href="./data-deletion.html" target="_blank" rel="noopener">Data-deletion instructions</a></p>`;
    if (type === "settings")
      return `${feature("settings")}${title("Your workspace, your way")}<p class="modal-copy">Your drafts, schedules, and saved ideas stay in this browser.</p><div class="setting-row"><span>Workspace</span><strong>Creator workspace</strong></div><div class="setting-row"><span>Time zone</span><strong>${escape(Intl.DateTimeFormat().resolvedOptions().timeZone)}</strong></div><div class="setting-row"><span>Publishing</span><span class="status draft">Not enabled</span></div><button class="button secondary full" data-modal="account">Manage Instagram connection ${icon("arrow-up-right", 15)}</button>`;
    if (type === "upgrade")
      return `${feature("flower")}${title("A little more Bloom.")}<p class="modal-copy">This preview gives you room to plan, find inspiration, and explore reports. Paid subscriptions aren’t enabled, and no payment is needed.</p><div class="pro-features">${["Local drafts and schedules", "Content ideas and caption templates", "Downloadable demo activity reports"].map((text) => `<p>${icon("check", 17)}${text}</p>`).join("")}</div><button class="button primary full" data-page="assistant">Find your next spark ${icon("sparkles", 16)}</button>`;
    return `${feature("help")}${title("A little help getting started")}<div class="help-steps"><div><b>01</b><p><strong>Make room for your ideas</strong>Create a reel, post, or story. Upload an image and save a draft.</p></div><div><b>02</b><p><strong>Find your creative rhythm</strong>Use the assistant for content prompts and caption templates.</p></div><div><b>03</b><p><strong>Learn, then grow</strong>Explore sample analytics and export a deeper report. Live analytics and publishing require a separate Meta integration.</p></div></div><button class="button primary full" data-action="new-post">Create your first post ${icon("plus", 16)}</button>`;
  }
  function openModal(type) {
    if (!state.modal) state.focusBeforeModal = document.activeElement;
    state.modal = type;
    $("#notifications").hidden = true;
    $("#notifications-toggle").setAttribute("aria-expanded", "false");
    $("#modal").classList.toggle("post-modal", type === "post");
    $("#modal").innerHTML =
      `<button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon("close", 20)}</button>${type === "post" ? postForm() : informationModal(type)}`;
    $("#modal-overlay").hidden = false;
    document.body.style.overflow = "hidden";
    $(".app").inert = true;
    (type === "post" ? $('#post-form [name="title"]') : $("#modal")).focus();
    if (type === "account") refreshConnection();
  }
  function closeModal() {
    state.modal = null;
    $("#modal-overlay").hidden = true;
    document.body.style.overflow = "";
    $(".app").inert = false;
    if (state.focusBeforeModal?.isConnected) state.focusBeforeModal.focus();
  }
  function commitPost(status) {
    const form = $("#post-form");
    const data = Object.fromEntries(new FormData(form));
    if (!data.title.trim()) {
      form.elements.title.setCustomValidity("Give your content a title.");
      form.elements.title.reportValidity();
      return;
    }
    form.elements.title.setCustomValidity("");
    if (status === "Scheduled" && !form.reportValidity()) return;
    const next = {
      ...state.form,
      ...data,
      title: data.title.trim(),
      status,
      id: state.form.id || Date.now(),
    };
    if (
      !savePosts([...state.posts.filter((post) => post.id !== next.id), next])
    )
      return;
    closeModal();
    render();
    notify(
      status === "Draft"
        ? "Your draft is saved"
        : "Content added to your local schedule",
    );
  }
  async function upload(file, mode) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      notify("Please choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      notify("Please choose an image under 2 MB.");
      return;
    }
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (mode === "edit" && state.modal === "post") {
        state.form.image = data;
        $("#post-image").src = data;
      } else if (mode === "new")
        newPost({
          title: file.name.replace(/\.[^.]+$/, ""),
          type: "Post",
          image: data,
        });
    } catch {
      notify("That image could not be read. Please try another file.");
    }
  }
  function toggleIdea(title) {
    const saved = state.savedIdeas.includes(title);
    const next = saved
      ? state.savedIdeas.filter((value) => value !== title)
      : [...state.savedIdeas, title];
    if (!store("bloom-ideas", next)) return;
    state.savedIdeas = next;
    // Update the controls in place, preserving chat drafts and keyboard focus.
    document.querySelectorAll("[data-save-idea]").forEach((button) => {
      if (button.dataset.saveIdea !== title) return;
      button.classList.toggle("saved", !saved);
      button.setAttribute("aria-pressed", String(!saved));
      button.innerHTML = icon(
        "bookmark",
        17,
        !saved ? 'style="fill:currentColor"' : "",
      );
    });
    notify(saved ? "Idea removed from saved" : "Idea saved to your collection");
  }
  function templateReply(question) {
    if (
      /analy|report|performance/i.test(question) &&
      !/plan|idea/i.test(question)
    )
      return "Here’s a deeper look at your demo activity:\n\n• Discovery: Reels contribute 68% of sample reach. Show the outcome in the first 2 seconds and keep the opening visually clear.\n• Engagement: Your sample engagement rate is 4.8%. Try one genuine question in your caption to invite meaningful replies.\n• Conversion: Sample profile visits are around 3% of reach. This is not a benchmark; test a clear reason to visit your profile.\n• Timing: Test 6–8 PM against your current posting time for 2 weeks. Compare reach after 24 hours.\n• Next experiment: Publish 3 reels and 2 carousels this week. Compare saves and shares per 1,000 views, not just likes.\n\nThese recommendations use illustrative data. No real Instagram activity has been analyzed.";
    if (/week|plan/i.test(question))
      return "Here’s a gentle weekly content rhythm:\n\nMonday · Reel: 5 moments from your morning. Hook: “A little reset for the week.”\nTuesday · Story: A this-or-that poll about your routine.\nWednesday · Carousel: 5 lessons from your creative journey.\nThursday · Story: Answer a community question.\nFriday · Reel: A behind-the-scenes look at your process.\nSaturday · Post: Your favorite moment of the week, with a personal caption.\nSunday · Story: Ask what your audience wants to see next.\n\nTry 6 PM as an experiment, not a guaranteed best time. Review saves, replies, and shares after seven days. Use Create content to add these to your local planner.";
    if (/caption/i.test(question))
      return "A caption to make your own:\n\n“Finding a little inspiration in the ordinary. Slow mornings, small rituals, and the moments I almost forgot to notice. ✨\n\nWhat’s one little thing making your day better?\n\n#SlowLiving #EverydayMoments #CreativeLife”\n\nPair it with a 15-second reel: start with your strongest clip, keep on-screen text readable, and finish with a moment that loops back to the opening. Adjust the details so it feels like you.";
    if (/stor(y|ies)/i.test(question))
      return "Three ways to start a real conversation in stories:\n\n1. This or that: Show two moments from your day and add a poll.\n2. Behind the scenes: Share the messy middle of a project, then reveal the result.\n3. Ask me anything: Invite questions about one specific topic, then answer three with short clips.\n\nKeep each frame focused on one thought. End with a question that is easy to answer, and look at replies and completion rate to learn what resonated.";
    return `A creative direction for “${question}”:\n\n1. Hook: “The little things that changed my everyday.”\n2. Film 5 short clips: a morning ritual, your workspace, a detail you love, a walk, and an evening moment.\n3. Edit as a 15-second reel with warm colors and readable on-screen text.\n4. Caption: “Finding inspiration in the ordinary. What’s one small thing you’re grateful for today?”\n5. Follow with a story poll: “More daily moments or behind the scenes?”\n\nTry scheduling at 6 PM, then compare saves and shares after 48 hours. This is a starting-point template, not a live AI prediction.`;
  }
  function refreshChat() {
    const chat = $("#chat-messages");
    if (!chat) return;
    chat.innerHTML = chatMessages();
    $("#chat-form button").disabled = state.generating;
    chat.scrollTop = chat.scrollHeight;
  }
  function askAssistant(question) {
    question = question.trim().slice(0, 1000);
    if (!question || state.generating) return;
    if (state.page !== "assistant") navigate("assistant");
    state.messages.push({ role: "user", text: question });
    state.generating = true;
    refreshChat();
    setTimeout(() => {
      state.messages.push({ role: "assistant", text: templateReply(question) });
      state.generating = false;
      refreshChat();
    }, 450);
  }
  function generateIdeas(topic) {
    topic = topic.trim();
    if (!topic) return;
    state.ideaTopic = topic;
    state.generatedIdeas = [
      {
        ...baseIdeas[0],
        title: `A day in the world of ${topic}`,
        text: `Film 5 meaningful moments around ${topic} and tell a story in 15 seconds.`,
      },
      {
        ...baseIdeas[1],
        title: `5 things to know about ${topic}`,
        text: `Share your personal tips and lessons about ${topic} in a save-worthy carousel.`,
      },
      {
        ...baseIdeas[2],
        title: `Your ${topic} questions, answered`,
        text: `Invite your community to ask about ${topic} with an interactive question sticker.`,
      },
    ];
    $("#generated-ideas").innerHTML = generatedIdeas();
    notify("Three fresh ideas, ready for you");
  }
  function downloadReport() {
    const report = {
      workspace: "Creator workspace · Sample analytics",
      period: state.period,
      generatedAt: new Date().toISOString(),
      dataSource:
        "Illustrative demo data. No real Instagram activity has been analyzed.",
      metrics: {
        reach: Math.round(128450 * factor()),
        followers: 24893 + (factor() === 2.7 ? 2190 : 0),
        engagementRate: "4.8%",
        profileVisits: Math.round(3842 * factor()),
      },
      analysis: {
        discovery: "Reels account for 68% of sample reach.",
        engagement:
          "Try a genuine caption question and track meaningful replies.",
        conversion:
          "Make the next step clear in the caption and align the profile bio.",
        experiment:
          "Compare three 15-second reels posted at 6–8 PM against your usual time for two weeks.",
        measurement:
          "Compare saves, shares, and follows per 1,000 views after 48 hours. No causal conclusion can be drawn from sample data.",
      },
      localSchedule: state.posts.map(({ image, ...post }) => post),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "bloom-performance-report.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Your report has been downloaded");
  }

  // Same-origin only: the hosted backend serves this interface alongside its API.
  // GitHub Pages stays static and links to the separate secure service.
  let backendConnection = null;
  const connectionErrors = {
    incorrect_owner_password:
      "That Bloom owner password is incorrect. Use ADMIN_PASSWORD from your hosting dashboard, not your Instagram password.",
    owner_login_required: "Your owner session expired. Sign in again.",
    owner_password_not_configured:
      "Set ADMIN_PASSWORD in the hosting dashboard first (at least 16 characters).",
    backend_not_configured:
      "Complete the backend environment settings before starting Meta login.",
    too_many_login_attempts:
      "Too many sign-in attempts. Please wait 15 minutes.",
    start_connection_again:
      "The account selection expired. Start Meta login again.",
    reconnect_required:
      "Meta access has expired or been revoked. Please reconnect.",
    provider_unavailable:
      "Meta could not complete the request. Check your app settings and try again.",
    invalid_request_origin:
      "The service address does not match PUBLIC_BASE_URL in the hosting settings.",
  };
  async function backendRequest(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      ...options,
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error("backend_unavailable");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "backend_unavailable");
    return body;
  }
  let connectionChecked = false;
  function dashboardConnection() {
    const data = backendConnection;
    let title = "Your Instagram, one step closer.";
    let detail =
      "Connect securely to Meta. Planning works now; publishing and live insights are not enabled.";
    let badge = "Not connected";
    if (!connectionChecked) {
      badge = "Checking service";
      detail =
        "Checking the connection service. Your local drafts are always available.";
    } else if (!data?.backend) {
      badge =
        location.protocol === "file:"
          ? "Local workspace"
          : "Service unavailable";
      detail =
        location.protocol === "file:"
          ? "Plan and save drafts here. Open your hosted Bloom backend for secure Instagram sign-in."
          : "The connection service did not respond. A Free host may be waking up. Your local drafts are still available.";
    } else if (!data.authenticated) {
      badge = "Owner locked";
      detail =
        "Unlock owner settings to check your saved connection or start secure Meta sign-in.";
    } else if (data.connected) {
      title = `@${data.account?.username || "creator"} is connected.`;
      badge = "Instagram connected";
      detail =
        "Authorization saved. Analytics remain samples and schedules remain browser-local; publishing is not enabled.";
    } else if (!data.configured) {
      badge = "Setup needed";
      detail =
        "Your backend is reachable. Complete the private hosting settings to enable secure sign-in.";
    } else if (data.reconnectRequired) {
      badge = "Reconnect needed";
      detail =
        "Saved Meta access has expired. Reconnect from your secure owner settings.";
    } else if (data.pending) {
      badge = "Choose an account";
      detail =
        "Meta returned available accounts. Choose one in connection settings to finish.";
    } else {
      badge = "Ready for sign-in";
    }
    return `<section class="channel-strip" aria-label="Instagram connection status"><span class="channel-logo">${icon("instagram", 23)}</span><div class="channel-copy"><div><strong>${escape(title)}</strong><span class="connection-badge ${data?.connected ? "is-connected" : ""}">${escape(badge)}</span></div><p>${escape(detail)}</p></div><button class="button secondary" data-modal="account">${data?.connected ? "Manage connection" : "Connect Instagram"} ${icon("arrow-up-right", 15)}</button></section>`;
  }
  function updateConnectionSummary() {
    const panel = $("#dashboard-connection");
    if (panel) panel.innerHTML = dashboardConnection();
  }
  function connectionHelp() {
    return `<details class="connection-help"><summary>Having trouble with Meta login?</summary><div>
      <h3>“App not active”</h3><p>Check that you use the Facebook profile listed as an app administrator. Compare your Meta dashboard’s Login URL with the app and configuration IDs in your unlocked connection settings. Bloom cannot activate or publish a Meta app.</p>
      <h3>No Instagram accounts available</h3><p>The selected business portfolio must offer your professional account to this login. In Business Settings → Accounts → Instagram accounts, check the portfolio and your Facebook profile’s asset access. Do not remove or transfer an existing account just to retry.</p>
      <h3>“Invalid code for Instagram OpenID Connect”</h3><p>If this appears while adding an account inside Meta Business Settings, that step is handled by Meta—not Bloom. Don’t refresh or reuse that callback URL. If a fresh browser attempt also fails, report it through Meta Business Suite Help &amp; support.</p>
      <p class="form-notice">Never share an authorization-code URL, token, password, or app secret. Start successful sign-in from Bloom so its security state can be verified.</p>
      <a href="https://business.facebook.com/settings/" target="_blank" rel="noopener noreferrer">Open Meta Business Settings ↗</a>
    </div></details>`;
  }
  function connectionPanel(data) {
    const testingNotice =
      data?.storageMode === "ephemeral"
        ? `<div class="connection-explainer testing-notice" role="note"><strong>Free testing mode — temporary storage</strong><p>This service may sleep. Owner sessions and your saved Instagram connection may be lost after sleep, restart, or redeployment. Remember-device sign-in cannot survive loss of this server data. Durable storage requires an external database or a persistent hosting disk. This is not an always-on posting service.</p></div>`
        : "";
    if (!data?.backend && location.protocol !== "file:")
      return `<div class="connection-explainer"><strong>Connection service unavailable</strong><p>The backend may be waking up or this copy may be hosted without one. Wait a moment, then retry. Your drafts are unaffected.</p></div><button class="button secondary full" data-action="connection-retry">Check service again</button><form id="backend-location-form"><label class="field-label">Open your deployed Bloom service<input name="backendUrl" class="form-input" type="url" required placeholder="Your HTTPS backend URL"/></label><button class="button primary full">Open secure connection ${icon("arrow-up-right", 15)}</button></form>`;
    if (!data?.backend)
      return `<div class="connection-explainer"><strong>This copy is running without a backend.</strong><p>GitHub Pages cannot handle secure sign-in. Deploy the included backend, then open its HTTPS service address.</p></div><form id="backend-location-form"><label class="field-label">Your deployed backend URL<input name="backendUrl" class="form-input" type="url" required placeholder="Paste your HTTPS service URL"/></label><button class="button primary full">Open secure connection ${icon("arrow-up-right", 15)}</button></form><p class="form-notice">Use the service URL shown by your hosting provider—not your GitHub Pages URL. Never paste a token or app secret here.</p>`;
    if (!data.authenticated)
      return `${testingNotice}<div class="connection-explainer"><strong>Private owner access</strong><p>Use the Bloom owner password from your hosting dashboard’s ADMIN_PASSWORD setting. This is not your Instagram or Facebook password.</p></div><form id="owner-login-form"><label class="field-label">Bloom owner password<input class="form-input" name="password" type="password" autocomplete="current-password" required maxlength="256"/></label><label class="remember-device"><input type="checkbox" name="rememberDevice"/><span><strong>Remember this device for 30 days</strong><small>Only on a device you trust. Temporary hosting storage can still reset your sign-in.</small></span></label><button class="button primary full">Unlock connection settings ${icon("arrow-right", 15)}</button></form><p class="form-notice">${data.configured ? "Backend is configured. After unlocking, you can continue to Meta’s official login." : "Backend setup is incomplete. Unlock to see the missing settings."}</p>`;
    const sessionNote = data.sessionExpiresAt
      ? `<p class="session-note">This device stays unlocked until ${escape(new Date(data.sessionExpiresAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }))}, unless you lock it, clear cookies, or the server loses its stored session.</p>`
      : "";
    const callback = `${sessionNote}<div class="callback-box"><label class="field-label" for="callback-url">Paste this exact Redirect URL into Meta</label><div><input class="form-input" id="callback-url" readonly value="${escape(data.callbackUrl)}"/><button class="button secondary" data-action="copy-callback">Copy</button></div><p>Under API setup with Unified login → Redirect URL, paste this address and tap Save.</p></div>`;
    if (!data.configured)
      return `${testingNotice}${callback}<div class="connection-explainer"><strong>Finish the private hosting settings</strong><ul>${data.missing.map((name) => `<li>${escape(name)}</li>`).join("")}</ul><p>Add these in the hosting dashboard’s Environment section, then restart or redeploy the service. Do not enter secrets in the website or chat.</p></div><button class="button secondary full" data-action="owner-logout">Lock owner settings</button>`;
    const status = data.connected
      ? `<div class="connection-card"><span class="purple-icon">${icon("instagram", 20)}</span><div><strong>@${escape(data.account.username)}</strong><small>${escape(data.account.name || "Instagram professional account")}</small></div><span class="status">Connected</span></div><p class="modal-copy">Sign-in is connected. Analytics are still sample data and schedules stay local; automatic publishing is not enabled by this backend.</p><div class="connection-actions"><button class="button secondary" data-action="instagram-verify">Verify access</button><button class="button secondary danger" data-action="instagram-disconnect">Disconnect</button></div>`
      : `<p class="modal-copy">${data.reconnectRequired ? "Your saved access has expired. Please reconnect through Meta." : "Save the Redirect URL in Meta first, then continue with your Creator account."}</p>`;
    return `${testingNotice}${callback}${status}<div class="login-identifiers"><span>App ID <code>${escape(data.login?.appId || "Not available")}</code></span><span>Configuration ID <code>${escape(data.login?.configId || "Not available")}</code></span></div><div id="instagram-account-options"></div><button class="button primary full" data-action="instagram-start">${icon("instagram", 17)}${data.connected ? "Reconnect through Meta" : "Continue with Meta"}</button><button class="text-link owner-lock" data-action="owner-logout">Lock owner settings</button><p class="form-notice">Only approve access to accounts you own or manage. The configuration may request messaging or advertising permissions; review Meta’s consent screen before continuing.</p>`;
  }
  async function refreshConnection() {
    try {
      backendConnection =
        location.protocol === "file:"
          ? null
          : await backendRequest("/api/connection");
    } catch {
      backendConnection = null;
    }
    connectionChecked = true;
    updateConnectionSummary();
    if (state.modal !== "account") return;
    $("#connection-panel").innerHTML = connectionPanel(backendConnection);
    if (backendConnection?.pending) {
      try {
        const data = await backendRequest("/api/instagram/accounts");
        if (state.modal !== "account" || !$("#instagram-account-options"))
          return;
        $("#instagram-account-options").innerHTML =
          `<div class="connection-explainer"><strong>Choose the account to connect</strong><p>Meta has authorized the following accounts. Confirm one below.</p>${data.accounts.map((account) => `<button class="button secondary account-option" data-account-id="${escape(account.id)}">@${escape(account.username)} ${icon("arrow-right", 14)}</button>`).join("")}</div>`;
      } catch (error) {
        notify(
          connectionErrors[error.message] ||
            "Start Meta login again to choose an account.",
        );
      }
    }
  }
  let connectionBusy = false;
  async function connectionAction(path, body = {}) {
    if (connectionBusy) return;
    connectionBusy = true;
    try {
      const result = await backendRequest(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await refreshConnection();
      if (path.endsWith("/connect"))
        notify(
          "Instagram connected. Publishing and live reports are not enabled yet.",
        );
      if (path.endsWith("/disconnect"))
        notify(
          result.revoked
            ? "Instagram disconnected and access revoked."
            : "Local token deleted. Also remove the app in Meta’s connected-app settings to revoke remote access.",
        );
    } catch (error) {
      notify(
        connectionErrors[error.message] ||
          "The backend could not complete that request. Please try again.",
      );
    } finally {
      connectionBusy = false;
    }
  }
  async function verifyConnection() {
    try {
      await backendRequest("/api/instagram/verify");
      await refreshConnection();
      notify("Meta confirmed access to your selected Instagram account.");
    } catch (error) {
      notify(
        connectionErrors[error.message] ||
          "Unable to verify access. Try reconnecting through Meta.",
      );
    }
  }

  // Centralized event delegation keeps all generated views dependency-free.
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, [data-modal]");
    if (!target) return;
    if (target.dataset.action === "connection-retry") {
      target.disabled = true;
      target.textContent = "Checking service…";
      refreshConnection();
      return;
    }
    if (target.dataset.action === "instagram-start") {
      location.assign(new URL("/auth/instagram/start", location.href));
      return;
    }
    if (target.dataset.action === "owner-logout") {
      connectionAction("/api/logout");
      return;
    }
    if (target.dataset.action === "instagram-disconnect") {
      connectionAction("/api/instagram/disconnect");
      return;
    }
    if (target.dataset.action === "instagram-verify") {
      verifyConnection();
      return;
    }
    if (target.dataset.action === "copy-callback") {
      const input = $("#callback-url");
      input.focus();
      input.select();
      if (navigator.clipboard)
        navigator.clipboard.writeText(input.value).then(
          () => notify("Callback URL copied"),
          () => notify("Select and copy the highlighted URL"),
        );
      return;
    }
    if (target.dataset.accountId) {
      connectionAction("/api/instagram/connect", {
        accountId: target.dataset.accountId,
      });
      return;
    }
    if (target.dataset.page) {
      if (state.modal) closeModal();
      navigate(target.dataset.page);
    } else if (target.dataset.modal) openModal(target.dataset.modal);
    else if (target.dataset.edit) {
      const post = state.posts.find(
        (p) => p.id === Number(target.dataset.edit),
      );
      if (post) {
        state.form = { ...post };
        openModal("post");
      }
    } else if (target.dataset.remove) {
      if (
        savePosts(
          state.posts.filter((p) => p.id !== Number(target.dataset.remove)),
        )
      ) {
        $("#planner-grid").innerHTML = plannerCards();
        notify("Content removed from planner");
      }
    } else if (target.dataset.filter) {
      state.filter = target.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((button) => {
        const active = button.dataset.filter === state.filter;
        button.classList.toggle("selected", active);
        button.setAttribute("aria-pressed", String(active));
      });
      $("#planner-grid").innerHTML = plannerCards();
    } else if (target.dataset.saveIdea) toggleIdea(target.dataset.saveIdea);
    else if (target.dataset.createIdea)
      newPost(
        allIdeas().find((idea) => idea.title === target.dataset.createIdea) || {
          title: target.dataset.createIdea,
          type: "Post",
        },
      );
    else if (target.dataset.media)
      newPost({
        title: target.dataset.mediaTitle,
        type: "Post",
        image: photo(target.dataset.media),
      });
    else if (target.dataset.ask) askAssistant(target.dataset.ask);
    else if (target.dataset.action === "new-post") newPost();
    else if (target.dataset.action === "close-modal") closeModal();
    else if (target.dataset.action === "save-draft") commitPost("Draft");
    else if (target.dataset.action === "export") downloadReport();
    else if (target.dataset.action === "caption") {
      const form = $("#post-form");
      form.elements.caption.value = `A little ${form.elements.title.value.toLowerCase().trim() || "everyday magic"}, a little inspiration. Finding beauty in the everyday. ✨\n\nWhat’s a small moment you’re loving today?\n\n#CreativeLife #EverydayMoments #SlowLiving`;
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "owner-login-form") {
      event.preventDefault();
      const password = event.target.elements.password.value;
      const rememberDevice = event.target.elements.rememberDevice.checked;
      event.target.reset();
      connectionAction("/api/session", { password, rememberDevice });
      return;
    }
    if (event.target.id === "backend-location-form") {
      event.preventDefault();
      try {
        const url = new URL(event.target.elements.backendUrl.value);
        const local = ["localhost", "127.0.0.1"].includes(url.hostname);
        if (
          (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
          url.username ||
          url.password
        )
          throw new Error();
        url.pathname = "/";
        url.search = "?connect=1";
        url.hash = "overview";
        location.assign(url.href);
      } catch {
        notify("Enter the HTTPS service URL from your hosting dashboard.");
      }
      return;
    }
    if (event.target.id === "post-form") {
      event.preventDefault();
      commitPost("Scheduled");
    }
    if (event.target.id === "chat-form") {
      event.preventDefault();
      const input = event.target.elements.prompt;
      askAssistant(input.value);
      input.value = "";
    }
    if (event.target.id === "ideas-form") {
      event.preventDefault();
      generateIdeas(event.target.elements.topic.value);
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.id === "content-search") {
      state.search = event.target.value;
      $("#planner-grid").innerHTML = plannerCards();
    }
    if (event.target.matches('#post-form [name="title"]'))
      event.target.setCustomValidity("");
  });
  document.addEventListener("change", (event) => {
    const change = event.target.dataset.change;
    if (change === "period") {
      state.period = event.target.value;
      render();
    }
    if (change === "metric") {
      state.metric = event.target.value;
      render();
    }
    if (event.target.dataset.upload)
      upload(event.target.files[0], event.target.dataset.upload);
  });
  $("#menu-toggle").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("mobile-open");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
  });
  $("#notifications-toggle").addEventListener("click", () => {
    $("#notifications").hidden = !$("#notifications").hidden;
    $("#notifications-toggle").setAttribute(
      "aria-expanded",
      String(!$("#notifications").hidden),
    );
  });
  $("#modal-overlay").addEventListener("click", (event) => {
    if (event.target.id === "modal-overlay") closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.modal) closeModal();
      $("#sidebar").classList.remove("mobile-open");
      $("#menu-toggle").setAttribute("aria-expanded", "false");
      $("#notifications").hidden = true;
      $("#notifications-toggle").setAttribute("aria-expanded", "false");
    }
    if (event.key === "Tab" && state.modal) {
      const items = [
        ...$("#modal").querySelectorAll(
          "button, input, textarea, select, a[href]",
        ),
      ].filter((el) => !el.disabled && !el.hidden);
      const first = items[0];
      const last = items[items.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === $("#modal"))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  window.addEventListener("hashchange", () => {
    const page = location.hash.slice(1);
    if (pages[page] && state.page !== page) navigate(page);
  });
  state.page = pages[location.hash.slice(1)]
    ? location.hash.slice(1)
    : "overview";
  render();
  if (location.protocol === "file:") {
    connectionChecked = true;
    updateConnectionSummary();
  } else {
    refreshConnection();
  }
  const connectionOutcome = new URLSearchParams(location.search).get(
    "connection",
  );
  const openConnection = new URLSearchParams(location.search).has("connect");
  if (connectionOutcome || openConnection) {
    history.replaceState(null, "", location.pathname + location.hash);
    openModal("account");
    const outcomes = {
      denied:
        "Meta sign-in was cancelled. Your existing connection was not changed.",
      no_accounts:
        "No Instagram accounts were assigned. Check your portfolio, app roles, and Meta configuration.",
      failed:
        "Meta sign-in could not finish. Check the app ID, secret, configuration ID, and saved Redirect URL.",
      expired: "Meta access was rejected. Start sign-in again.",
      choose:
        "Sign-in succeeded. Choose your Instagram account to finish connecting.",
    };
    if (outcomes[connectionOutcome]) notify(outcomes[connectionOutcome]);
  }
})();
