import { scoreEmail } from "./scoring.js";

const SPAM_PHRASES = ["lottery", "claim your prize", "click here", "you won", "winner", "gift card"];
const NEWSLETTER_PHRASES = ["unsubscribe", "newsletter", "weekly digest", "% off"];
const ACTION_PHRASES = ["remember to", "please submit", "please complete", "upload the", "submit the"];

export function classifyEmail(email) {
  const content = `${email.subject} ${email.body}`.toLowerCase();
  const signals = [];
  let category;

  if (SPAM_PHRASES.some((phrase) => content.includes(phrase))) {
    category = "Spam";
    signals.push("suspicious prize or link language");
  } else if (NEWSLETTER_PHRASES.some((phrase) => content.includes(phrase))) {
    category = "Newsletter";
    signals.push("bulk-mail or unsubscribe marker");
  } else if (
    (content.includes("?") || /\b(let me know|could you|can you)\b/i.test(content)) &&
    !/\b(urgent|asap|deadline|due)\b/i.test(content) &&
    !(/tomorrow/i.test(content) && /professor|dr\.|hod|manager|placement|mentor/i.test(`${email.sender} ${email.role ?? ""}`))
  ) {
    category = "Needs reply";
    signals.push(content.includes("?") ? "question mark" : "reply request");
  } else if (/\b(urgent|asap|today|tomorrow|deadline|due)\b/i.test(content)) {
    category = "Urgent";
    signals.push("time-sensitive language");
    if (/professor|dr\.|hod|manager|placement|mentor/i.test(`${email.sender} ${email.role ?? ""}`)) {
      signals.push("important sender");
    }
  } else if (ACTION_PHRASES.some((phrase) => content.includes(phrase))) {
    category = "Task/Action";
    signals.push("action phrase");
  } else {
    category = "FYI";
    signals.push("informational message, no reply requested");
  }

  const { score, reasons } = scoreEmail(email);
  return {
    category,
    score,
    reasons,
    signals,
    trace: `[perceive] sender=${email.sender}; subject="${email.subject}"\n[decide] category=${category} score=${score} because: ${reasons.join(", ")}\n[act] local rules selected ${category.toLowerCase()} handling\n[respond] summary, tasks, and reply draft are ready`,
  };
}

export class RuleBrain {
  constructor() {
    this.name = "RuleBrain";
  }

  classify(email) {
    return classifyEmail(email);
  }
}

export class LLMBrain extends RuleBrain {
  constructor(apiKey, model = "gpt-4o-mini") {
    super();
    this.name = "LLMBrain";
    this.apiKey = apiKey;
    this.model = model;
  }

  async classify(email) {
    const ruleResult = super.classify(email);
    if (!this.apiKey) return ruleResult;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          messages: [
            {
              role: "system",
              content: "Classify the message into exactly one of Urgent, Needs reply, Task/Action, FYI, Newsletter, Spam. Return only the category.",
            },
            { role: "user", content: `From: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body}` },
          ],
        }),
      });
      if (!response.ok) throw new Error(`Provider returned ${response.status}`);
      const data = await response.json();
      const category = data.choices?.[0]?.message?.content?.trim();
      const allowed = ["Urgent", "Needs reply", "Task/Action", "FYI", "Newsletter", "Spam"];
      if (!allowed.includes(category)) throw new Error("Provider returned an unknown category");
      return {
        ...ruleResult,
        category,
        trace: ruleResult.trace.replace("[decide]", `[decide] LLM suggestion=${category}; rules had=${ruleResult.category};`),
      };
    } catch (error) {
      return { ...ruleResult, llmError: error.message, trace: `${ruleResult.trace}\n[respond] optional LLM failed; used RuleBrain instead` };
    }
  }
}
