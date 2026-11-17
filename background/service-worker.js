import { addSnippet } from "../storage/snippets.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-syntaxmemo",
    title: "Save to SyntaxMemo",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-syntaxmemo") {
    const rawText = info.selectionText || "";
    const trimmedText = rawText.trim();

    // Guard: Do not save empty or whitespace-only snippets
    if (!trimmedText) {
      return;
    }

    // Derive a sensible, readable default title from the first non-empty line
    const firstLine = trimmedText.split("\n")[0].trim();
    let defaultTitle = firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;

    // Fallback if the first line is somehow blank
    if (!defaultTitle) {
      defaultTitle = tab?.title ? `From ${tab.title.slice(0, 40)}` : "Untitled Snippet";
    }

    await addSnippet({
      title: defaultTitle,
      code: rawText,
      sourceUrl: info.pageUrl || tab?.url || "",
      sourceTitle: tab?.title || ""
    });
  }
});
