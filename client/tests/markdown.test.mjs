import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import splitStudyPlan from "../src/utils/splitStudyPlan.js";
import removeEmoji from "../src/utils/removeEmoji.js";

let vite;
let MarkdownContent;

before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  ({ default: MarkdownContent } = await vite.ssrLoadModule("/src/components/MarkdownContent.jsx"));
});

after(async () => {
  await vite?.close();
});

function render(text, actionLinks = false) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(MarkdownContent, { text, actionLinks }),
    ),
  );
}

test("renders bold text, headings, lists and internal action links without asterisks", () => {
  const html = render("### Guidance\n\n**Important** topics\n\n- Practice\n- Revise\n\n[Open sheet](/prep/google/Software%20Engineer/sheet)", true);
  assert.match(html, /<strong>Important<\/strong>/);
  assert.doesNotMatch(html, /\*\*Important\*\*/);
  assert.match(html, /<h3>Guidance<\/h3>/);
  assert.match(html, /<li>Practice<\/li>/);
  assert.match(html, /href="\/prep\/google\/Software%20Engineer\/sheet"/);
});

test("keeps formatted day headings, bodies and intro in separate cards", () => {
  const plan = "**Your roadmap**\n\n### **Day 1: Arrays**\n- Revise **hash maps**\n\n**Day 2: Strings**\n• Practice 3 questions";
  const { intro, days } = splitStudyPlan(plan);
  assert.equal(intro, "**Your roadmap**");
  assert.equal(days.length, 2);
  assert.equal(days[0].heading, "**Day 1: Arrays**");
  assert.match(render(days[0].lines.join("\n")), /<strong>hash maps<\/strong>/);
  assert.equal(days[1].number, "2");
  assert.match(render(days[1].lines.join("\n")), /Practice 3 questions/);
});

test("removes emoji from generated text without losing formatting", () => {
  const html = render("👋 Welcome to **PrepAI** 🎯");
  assert.doesNotMatch(html, /👋|🎯/u);
  assert.match(html, /<strong>PrepAI<\/strong>/);
});

test("strips combined emoji from AI fields but leaves ordinary content alone", () => {
  assert.equal(removeEmoji("👩🏽‍💻 Good work 🇮🇳 1️⃣"), " Good work  ");
  assert.equal(removeEmoji("Day 1: **Review arrays**"), "Day 1: **Review arrays**");
});

test("does not create executable links or render raw HTML", () => {
  const html = render("[unsafe](javascript:alert(1)) <script>alert(1)</script>");
  assert.doesNotMatch(html, /href="javascript:|<script>/);
});
