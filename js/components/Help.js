import React from "react";
import helpMarkdown from "../../apua.md";
import { useI18n } from "../i18n";

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}

export default function Help() {
  const { language } = useI18n();
  const marker = `<!-- ${language} -->`;
  const selectedMarkdown = helpMarkdown.split(marker)[1].split("<!--")[0];
  const lines = selectedMarkdown.trim().split("\n");
  const content = [];
  let listItems = [];
  const flushList = () => {
    if (listItems.length) {
      content.push(<ol key={`list-${content.length}`}>{listItems}</ol>);
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith("# ")) {
      flushList();
      content.push(<h1 key={index}>{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith("## ")) {
      flushList();
      content.push(<h2 key={index}>{renderInline(line.slice(3))}</h2>);
    } else if (/^\d+\. /.test(line)) {
      listItems.push(<li key={index}>{renderInline(line.replace(/^\d+\. /, ""))}</li>);
    } else if (line.trim()) {
      flushList();
      content.push(<p key={index}>{renderInline(line)}</p>);
    }
  });
  flushList();

  return <div className="row"><main className="col"><div className="jumbotron">{content}</div></main></div>;
}
