// AI responses can contain emoji despite instructions to use plain text.
// Strip them only from generated content, not from a student's own input.
const emojiPattern = /(?:\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:[\uFE0E\uFE0F])?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:[\uFE0E\uFE0F])?(?:\p{Emoji_Modifier})?)*)/gu;

export default function removeEmoji(text) {
  return typeof text === "string" ? text.replace(emojiPattern, "").replace(/\uFE0F/g, "") : "";
}
