import React from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import removeEmoji from "../utils/removeEmoji";

// Render AI-generated Markdown as React elements (never as raw HTML).
export default function MarkdownContent({ text, className = "", actionLinks = false, onInternalLinkClick }) {
  return (
    <div className={`formatted-content ${className}`}>
      <ReactMarkdown
        components={{
          a({ href, children }) {
            const linkClass = actionLinks
              ? "my-1 mr-1.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
              : "font-semibold text-emerald-700 underline hover:text-emerald-900";
            const label = children;

            if (href?.startsWith("/") && !href.startsWith("//")) {
              return <Link to={href} onClick={onInternalLinkClick} className={linkClass}>{label}</Link>;
            }
            if (/^https?:\/\//i.test(href || "")) {
              return <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>{label}</a>;
            }
            return <>{children}</>;
          },
        }}
      >
        {removeEmoji(text)}
      </ReactMarkdown>
    </div>
  );
}
