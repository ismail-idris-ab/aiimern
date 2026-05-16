import { marked, Marked, Renderer, type Tokens } from "marked";
import { createHighlighter, type Highlighter } from "shiki";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: [
        "javascript",
        "typescript",
        "tsx",
        "jsx",
        "python",
        "css",
        "html",
        "json",
        "bash",
        "sql",
      ],
    });
  }
  return highlighter;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function parseMarkdown(content: string): Promise<{ html: string; toc: TocItem[] }> {
  const hl = await getHighlighter();

  // Extract TOC from tokens using base marked (no custom renderer needed for lexing)
  const toc: TocItem[] = [];
  const tokens = marked.lexer(content);
  for (const token of tokens) {
    if (token.type === "heading" && (token.depth === 2 || token.depth === 3)) {
      toc.push({
        id: slugify(token.text),
        text: token.text,
        depth: token.depth as 2 | 3,
      });
    }
  }

  // Use Marked class to avoid mutating global marked instance
  const renderer = new Renderer();

  renderer.heading = function ({ tokens: headingTokens, depth }: Tokens.Heading): string {
    // Render inline tokens to get the text content
    const text = headingTokens
      .map((t) => ("text" in t ? (t as { text: string }).text : ""))
      .join("");
    return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
  };

  renderer.code = function ({ text, lang }: Tokens.Code): string {
    const loadedLangs = hl.getLoadedLanguages();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const language = lang && loadedLangs.includes(lang as any) ? lang : "text";
    return hl.codeToHtml(text, { lang: language, theme: "github-dark" });
  };

  const instance = new Marked({ renderer });
  const html = instance.parse(content) as string;
  return { html, toc };
}
