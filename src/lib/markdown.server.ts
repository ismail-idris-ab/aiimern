import { marked, Marked, Renderer, type Tokens } from "marked";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { HighlighterCore } from "shiki/core";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

let highlighter: HighlighterCore | null = null;

async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighter) {
    highlighter = await createHighlighterCore({
      themes: [import("shiki/themes/github-dark.mjs")],
      langs: [
        import("shiki/langs/javascript.mjs"),
        import("shiki/langs/typescript.mjs"),
        import("shiki/langs/tsx.mjs"),
        import("shiki/langs/jsx.mjs"),
        import("shiki/langs/python.mjs"),
        import("shiki/langs/css.mjs"),
        import("shiki/langs/html.mjs"),
        import("shiki/langs/json.mjs"),
        import("shiki/langs/bash.mjs"),
        import("shiki/langs/sql.mjs"),
      ],
      engine: createJavaScriptRegexEngine(),
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

  renderer.heading = function ({ text, depth }: Tokens.Heading): string {
    const id = slugify(text);
    const rendered = marked.parseInline(text) as string;
    return `<h${depth} id="${id}">${rendered}</h${depth}>\n`;
  };

  renderer.code = function ({ text, lang }: Tokens.Code): string {
    const loadedLangs = hl.getLoadedLanguages();
    const language = lang && loadedLangs.includes(lang) ? lang : "text";
    return hl.codeToHtml(text, { lang: language, theme: "github-dark" });
  };

  const instance = new Marked({ renderer });
  const html = instance.parse(content) as string;
  return { html, toc };
}
