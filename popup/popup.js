import { getSnippets, filterSnippets } from "../storage/snippets.js";

const snippetList = document.getElementById("snippet-list");
const searchInput = document.getElementById("search");
const emptyMessage = document.getElementById("empty-message");
const openDashboardBtn = document.getElementById("open-dashboard-btn");

let snippets = [];

if (openDashboardBtn) {
  openDashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "dashboard/dashboard.html" });
  });
}

function getSnippetTitle(snippet) {
  if (snippet.title && snippet.title.trim().length > 0) {
    return snippet.title.trim();
  }
  if (snippet.code && snippet.code.trim().length > 0) {
    const firstLine = snippet.code.trim().split("\n")[0];
    return firstLine.length > 40 ? firstLine.slice(0, 40) + "..." : firstLine;
  }
  return "Untitled";
}

function renderSnippets(searchTerm = "") {
  snippetList.replaceChildren();

  const filteredSnippets = filterSnippets(snippets, { query: searchTerm });

  emptyMessage.style.display =
    filteredSnippets.length === 0 ? "block" : "none";

  filteredSnippets.forEach(snippet => {
    const row = document.createElement("div");
    row.className = "snippet-row";

    // Top row: Title + Language (only if language assigned)
    const topRow = document.createElement("div");
    topRow.className = "row-top";

    const titleEl = document.createElement("span");
    titleEl.className = "row-title";
    titleEl.textContent = getSnippetTitle(snippet);
    topRow.appendChild(titleEl);

    if (snippet.language && snippet.language.trim().length > 0) {
      const langEl = document.createElement("span");
      langEl.className = "row-lang";
      langEl.textContent = snippet.language.trim();
      topRow.appendChild(langEl);
    }

    // Code block
    const codeEl = document.createElement("pre");
    codeEl.className = "row-code";
    codeEl.textContent = snippet.code;

    // Source line
    const sourceEl = document.createElement("span");
    sourceEl.className = "row-source";
    sourceEl.textContent = snippet.sourceTitle || snippet.sourceUrl || "Manually saved";

    row.append(topRow, codeEl, sourceEl);
    snippetList.appendChild(row);
  });
}

async function loadSnippets() {
  snippets = await getSnippets();
  renderSnippets(searchInput ? searchInput.value : "");
}

loadSnippets();

if (searchInput) {
  searchInput.addEventListener("input", event => {
    renderSnippets(event.target.value);
  });
}
