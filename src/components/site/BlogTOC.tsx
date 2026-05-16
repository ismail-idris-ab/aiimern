import { useState, useEffect } from "react";
import type { TocItem } from "@/lib/markdown";

type Props = { toc: TocItem[] };

export function BlogTOC({ toc }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (toc.length === 0) return;
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>("article h2, article h3"),
    );
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            visible.add(e.target.id);
          } else {
            visible.delete(e.target.id);
          }
        });
        const topmost = headings.find((h) => visible.has(h.id));
        if (topmost) setActiveId(topmost.id);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        On this page
      </p>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "pl-3" : ""}>
            <a
              href={`#${item.id}`}
              className={`text-sm transition-colors leading-snug block ${
                activeId === item.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
