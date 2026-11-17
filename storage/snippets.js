/**
 * Factory function to create a complete snippet object with default values.
 * Ensures all required schema fields are present.
 *
 * @param {Object} data - Partial or complete snippet data.
 * @returns {Object} A fully-formed snippet object.
 */
function createSnippetModel(data = {}) {
  const now = new Date().toISOString();

  // Language defaults to empty string unless explicitly provided
  let language = "";
  if (typeof data.language === "string") {
    language = data.language.trim().toLowerCase();
  }

  return {
    id: data.id || crypto.randomUUID(),
    title: typeof data.title === "string" ? data.title : "",
    code: typeof data.code === "string" ? data.code : "",
    language: language,
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t).trim()).filter(Boolean) : [],
    notes: typeof data.notes === "string" ? data.notes : "",
    sourceUrl: typeof data.sourceUrl === "string" ? data.sourceUrl : "",
    sourceTitle: typeof data.sourceTitle === "string" ? data.sourceTitle : "",
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

/**
 * Retrieves all snippets from chrome.storage.local.
 *
 * @returns {Promise<Array>} Resolves to an array of snippet objects.
 */
export async function getSnippets() {
  const result = await chrome.storage.local.get({ snippets: [] });
  return result.snippets || [];
}

/**
 * Creates and appends a new snippet to storage.
 * Automatically assigns a unique ID and timestamps.
 *
 * @param {Object} snippetData - Partial snippet data (e.g. { code, sourceUrl, sourceTitle }).
 * @returns {Promise<Object>} The newly created snippet object.
 */
export async function addSnippet(snippetData) {
  const newSnippet = createSnippetModel(snippetData);
  const snippets = await getSnippets();
  const updatedSnippets = [...snippets, newSnippet];

  await chrome.storage.local.set({ snippets: updatedSnippets });
  return newSnippet;
}

/**
 * Updates an existing snippet by its ID.
 * Preserves the original `id` and `createdAt` while refreshing `updatedAt`.
 *
 * @param {string} id - Unique identifier of the snippet to update.
 * @param {Object} updatedFields - Object containing the fields to update.
 * @returns {Promise<Object|null>} The updated snippet, or null if not found.
 */
export async function updateSnippet(id, updatedFields) {
  const snippets = await getSnippets();
  const index = snippets.findIndex(snippet => snippet.id === id);

  if (index === -1) {
    return null;
  }

  const existing = snippets[index];

  // If tags are provided, sanitize them to a clean string array
  let sanitizedTags = existing.tags;
  if (Array.isArray(updatedFields.tags)) {
    sanitizedTags = updatedFields.tags.map(t => String(t).trim()).filter(Boolean);
  }

  // If language is provided, sanitize it (empty string if blank or whitespace)
  let sanitizedLanguage = existing.language || "";
  if (typeof updatedFields.language === "string") {
    sanitizedLanguage = updatedFields.language.trim().toLowerCase();
  }

  const updatedSnippet = {
    ...existing,
    ...updatedFields,
    language: sanitizedLanguage,
    tags: sanitizedTags,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  snippets[index] = updatedSnippet;
  await chrome.storage.local.set({ snippets });
  return updatedSnippet;
}

/**
 * Deletes a snippet from storage by its ID.
 *
 * @param {string} id - Unique identifier of the snippet to delete.
 * @returns {Promise<boolean>} Resolves to true if deleted, false if not found.
 */
export async function deleteSnippet(id) {
  const snippets = await getSnippets();
  const initialLength = snippets.length;
  const filteredSnippets = snippets.filter(snippet => snippet.id !== id);

  if (filteredSnippets.length === initialLength) {
    return false;
  }

  await chrome.storage.local.set({ snippets: filteredSnippets });
  return true;
}

/**
 * Filters a list of snippets by text query (matching title, code, notes, language, tags)
 * and optional language filter.
 *
 * @param {Array} snippets - Array of snippet objects.
 * @param {Object} options - Filter criteria.
 * @param {string} [options.query=""] - Text to search for.
 * @param {string} [options.language=""] - Language to filter by ("all" or specific language).
 * @returns {Array} Filtered array of snippet objects.
 */
export function filterSnippets(snippets, { query = "", language = "" } = {}) {
  const q = (query || "").trim().toLowerCase();
  const lang = (language || "").trim().toLowerCase();

  return snippets.filter(snippet => {
    // 1. Language filter check
    if (lang && lang !== "all") {
      const snippetLang = typeof snippet.language === "string" ? snippet.language.trim().toLowerCase() : "";
      if (snippetLang !== lang) {
        return false;
      }
    }

    // 2. Query search check (across title, code, notes, language, tags)
    if (q) {
      const matchTitle = (snippet.title || "").toLowerCase().includes(q);
      const matchCode = (snippet.code || "").toLowerCase().includes(q);
      const matchNotes = (snippet.notes || "").toLowerCase().includes(q);
      const matchLanguage = (snippet.language || "").toLowerCase().includes(q);
      const matchTags = Array.isArray(snippet.tags) && snippet.tags.some(tag => tag.toLowerCase().includes(q));

      if (!matchTitle && !matchCode && !matchNotes && !matchLanguage && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extracts a list of distinct languages and their counts from snippets.
 * Excludes empty or unassigned languages.
 *
 * @param {Array} snippets - Array of snippet objects.
 * @returns {Array<{ language: string, count: number }>} Sorted by language name.
 */
export function getDistinctLanguages(snippets) {
  const counts = {};
  for (const s of snippets) {
    const rawLang = typeof s.language === "string" ? s.language.trim().toLowerCase() : "";
    if (rawLang) {
      counts[rawLang] = (counts[rawLang] || 0) + 1;
    }
  }

  return Object.keys(counts)
    .sort()
    .map(lang => ({ language: lang, count: counts[lang] }));
}
