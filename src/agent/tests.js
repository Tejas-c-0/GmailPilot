import { classifyEmail } from "./brain.js";
import { sampleInbox } from "./sampleInbox.js";
import { draftReply, extractTasks, searchInbox, summarizeEmail } from "./tools.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const evaluations = sampleInbox.map((email) => {
  const predicted = classifyEmail(email).category;
  return { id: email.id, expected: email.expected, predicted, pass: email.expected === predicted };
});

const passed = evaluations.filter((item) => item.pass).length;
assert(passed === 12, `Expected 12/12 correct labels, got ${passed}/12`);
assert(summarizeEmail(sampleInbox[0]).split(/[.!?]+/).filter(Boolean).length <= 2, "Summary should keep at most two sentences");
assert(extractTasks(sampleInbox[0]).some((task) => task.deadline), "Deadline phrase should be extracted");
assert(draftReply(sampleInbox[6], "friendly").includes("Hi Aarav"), "Friendly reply should use the sender name");
assert(searchInbox(sampleInbox, "hackathon").length === 1, "Inbox search should find matching subjects");
console.log(`EmailPilot agent tests: ${passed}/${evaluations.length} labels correct; tool checks passed.`);
