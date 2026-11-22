import { classifyEmail } from "./brain.js";

export function summarizeEmail(email) {
  const sentences = email.body.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [email.body];
  return sentences.slice(0, 2).map((part) => part.trim()).join(" ");
}

export function extractTasks(email) {
  const text = `${email.subject}. ${email.body}`;
  const patterns = [
    /(?:please\s+)?(submit|complete|upload|send|review|bring|register|attend|check)\b[^.!?]*(?:\bby\s+(?:today|tomorrow|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)))?/gi,
    /(remember to\b[^.!?]+)/gi,
  ];
  const found = patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => match[0].trim()));
  return [...new Set(found)].slice(0, 3).map((task) => ({
    task: task[0].toUpperCase() + task.slice(1),
    deadline: task.match(/\bby\s+(today|tomorrow|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\b/i)?.[1] ?? null,
  }));
}

export function draftReply(email, tone = "formal") {
  const templates = {
    formal: `Dear ${email.sender.split(" ")[0]},\n\nThank you for your email. I have received your message regarding “${email.subject}” and will follow up as needed.\n\nBest regards,\nTejas`,
    friendly: `Hi ${email.sender.split(" ")[0]},\n\nThanks for reaching out! I’ve seen your note about “${email.subject}”. I’ll get back to you soon.\n\nBest,\nTejas`,
    brief: `Hi ${email.sender.split(" ")[0]},\n\nThanks, noted. I’ll follow up on “${email.subject}”.\n\nTejas`,
  };
  return templates[tone] ?? templates.formal;
}

export function labelEmail(email) {
  const result = classifyEmail(email);
  return { ...email, label: result.category, priority: result.score };
}

export function scheduleFollowup(email, when) {
  if (!when) throw new Error("Choose a follow-up time before scheduling.");
  return { emailId: email.id, subject: email.subject, when, status: "scheduled locally" };
}

export function searchInbox(emails, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return emails;
  return emails.filter((email) =>
    `${email.sender} ${email.subject} ${email.body}`.toLowerCase().includes(normalized),
  );
}

export function dailyDigest(emails) {
  const totals = emails.reduce((result, email) => {
    const category = classifyEmail(email).category;
    result[category] = (result[category] ?? 0) + 1;
    return result;
  }, {});
  return {
    total: emails.length,
    urgent: emails.filter((email) => classifyEmail(email).category === "Urgent"),
    tasks: emails.flatMap((email) => extractTasks(email).map((task) => ({ ...task, emailId: email.id }))),
    totals,
  };
}

export const agentTools = {
  classify_email: labelEmail,
  summarize_email: summarizeEmail,
  extract_tasks: extractTasks,
  draft_reply: draftReply,
  label_email: labelEmail,
  schedule_followup: scheduleFollowup,
  search_inbox: searchInbox,
  daily_digest: dailyDigest,
};
