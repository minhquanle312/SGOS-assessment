"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Mermaid from "./Mermaid";

export default function MarkdownView({ content }: { content: string }) {
  return (
    <article className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children, ...rest } = props;
            const match = /language-mermaid/.exec(className ?? "");
            if (match) {
              return <Mermaid chart={String(children).trim()} />;
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
