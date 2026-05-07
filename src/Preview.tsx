import { useMemo } from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

interface PreviewProps {
  markdown: string;
}

export default function Preview({ markdown }: PreviewProps) {
  const html = useMemo(() => md.render(markdown), [markdown]);

  return (
    <div
      className="preview-container"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
