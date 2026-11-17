import {
  getSnippets,
  addSnippet,
  updateSnippet,
  deleteSnippet,
  filterSnippets,
  getDistinctLanguages
} from "../storage/snippets.js";

// DOM Elements: Header
const snippetCountBadge = document.getElementById("snippet-count-badge");
const headerNewBtn = document.getElementById("header-new-btn");

// DOM Elements: Sidebar
const dashboardSearch = document.getElementById("dashboard-search");
const clearSearchBtn = document.getElementById("clear-search-btn");
const languageFilterBar = document.getElementById("language-filter-bar");
const snippetList = document.getElementById("snippet-list");
const emptyListMessage = document.getElementById("empty-list-message");
const filterEmptyMessage = document.getElementById("filter-empty-message");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

// DOM Elements: Detail View
const detailEmpty = document.getElementById("detail-empty");
const detailContent = document.getElementById("detail-content");
const detailTitle = document.getElementById("detail-title");
const detailLanguage = document.getElementById("detail-language");
const detailTags = document.getElementById("detail-tags");
const detailCode = document.getElementById("detail-code");
const detailNotes = document.getElementById("detail-notes");
const detailSource = document.getElementById("detail-source");
const detailCreated = document.getElementById("detail-created");

// DOM Elements: Detail Actions (Unobtrusive footer links)
const copyCodeBtn = document.getElementById("copy-code-btn");
const copyBtnText = document.getElementById("copy-btn-text");
const editSnippetBtn = document.getElementById("edit-snippet-btn");
const deleteSnippetBtn = document.getElementById("delete-snippet-btn");

// DOM Elements: Delete Confirmation
const deleteConfirmBanner = document.getElementById("delete-confirm-banner");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

// DOM Elements: Editor View
const editorContainer = document.getElementById("editor-container");
const editorHeading = document.getElementById("editor-heading");
const saveEditorBtn = document.getElementById("save-editor-btn");
const cancelEditorBtn = document.getElementById("cancel-editor-btn");
const editorError = document.getElementById("editor-error");
const editorTitle = document.getElementById("editor-title");
const editorLanguage = document.getElementById("editor-language");
const editorCode = document.getElementById("editor-code");
const editorTags = document.getElementById("editor-tags");
const editorNotes = document.getElementById("editor-notes");

// Application State
let snippets = [];
let selectedSnippetId = null;
let searchQuery = "";
let selectedLanguage = "all";
let currentMode = "view"; // "view" | "create" | "edit"

/**
 * Format an ISO timestamp string into a concise readable string.
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return "Unknown";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Derives a display title for a snippet.
 * @param {Object} snippet
 * @returns {string}
 */
function getSnippetDisplayTitle(snippet) {
  if (snippet.title && snippet.title.trim().length > 0) {
    return snippet.title.trim();
  }

  if (snippet.code && snippet.code.trim().length > 0) {
    const firstLine = snippet.code.trim().split("\n")[0];
    return firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;
  }

  return "Untitled";
}

/**
 * Returns a 1-line code preview string.
 * @param {string} code
 * @returns {string}
 */
function getCodePreview(code) {
  if (!code) return "";
  const firstLine = code.trim().split("\n")[0];
  return firstLine.length > 60 ? firstLine.slice(0, 60) + "..." : firstLine;
}

/**
 * Returns snippets matching current search and language filters.
 * @returns {Array}
 */
function getActiveFilteredSnippets() {
  return filterSnippets(snippets, {
    query: searchQuery,
    language: selectedLanguage
  });
}

/**
 * Renders language filter controls in the sidebar header.
 * Only displays filters for languages that are actually assigned.
 */
function renderLanguageFilters() {
  languageFilterBar.replaceChildren();

  if (snippets.length === 0) {
    languageFilterBar.classList.add("hidden");
    return;
  }

  languageFilterBar.classList.remove("hidden");

  // "All" filter button
  const allBtn = document.createElement("button");
  allBtn.className = "filter-item";
  if (selectedLanguage === "all") {
    allBtn.classList.add("active");
  }
  allBtn.textContent = `All (${snippets.length})`;
  allBtn.addEventListener("click", () => {
    selectedLanguage = "all";
    onFilterChange();
  });
  languageFilterBar.appendChild(allBtn);

  // Distinct language buttons (only includes non-empty languages)
  const distinctLanguages = getDistinctLanguages(snippets);
  distinctLanguages.forEach(({ language, count }) => {
    const btn = document.createElement("button");
    btn.className = "filter-item";
    if (selectedLanguage.toLowerCase() === language.toLowerCase()) {
      btn.classList.add("active");
    }
    btn.textContent = `${language} (${count})`;
    btn.addEventListener("click", () => {
      selectedLanguage = language;
      onFilterChange();
    });
    languageFilterBar.appendChild(btn);
  });
}

