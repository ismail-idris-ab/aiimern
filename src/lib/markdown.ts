import { marked, Renderer, type Tokens } from "marked";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function parseMarkdown(content: string): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = [];
  const tokens = marked.lexer(content);
  for (const token of tokens) {
    if (token.type === "heading" && (token.depth === 2 || token.depth === 3)) {
      toc.push({ id: slugify(token.text), text: token.text, depth: token.depth as 2 | 3 });
    }
  }

  const renderer = new Renderer();

  renderer.heading = function ({ text, depth }: Tokens.Heading): string {
    const id = slugify(text);
    const rendered = marked.parseInline(text) as string;
    return `<h${depth} id="${id}">${rendered}</h${depth}>\n`;
  };

  const html = await marked.parse(content, { renderer });
  return { html, toc };
}
