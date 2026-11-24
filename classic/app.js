// =================================================================
// 1. CONFIG: edit these two arrays to make the page yours.
// =================================================================

// Your daily checks. "response" is the word shown once it's ticked,
// like the call-and-response on a pilot's checklist.
// These are examples: delete the ones you don't need and add your own.
const CHECKS = [
  // Incidents and on-call
  { task: "Review alerts that fired overnight",              response: "Reviewed" },
  { task: "Confirm who is on call in PagerDuty",             response: "Confirmed" },
  { task: "Follow up on open incidents and postmortems",     response: "Followed up" },

  // Health and capacity
  { task: "Check overall service health in Datadog",         response: "Checked" },
  { task: "Look for pods restarting or stuck in Kubernetes", response: "Checked" },
  { task: "Check disk, CPU and memory on busy hosts",        response: "Checked" },
  { task: "Look for new errors in Sentry",                   response: "Reviewed" },

  // Security
  { task: "Review new security findings in Wiz",             response: "Reviewed" },
  { task: "Look for certificates expiring in 30 days",       response: "Checked" },

  // Builds, deploys and data
  { task: "Go through failed CI/CD pipelines",               response: "Reviewed" },
  { task: "Check that Argo CD apps are synced and healthy",  response: "Synced" },
  { task: "Make sure last night's backups finished",         response: "Verified" },

  // Cost and housekeeping
  { task: "Look for cloud cost spikes since yesterday",      response: "Checked" },
  { task: "Triage new tickets",                              response: "Triaged" },
  { task: "Review pull requests waiting on you",             response: "Reviewed" },
  { task: "Update the team board",                           response: "Updated" },
  { task: "Write handover notes",                            response: "Written" },
];

// Quick links, grouped. Tools that live at the same address for
// everyone have a URL already. Self-hosted tools (Grafana, Jenkins...)
// live at your own address, so their url is empty ("") and the page
// shows a reminder to fill it in instead of a broken link.
const LINK_GROUPS = [
  {
    name: "Monitoring",
    links: [
      { label: "Datadog",    url: "https://app.datadoghq.com" },
      { label: "Grafana",    url: "" },
      { label: "Prometheus", url: "" },
      { label: "Sentry",     url: "https://sentry.io" },
      { label: "Kibana",     url: "" },
    ],
  },
  {
    name: "Incidents and on-call",
    links: [
      { label: "PagerDuty",  url: "https://app.pagerduty.com" },
      { label: "Opsgenie",   url: "https://app.opsgenie.com" },
      { label: "Status page", url: "" },
    ],
  },
  {
    name: "Security",
    links: [
      { label: "Wiz",              url: "https://app.wiz.io" },
      { label: "Snyk",             url: "https://app.snyk.io" },
    ],
  },
  {
    name: "Cloud",
    links: [
      { label: "Google Cloud console", url: "https://console.cloud.google.com" },
      { label: "Azure portal",         url: "https://portal.azure.com" },
    ],
  },
  {
    name: "Builds and deploys",
    links: [
      { label: "GitHub",    url: "https://github.com" },
      { label: "GitLab",    url: "https://gitlab.com" },
      { label: "Jenkins",   url: "" },
      { label: "Argo CD",   url: "" },
    ],
  },
  {
    name: "Work",
    links: [
      { label: "Jira",     url: "" },
      { label: "Runbooks", url: "" },
      { label: "Team board", url: "" },
    ],
  },
];

// =================================================================
// 2. STORAGE: localStorage keeps data in this browser between visits.
//    We key the checklist by date, so every morning starts fresh.
// =================================================================

const todayKey = new Date().toISOString().slice(0, 10); // e.g. "2026-11-24"
const STATE_KEY = `shift-start:${todayKey}`;
const NOTES_KEY = "shift-start:notes";

// localStorage can throw (private windows, blocked storage), so wrap it.
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the page still works, it just won't remember */
  }
}

// state = { done: [indexes of ticked checks], extra: [today-only checks] }
const state = load(STATE_KEY, { done: [], extra: [] });

