/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import React from "react";

/** Renders the small subset of markdown our documents use: #, ##, ###, "- " lists and paragraphs. No HTML is ever injected. */
export default function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      blocks.push(<ul key={key}>{list.map((li, i) => <li key={i}>{li}</li>)}</ul>);
      list = [];
    }
  };
  text.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*[-*] /.test(line)) { list.push(line.replace(/^\s*[-*] /, "")); return; }
    flush(`ul${i}`);
    if (!line.trim()) return;
    if (line.startsWith("### ")) blocks.push(<h3 key={i}>{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={i}>{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) blocks.push(<h1 key={i}>{line.slice(2)}</h1>);
    else blocks.push(<p key={i}>{line}</p>);
  });
  flush("end");
  return <div className="prose-doc">{blocks}</div>;
}