/**
 * Renders continuous snippet list rows in the sidebar.
 */
function renderList() {
  snippetList.replaceChildren();

  const total = snippets.length;
  snippetCountBadge.textContent = `${total} ${total === 1 ? "snippet" : "snippets"}`;

  const filtered = getActiveFilteredSnippets();

  if (total === 0) {
    emptyListMessage.classList.remove("hidden");
    filterEmptyMessage.classList.add("hidden");
    snippetList.classList.add("hidden");
    return;
  }

  emptyListMessage.classList.add("hidden");

  if (filtered.length === 0) {
    filterEmptyMessage.classList.remove("hidden");
    snippetList.classList.add("hidden");
    return;
  }

  filterEmptyMessage.classList.add("hidden");
  snippetList.classList.remove("hidden");

  filtered.forEach(snippet => {
    const row = document.createElement("div");
    row.className = "snippet-row";
    if (snippet.id === selectedSnippetId && currentMode !== "create") {
      row.classList.add("selected");
    }

    // Top row: Title + Language (only if language assigned)
    const topRow = document.createElement("div");
    topRow.className = "row-top";

    const titleEl = document.createElement("span");
    titleEl.className = "row-title";
    titleEl.textContent = getSnippetDisplayTitle(snippet);

    const langEl = document.createElement("span");
    langEl.className = "row-lang";
    if (snippet.language && snippet.language.trim().length > 0) {
      langEl.textContent = snippet.language.trim();
    } else {
      langEl.classList.add("hidden");
    }

    topRow.append(titleEl, langEl);

    // Code preview row
    const codePreview = document.createElement("div");
    codePreview.className = "row-preview";
    codePreview.textContent = getCodePreview(snippet.code);

    // Date row
    const dateEl = document.createElement("span");
    dateEl.className = "row-date";
    dateEl.textContent = formatDate(snippet.createdAt);

    row.append(topRow, codePreview, dateEl);

    // Click handler
    row.addEventListener("click", () => {
      selectedSnippetId = snippet.id;
      currentMode = "view";
      deleteConfirmBanner.classList.add("hidden");
      renderList();
      renderDetailPane();
    });

    snippetList.appendChild(row);
  });
}

/**
 * Renders the detail pane according to the current mode (view, create, or edit).
 */