// =================================================================
// 3. RENDERING: build the HTML from data.
// =================================================================

const $ = (id) => document.getElementById(id);

function allChecks() {
  // Built-in checks first, then ones added today.
  return [...CHECKS, ...state.extra.map((task) => ({ task, response: "Done", extra: true }))];
}

function renderChecklist() {
  const list = $("checklist");
  list.innerHTML = ""; // start clean, then rebuild

  allChecks().forEach((check, i) => {
    const isDone = state.done.includes(i);

    const li = document.createElement("li");
    li.className = "check" + (isDone ? " done" : "");

    const label = document.createElement("label");

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = isDone;
    box.addEventListener("change", () => toggle(i));

    const task = document.createElement("span");
    task.className = "task";
    task.textContent = check.task; // textContent, not innerHTML: safe from HTML injection

    const leader = document.createElement("span");
    leader.className = "leader";

    const response = document.createElement("span");
    response.className = "response";
    response.textContent = isDone ? check.response : "";

    label.append(box, task, leader, response);
    li.append(label);

    if (check.extra) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove "${check.task}"`);
      remove.addEventListener("click", () => removeExtra(i - CHECKS.length));
      li.append(remove);
    }

    list.append(li);
  });

  renderProgress();
}

function renderProgress() {
  const total = allChecks().length;
  const done = state.done.length;
  const left = total - done;

  // The headline does the talking, so the page answers
  // "how much is left?" before you read anything else.
  let message;
  if (left === 0)          message = "All clear. Have a quiet shift.";
  else if (done === 0)     message = `Good morning. ${total} checks before you're clear.`;
  else if (left === 1)     message = "One check left.";
  else                     message = `${left} checks left.`;

  $("headline").textContent = message;

  const bar = $("progress-bar");
  bar.style.width = `${total ? (done / total) * 100 : 0}%`;
  bar.classList.toggle("complete", left === 0);
}

function renderLinks() {
  const container = $("links");

  for (const group of LINK_GROUPS) {
    const section = document.createElement("div");
    section.className = "link-group";

    const heading = document.createElement("h3");
    heading.textContent = group.name;

    const ul = document.createElement("ul");
    for (const link of group.links) {
      const li = document.createElement("li");
      if (link.url) {
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = link.label;
        li.append(a);
      } else {
        const span = document.createElement("span");
        span.className = "missing";
        span.textContent = `${link.label}: add its URL in app.js`;
        li.append(span);
      }
      ul.append(li);
    }

    section.append(heading, ul);
    container.append(section);
  }
}

// =================================================================
// 4. ACTIONS: change state, save it, re-render.
// =================================================================

function toggle(i) {
  state.done = state.done.includes(i)
    ? state.done.filter((n) => n !== i)
    : [...state.done, i];
  save(STATE_KEY, state);
  renderChecklist();
}

function removeExtra(extraIndex) {
  const removedIndex = CHECKS.length + extraIndex;
  state.extra.splice(extraIndex, 1);
  // Indexes after the removed item shift down by one.
  state.done = state.done
    .filter((n) => n !== removedIndex)
    .map((n) => (n > removedIndex ? n - 1 : n));
  save(STATE_KEY, state);
  renderChecklist();
}

$("add-check").addEventListener("submit", (event) => {
  event.preventDefault(); // stop the form from reloading the page
  const input = $("new-check");
  const text = input.value.trim();
  if (!text) return;
  state.extra.push(text);
  save(STATE_KEY, state);
  input.value = "";
  renderChecklist();
});

$("reset").addEventListener("click", () => {
  state.done = [];
  save(STATE_KEY, state);
  renderChecklist();
});

// Notes save as you type, after a short pause ("debounce").
const notes = $("notes");
notes.value = load(NOTES_KEY, "");
let saveTimer;
notes.addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    save(NOTES_KEY, notes.value);
    $("saved").textContent = "Saved in this browser";
  }, 500);
});

// =================================================================
// 5. START
// =================================================================

$("today").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long", day: "numeric", month: "long",
});

renderChecklist();
renderLinks();
