import React from "react";
import helpMarkdown from "../../apua.md";
import changelogMarkdown from "../../CHANGELOG.md";
import { useI18n } from "../i18n";
import packageInfo from "../../package.json";
import buildInfo from "../build-info";

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    return link ? <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a> : part;
  });
}

function renderMarkdown(markdown, keyPrefix) {
  const lines = markdown.trim().split("\n");
  const content = [];
  let listItems = [];
  const flushList = () => {
    if (listItems.length) {
      content.push(<ul key={`${keyPrefix}-list-${content.length}`}>{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith("# ")) {
      flushList();
      content.push(<h1 key={`${keyPrefix}-${index}`}>{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith("## ")) {
      flushList();
      content.push(<h2 key={`${keyPrefix}-${index}`}>{renderInline(line.slice(3))}</h2>);
    } else if (/^(\d+\. |- )/.test(line)) {
      listItems.push(<li key={`${keyPrefix}-${index}`}>{renderInline(line.replace(/^(\d+\. |- )/, ""))}</li>);
    } else if (line.trim()) {
      flushList();
      content.push(<p key={`${keyPrefix}-${index}`}>{renderInline(line)}</p>);
    }
  });
  flushList();
  return content;
}

export default function Help() {
  const { language } = useI18n();
  const marker = `<!-- ${language} -->`;
  const selectedMarkdown = helpMarkdown.split(marker)[1].split("<!--")[0];
  const content = renderMarkdown(selectedMarkdown, "help");

  return <div className="row"><main className="col"><div className="jumbotron">{content}<details><summary>Changelog</summary>{renderMarkdown(changelogMarkdown, "changelog")}</details><hr /><small>Version {packageInfo.version} · Build {buildInfo.id}</small></div></main></div>;
}