function renderDetailPane() {
  if (currentMode === "create") {
    detailEmpty.classList.add("hidden");
    detailContent.classList.add("hidden");
    editorContainer.classList.remove("hidden");

    editorHeading.textContent = "New Snippet";
    saveEditorBtn.textContent = "Save Snippet";
    editorTitle.value = "";
    editorLanguage.value = ""; // Empty by default
    editorCode.value = "";
    editorTags.value = ""; // Empty by default
    editorNotes.value = "";
    editorError.classList.add("hidden");
    editorTitle.focus();
    return;
  }

  if (currentMode === "edit") {
    const snippet = snippets.find(s => s.id === selectedSnippetId);
    if (!snippet) {
      currentMode = "view";
      renderDetailPane();
      return;
    }

    detailEmpty.classList.add("hidden");
    detailContent.classList.add("hidden");
    editorContainer.classList.remove("hidden");

    editorHeading.textContent = "Edit Snippet";
    saveEditorBtn.textContent = "Save Changes";
    editorTitle.value = snippet.title || "";
    // Keep language input empty when snippet has no language
    editorLanguage.value = (snippet.language || "").trim();
    editorCode.value = snippet.code || "";
    // Keep tag input empty when snippet has no tags
    const hasTags = Array.isArray(snippet.tags) && snippet.tags.length > 0;
    editorTags.value = hasTags ? snippet.tags.join(", ") : "";
    editorNotes.value = snippet.notes || "";
    editorError.classList.add("hidden");
    editorTitle.focus();
    return;
  }

  // View Mode
  editorContainer.classList.add("hidden");
  deleteConfirmBanner.classList.add("hidden");

  const selectedSnippet = snippets.find(s => s.id === selectedSnippetId);

  if (!selectedSnippet) {
    detailEmpty.classList.remove("hidden");
    detailContent.classList.add("hidden");
    return;
  }

  detailEmpty.classList.add("hidden");
  detailContent.classList.remove("hidden");

  // Title
  detailTitle.textContent = getSnippetDisplayTitle(selectedSnippet);

  // Language: only display when actually assigned
  if (selectedSnippet.language && selectedSnippet.language.trim().length > 0) {
    detailLanguage.textContent = selectedSnippet.language.trim();
    detailLanguage.classList.remove("hidden");
  } else {
    detailLanguage.textContent = "";
    detailLanguage.classList.add("hidden");
  }

  // Tags: only display when actual tags exist
  detailTags.replaceChildren();
  if (Array.isArray(selectedSnippet.tags) && selectedSnippet.tags.length > 0) {
    detailTags.textContent = selectedSnippet.tags.map(t => `#${t}`).join(" ");
    detailTags.classList.remove("hidden");
  } else {
    detailTags.textContent = "";
    detailTags.classList.add("hidden");
  }

  // Code
  detailCode.textContent = selectedSnippet.code || "";

  // Notes
  detailNotes.replaceChildren();
  if (selectedSnippet.notes && selectedSnippet.notes.trim().length > 0) {
    detailNotes.textContent = selectedSnippet.notes;
    detailNotes.classList.remove("empty");
  } else {
    detailNotes.textContent = "No notes added.";
    detailNotes.classList.add("empty");
  }

  // Source information
  detailSource.replaceChildren();
  if (selectedSnippet.sourceUrl) {
    const link = document.createElement("a");
    link.href = selectedSnippet.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = selectedSnippet.sourceTitle || selectedSnippet.sourceUrl;
    detailSource.appendChild(link);
  } else if (selectedSnippet.sourceTitle) {
    detailSource.textContent = selectedSnippet.sourceTitle;
  } else {
    detailSource.textContent = "Manually created";
  }

  // Created timestamp only (Modified removed per requirement)
  detailCreated.textContent = formatDate(selectedSnippet.createdAt);
}

/**
 * Handle search query or language filter changes.
 */
function onFilterChange() {
  const filtered = getActiveFilteredSnippets();

  if (filtered.length > 0 && !filtered.some(s => s.id === selectedSnippetId)) {
    selectedSnippetId = filtered[0].id;
  }

  renderLanguageFilters();
  renderList();
  renderDetailPane();
}

/**
 * Handles copying code to clipboard.
 */
async function handleCopyCode() {
  const selectedSnippet = snippets.find(s => s.id === selectedSnippetId);
  if (!selectedSnippet || !selectedSnippet.code) return;

  try {
    await navigator.clipboard.writeText(selectedSnippet.code);
    copyBtnText.textContent = "Copied";

    setTimeout(() => {
      copyBtnText.textContent = "Copy";
    }, 2000);
  } catch (error) {
    console.error("Failed to copy code to clipboard:", error);
    copyBtnText.textContent = "Failed to copy";
    setTimeout(() => {
      copyBtnText.textContent = "Copy";
    }, 2000);
  }
}

/**
 * Handles saving from the editor (either Create or Edit).
 */
async function handleSaveEditor(event) {
  if (event) event.preventDefault();

  const codeValue = editorCode.value;
  if (!codeValue || !codeValue.trim()) {
    editorError.textContent = "Code is required to save a snippet.";
    editorError.classList.remove("hidden");
    editorCode.focus();
    return;
  }

  editorError.classList.add("hidden");

  const rawTags = editorTags.value || "";
  const parsedTags = rawTags
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const snippetPayload = {
    title: editorTitle.value.trim(),
    language: editorLanguage.value.trim().toLowerCase(), // Empty string if omitted
    code: codeValue,
    tags: parsedTags,
    notes: editorNotes.value.trim()
  };

  if (currentMode === "create") {
    const newSnippet = await addSnippet(snippetPayload);
    await reloadFromStorage();
    selectedSnippetId = newSnippet.id;
    currentMode = "view";
    renderLanguageFilters();
    renderList();
    renderDetailPane();
  } else if (currentMode === "edit") {
    await updateSnippet(selectedSnippetId, snippetPayload);
    await reloadFromStorage();
    currentMode = "view";
    renderLanguageFilters();
    renderList();
    renderDetailPane();
  }
}

