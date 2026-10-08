// Keep any introduction and the complete Markdown body of each day intact.
export default function splitStudyPlan(text) {
  const intro = [];
  const days = [];
  let currentDay = null;

  for (const line of text.split(/\r?\n/)) {
    const heading = line.trim().replace(/^#{1,6}\s+/, "");
    const match = heading.match(/^(?:\*\*|__)?Day\s+(\d+)\b/i);
    if (match) {
      currentDay = { number: match[1], heading, lines: [] };
      days.push(currentDay);
    } else if (currentDay) {
      currentDay.lines.push(line);
    } else {
      intro.push(line);
    }
  }

  return { intro: intro.join("\n").trim(), days };
}
