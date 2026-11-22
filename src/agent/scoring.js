const URGENCY_WORDS = ["urgent", "asap", "today", "tomorrow", "deadline", "due"];
const IMPORTANT_SENDERS = ["professor", "dr.", "hod", "manager", "placement cell", "placement", "mentor"];
const SPAM_MARKERS = ["win", "free", "% off", "unsubscribe", "lottery", "claim your prize"];

export function scoreEmail(email) {
  const content = `${email.subject} ${email.body}`.toLowerCase();
  const sender = `${email.sender} ${email.role ?? ""}`.toLowerCase();
  const urgency = URGENCY_WORDS.filter((word) => content.includes(word));
  const importantSender = IMPORTANT_SENDERS.filter((word) => sender.includes(word));
  const spamMarkers = SPAM_MARKERS.filter((word) => content.includes(word));
  const questionMarks = (content.match(/\?/g) ?? []).length;
  const reasons = [];
  let score = 1;

  if (urgency.length) {
    score += Math.min(urgency.length * 2, 5);
    reasons.push(`urgency word: ${urgency[0]}`);
  }
  if (importantSender.length) {
    score += 2;
    reasons.push(`important sender: ${importantSender[0]}`);
  }
  if (questionMarks) {
    score += 1;
    reasons.push("asks a question");
  }
  if (spamMarkers.length) {
    score -= 2;
    reasons.push(`bulk/spam marker: ${spamMarkers[0]}`);
  }

  score = Math.max(1, Math.min(10, score));
  if (!reasons.length) reasons.push("no urgent or reply signals found");
  return { score, reasons };
}

export { URGENCY_WORDS, IMPORTANT_SENDERS, SPAM_MARKERS };