/**
 * Deletes the currently selected snippet with confirmation.
 */
async function handleConfirmDelete() {
  if (!selectedSnippetId) return;

  const idToDelete = selectedSnippetId;
  await deleteSnippet(idToDelete);
  await reloadFromStorage();

  deleteConfirmBanner.classList.add("hidden");

  const remainingFiltered = getActiveFilteredSnippets();
  if (remainingFiltered.length > 0) {
    selectedSnippetId = remainingFiltered[0].id;
  } else if (snippets.length > 0) {
    selectedLanguage = "all";
    searchQuery = "";
    dashboardSearch.value = "";
    clearSearchBtn.classList.add("hidden");
    selectedSnippetId = snippets[0].id;
  } else {
    selectedSnippetId = null;
  }

  currentMode = "view";
  renderLanguageFilters();
  renderList();
  renderDetailPane();
}

/**
 * Reload snippets from storage.
 */
async function reloadFromStorage() {
  snippets = await getSnippets();
}

/**
 * Main application initialization.
 */
async function init() {
  await reloadFromStorage();

  if (snippets.length > 0 && !selectedSnippetId) {
    selectedSnippetId = snippets[0].id;
  }

  renderLanguageFilters();
  renderList();
  renderDetailPane();
}

// --------------------------------------------------
// Event Listeners
// --------------------------------------------------

headerNewBtn.addEventListener("click", () => {
  currentMode = "create";
  renderList();
  renderDetailPane();
});

// Footer actions
copyCodeBtn.addEventListener("click", handleCopyCode);

editSnippetBtn.addEventListener("click", () => {
  currentMode = "edit";
  renderDetailPane();
});

deleteSnippetBtn.addEventListener("click", () => {
  deleteConfirmBanner.classList.remove("hidden");
});

confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
cancelDeleteBtn.addEventListener("click", () => {
  deleteConfirmBanner.classList.add("hidden");
});

saveEditorBtn.addEventListener("click", handleSaveEditor);
cancelEditorBtn.addEventListener("click", () => {
  currentMode = "view";
  renderDetailPane();
});

// Double clicking the code block also triggers Edit mode
detailCode.addEventListener("dblclick", () => {
  if (currentMode === "view" && selectedSnippetId) {
    currentMode = "edit";
    renderDetailPane();
  }
});

// Tab key inside code textarea inserts 2 spaces
editorCode.addEventListener("keydown", event => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = editorCode.selectionStart;
    const end = editorCode.selectionEnd;
    editorCode.value = editorCode.value.substring(0, start) + "  " + editorCode.value.substring(end);
    editorCode.selectionStart = editorCode.selectionEnd = start + 2;
  }
});

// Search input
dashboardSearch.addEventListener("input", event => {
  searchQuery = event.target.value;
  if (searchQuery.trim().length > 0) {
    clearSearchBtn.classList.remove("hidden");
  } else {
    clearSearchBtn.classList.add("hidden");
  }
  onFilterChange();
});

clearSearchBtn.addEventListener("click", () => {
  dashboardSearch.value = "";
  searchQuery = "";
  clearSearchBtn.classList.add("hidden");
  onFilterChange();
});

resetFiltersBtn.addEventListener("click", () => {
  dashboardSearch.value = "";
  searchQuery = "";
  selectedLanguage = "all";
  clearSearchBtn.classList.add("hidden");
  onFilterChange();
});

// Reactive sync with background storage events
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.snippets) {
    if (currentMode === "view") {
      reloadFromStorage().then(() => {
        if (!selectedSnippetId || !snippets.some(s => s.id === selectedSnippetId)) {
          selectedSnippetId = snippets.length > 0 ? snippets[0].id : null;
        }
        renderLanguageFilters();
        renderList();
        renderDetailPane();
      });
    }
  }
});

init();
