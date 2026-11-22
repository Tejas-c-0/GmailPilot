"""EmailPilot rule-based email agent.

This small, self-contained module mirrors the website's offline agent logic.
It reads an email dictionary, scores it, labels it, and produces useful actions.
"""

import re

URGENCY_WORDS = ["urgent", "asap", "today", "tomorrow", "deadline", "due"]
IMPORTANT_SENDERS = ["professor", "dr.", "hod", "manager", "placement cell", "mentor"]
SPAM_MARKERS = ["win", "free", "% off", "unsubscribe", "lottery", "claim your prize"]


def score_email(email):
    """Calculate a priority score from 1 to 10 and return readable reasons."""
    content = f"{email['subject']} {email['body']}".lower()
    sender = f"{email['sender']} {email.get('role', '')}".lower()
    reasons = []
    score = 1

    urgency = [word for word in URGENCY_WORDS if word in content]
    important = [word for word in IMPORTANT_SENDERS if word in sender]
    spam = [word for word in SPAM_MARKERS if word in content]

    if urgency:
        score += min(len(urgency) * 2, 5)
        reasons.append(f"urgency word: {urgency[0]}")
    if important:
        score += 2
        reasons.append(f"important sender: {important[0]}")
    if "?" in content:
        score += 1
        reasons.append("asks a question")
    if spam:
        score -= 2
        reasons.append(f"bulk/spam marker: {spam[0]}")

    score = max(1, min(10, score))
    if not reasons:
        reasons.append("no urgent or reply signals found")
    return {"score": score, "reasons": reasons}


def classify_email(email):
    """Apply one rule in each category and return the result plus a trace."""
    content = f"{email['subject']} {email['body']}".lower()
    sender = f"{email['sender']} {email.get('role', '')}".lower()

    if any(word in content for word in ["lottery", "claim your prize", "you won", "winner", "gift card"]):
        category = "Spam"
        reason = "suspicious prize or link language"
    elif any(word in content for word in ["unsubscribe", "newsletter", "weekly digest", "% off"]):
        category = "Newsletter"
        reason = "bulk-mail or unsubscribe marker"
    elif (
        ("?" in content or re.search(r"\b(let me know|could you|can you)\b", content))
        and not re.search(r"\b(urgent|asap|deadline|due)\b", content)
        and not ("tomorrow" in content and re.search(r"professor|dr\.|hod|manager|placement|mentor", sender))
    ):
        category = "Needs reply"
        reason = "question or reply request"
    elif re.search(r"\b(urgent|asap|today|tomorrow|deadline|due)\b", content):
        category = "Urgent"
        reason = "time-sensitive language"
    elif any(word in content for word in ["remember to", "please submit", "please complete", "upload the"]):
        category = "Task/Action"
        reason = "action phrase"
    else:
        category = "FYI"
        reason = "informational message, no reply requested"

    scored = score_email(email)
    trace = (
        f"[perceive] sender={email['sender']}; subject=\"{email['subject']}\"\n"
        f"[decide] category={category} score={scored['score']} because: {', '.join(scored['reasons'])}\n"
        f"[act] local rules selected {category.lower()} handling\n"
        "[respond] summary, tasks, and reply draft are ready"
    )
    return {
        "category": category,
        "score": scored["score"],
        "reasons": scored["reasons"],
        "signal": reason,
        "trace": trace,
    }


def summarize_email(email):
    """Use the first two sentences as a simple extractive summary."""
    sentences = re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", email["body"])
    return " ".join(part.strip() for part in sentences[:2])


def extract_tasks(email):
    """Find a few action sentences and a deadline named after 'by'."""
    text = f"{email['subject']}. {email['body']}"
    matches = re.findall(r"(?:submit|complete|upload|send|review|bring|register|attend|check)[^.!?]+", text, re.I)
    tasks = []
    for match in matches[:3]:
        cleaned = match.strip()
        deadline = re.search(r"\bby\s+(today|tomorrow|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b", cleaned, re.I)
        tasks.append({
            "task": cleaned[0].upper() + cleaned[1:],
            "deadline": deadline.group(1) if deadline else None,
        })
    return tasks


def draft_reply(email, tone="formal"):
    """Choose a readable reply template by tone."""
    name = email["sender"].split(" ")[0]
    if tone == "friendly":
        return f"Hi {name},\n\nThanks for reaching out! I’ve seen your note and will get back to you soon.\n\nBest,\nTejas"
    if tone == "brief":
        return f"Hi {name},\n\nThanks, noted. I’ll follow up soon.\n\nTejas"
    return f"Dear {name},\n\nThank you for your email. I have received your message and will follow up as needed.\n\nBest regards,\nTejas"


class RuleBrain:
    """The default offline brain."""

    def classify(self, email):
        return classify_email(email)


class LLMBrain(RuleBrain):
    """A demonstration stub: website integration is optional and falls back to rules."""

    def __init__(self, api_key=None):
        self.api_key = api_key

    def classify(self, email):
        # Keep Python independent and offline. The key is never required or stored.
        return super().classify(email)


if __name__ == "__main__":
    sample = {
        "sender": "Dr. Meera Rao",
        "role": "Professor",
        "subject": "Project report due tomorrow",
        "body": "Please submit your mini project report by tomorrow at 5 PM.",
    }
    result = classify_email(sample)
    print(result["trace"])
    print("Summary:", summarize_email(sample))
    print("Tasks:", extract_tasks(sample))
