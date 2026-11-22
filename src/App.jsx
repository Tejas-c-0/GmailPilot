import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bot, Check, ChevronRight, Clipboard, Clock3, Copy,
  Download, Menu, Moon, Search, Send, Sun, X,
} from "lucide-react";
import { sampleInbox } from "./agent/sampleInbox.js";
import { RuleBrain, LLMBrain } from "./agent/brain.js";
import { classifyEmail } from "./agent/brain.js";
import { draftReply, extractTasks, scheduleFollowup, summarizeEmail } from "./agent/tools.js";

const HeroVisual = lazy(() => import("./components/HeroVisual.jsx"));

const categories = ["Urgent", "Needs reply", "Task/Action", "FYI", "Newsletter", "Spam"];

function scrollTo(id) {
  document.querySelector(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function Nav() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem("emailpilot-mode") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    localStorage.setItem("emailpilot-mode", mode);
  }, [mode]);
  const links = [["Problem", "problem"], ["How it works", "workflow"], ["Demo", "demo"], ["Results", "results"], ["Report", "architecture"], ["Code", "code"]];
  return (
    <header className="nav">
      <div className="nav__inner">
        <button className="wordmark" onClick={() => scrollTo("#top")} aria-label="EmailPilot home">
          <span className="wordmark__mark"><Send size={16} /></span>EmailPilot
        </button>
        <nav className={open ? "nav__links is-open" : "nav__links"} aria-label="Main navigation">
          {links.map(([label, id]) => <button key={id} onClick={() => { scrollTo(`#${id}`); setOpen(false); }}>{label}</button>)}
        </nav>
        <div className="nav__actions">
          <button className="icon-button" onClick={() => setMode(mode === "dark" ? "light" : "dark")} aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
            {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="nav__try" onClick={() => scrollTo("#demo")}>Try demo</button>
          <button className="icon-button menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__grid">
        <div className="hero__copy" data-reveal>
          <p className="hero__kicker"><span>Agent 01</span> Personal productivity</p>
          <h1>Your inbox, handled by an AI agent</h1>
          <p className="hero__lead">EmailPilot perceives, prioritises and acts on your email with visible reasoning, not a black box.</p>
          <div className="hero__actions">
            <button className="button button--primary" onClick={() => scrollTo("#demo")}>Try the demo <ArrowRight size={17} /></button>
            <button className="button button--quiet" onClick={() => scrollTo("#architecture")}>View report</button>
          </div>
        </div>
        <Suspense fallback={<div className="hero-preview hero-preview--fallback" />}>
          <HeroVisual />
        </Suspense>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="section" id="problem">
      <div className="container">
        <div className="section-heading" data-reveal>
          <h2>One inbox. Too much attention.</h2>
          <p className="lead">Email has a human cost: important messages compete with subscriptions and spam, while actions slip away.</p>
        </div>
        <div className="problem-grid">
          <article className="problem-copy">
            <h3>Problem statement</h3>
            <p>Students and professionals receive messages with different urgency, sender importance and required actions. Manual scanning is slow, inconsistent and easy to interrupt.</p>
            <h3>Proposed solution</h3>
            <p>EmailPilot turns an email into a classified, explained and actionable item. It uses deterministic rules by default, and an optional language model when the user provides a key.</p>
          </article>
          <div className="benefit-list">
            {[
              ["01", "Faster triage", "Priority, category and score appear together."],
              ["02", "Clear reasons", "Every decision has a short reasoning trace."],
              ["03", "Useful actions", "Summaries, tasks and reply drafts stay in context."],
            ].map(([number, title, text]) => (
              <article className="benefit" key={number}>
                <span>{number}</span><div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const workflowSteps = [
  { name: "Perceive", code: "read(sender, subject, body, time)", text: "Collect the sender, subject, body and receive time before making a decision." },
  { name: "Decide", code: "scoreEmail(email)\nclassifyEmail(email)", text: "Add urgency words, sender importance, questions and spam markers to calculate a 1–10 score." },
  { name: "Act", code: "summarizeEmail(email)\nextractTasks(email)\ndraftReply(email, tone)", text: "Run one or more tools for summaries, tasks, labels, follow-ups and inbox search." },
  { name: "Respond", code: "return { category, score, summary, trace }", text: "Present the result together with the exact signals that led to it." },
];

function Workflow() {
  const [active, setActive] = useState(0);
  return (
    <section className="section workflow-section" id="workflow">
      <div className="container">
        <div className="section-heading" data-reveal><h2>How the agent works</h2></div>
        <div className="workflow">
          <div className="workflow-steps" role="tablist" aria-label="Agent workflow stages">
            {workflowSteps.map((step, index) => (
              <button key={step.name} role="tab" aria-selected={active === index} onClick={() => setActive(index)} className={active === index ? "workflow-step is-active" : "workflow-step"}>
                <span>{index + 1}</span><strong>{step.name}</strong><ChevronRight size={16} />
              </button>
            ))}
          </div>
          <div className="workflow-detail" role="tabpanel">
            <div>
              <p className="stage-label">Step {active + 1}</p>
              <h3>{workflowSteps[active].name}</h3>
              <p>{workflowSteps[active].text}</p>
            </div>
            <pre><code>{workflowSteps[active].code}</code></pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [selectedId, setSelectedId] = useState(1);
  const [tone, setTone] = useState("formal");
  const [command, setCommand] = useState("");
  const [commandResponse, setCommandResponse] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mobilePane, setMobilePane] = useState("inbox");
  const [tasks, setTasks] = useState([]);
  const [followup, setFollowup] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [brainName, setBrainName] = useState("RuleBrain");
  const [filtered, setFiltered] = useState(sampleInbox);

  const selected = filtered.find((email) => email.id === selectedId) ?? filtered[0] ?? sampleInbox[0];
  const analysis = useMemo(() => classifyEmail(selected), [selected]);

  async function runCommand(event) {
    event?.preventDefault();
    const text = command.trim().toLowerCase();
    if (!text) return;
    setThinking(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (text.includes("urgent")) {
      setFiltered(sampleInbox.filter((email) => classifyEmail(email).category === "Urgent"));
      setCommandResponse("Showing 3 urgent emails.");
      setMobilePane("inbox");
    } else if (text.includes("digest")) {
      setCommandResponse("Daily digest: 3 urgent, 3 FYI, 3 needing replies, 1 task, 1 newsletter and 1 spam.");
    } else if (text.includes("tasks due") || text.includes("task")) {
      setCommandResponse(`Found ${sampleInbox.reduce((count, email) => count + extractTasks(email).length, 0)} extracted action items.`);
    } else if (text.includes("reply")) {
      setMobilePane("ai");
      setCommandResponse(`Reply draft for email ${selected.id} is open on the right.`);
    } else if (text.includes("search")) {
      setFiltered(sampleInbox.filter((email) => `${email.sender} ${email.subject}`.toLowerCase().includes(text.replace("search", "").trim())));
      setCommandResponse("Inbox search completed.");
    } else {
      setFiltered(sampleInbox);
      setCommandResponse('Try “show urgent emails”, “daily digest”, “tasks due this week”, or “reply to email 3 politely”.');
    }
    setThinking(false);
  }

  async function switchBrain(name) {
    setBrainName(name);
    if (name === "LLMBrain" && apiKey.trim()) {
      const brain = new LLMBrain(apiKey.trim());
      const result = await brain.classify(selected);
      setCommandResponse(result.llmError ? `LLM unavailable. ${result.llmError}. Rules continued.` : `LLM classification received: ${result.category}.`);
    }
  }

  function copyReply() {
    navigator.clipboard?.writeText(draftReply(selected, tone));
  }

  function addTask(task) {
    setTasks((current) => current.some((item) => item.task === task.task) ? current : [...current, task]);
  }

  function setFollowUp() {
    if (!followup) return;
    scheduleFollowup(selected, followup);
    setCommandResponse(`Follow-up scheduled locally for ${followup}.`);
  }

  return (
    <section className="section demo-section" id="demo">
      <div className="container demo-heading">
        <div><p className="stage-label">Live demo</p><h2>See the agent in an inbox.</h2></div>
        <p className="demo-status"><span />Runs offline with fictional data</p>
      </div>
      <div className="container">
        <form className="command-bar" onSubmit={runCommand}>
          <Search size={18} />
          <input value={command} onChange={(event) => setCommand(event.target.value)} aria-label="Natural language inbox command" placeholder="Ask EmailPilot: show urgent emails" />
          <button type="submit" aria-label="Run command"><ArrowRight size={17} /></button>
        </form>
        {commandResponse && <p className="command-response" role="status">{thinking ? "EmailPilot is thinking…" : commandResponse}</p>}

        <div className="demo-tabs" role="tablist" aria-label="Demo panes">
          {["inbox", "reader", "ai"].map((pane) => (
            <button key={pane} role="tab" aria-selected={mobilePane === pane} onClick={() => setMobilePane(pane)}>
              {pane === "ai" ? "AI panel" : pane}
            </button>
          ))}
        </div>
        <div className="mail-app">
          <aside className={`mail-list pane-${mobilePane}`} aria-label="Inbox email list">
            <div className="mail-list__top"><strong>Inbox</strong><span>{filtered.length}</span></div>
            {filtered.map((email) => {
              const result = classifyEmail(email);
              return (
                <button key={email.id} className={selected.id === email.id ? "mail-row is-selected" : "mail-row"} onClick={() => { setSelectedId(email.id); setMobilePane("reader"); }}>
                  <span className={`avatar avatar--${email.color}`}>{email.avatar}</span>
                  <span className="mail-row__body">
                    <span className="mail-row__line"><strong>{email.sender}</strong><time>{email.time}</time></span>
                    <span className="mail-row__subject">{email.subject}</span>
                    <span className="mail-row__meta"><span className={`category category--${result.category.toLowerCase().replace("/", "-").replace(" ", "-")}`}>{result.category}</span><span className="priority-bar"><i style={{ width: `${result.score * 10}%` }} /></span></span>
                  </span>
                </button>
              );
            })}
          </aside>

          <article className={`mail-reader pane-${mobilePane}`} aria-label="Selected email">
            <div className="mail-reader__top">
              <span className={`avatar avatar--${selected.color}`}>{selected.avatar}</span>
              <div><strong>{selected.sender}</strong><span>{selected.address}</span></div>
              <time>{selected.time}</time>
            </div>
            <h3>{selected.subject}</h3>
            <p>{selected.body}</p>
          </article>

          <aside className={`ai-panel pane-${mobilePane}`} aria-label="AI analysis panel">
            <div className="ai-panel__head">
              <div><Bot size={17} /><strong>Agent analysis</strong></div>
              <select value={brainName} onChange={(event) => switchBrain(event.target.value)} aria-label="Select agent brain">
                <option>RuleBrain</option><option>LLMBrain</option>
              </select>
            </div>
            {brainName === "LLMBrain" && (
              <label className="api-key">Optional API key
                <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Stored in memory only" />
              </label>
            )}
            <div className="ai-section ai-result">
              <div><span>Category</span><strong>{analysis.category}</strong></div>
              <div><span>Priority</span><strong>{analysis.score}/10</strong></div>
              <div className="score-track"><i style={{ width: `${analysis.score * 10}%` }} /></div>
              <p>{analysis.reasons.join("; ")}</p>
            </div>
            <div className="ai-section">
              <h4>Summary</h4>
              <p>{summarizeEmail(selected)}</p>
            </div>
            <div className="ai-section">
              <h4>Extracted tasks</h4>
              {extractTasks(selected).length ? extractTasks(selected).map((task, index) => (
                <div className="task-row" key={index}><span><Check size={13} />{task.task}</span><button onClick={() => addTask(task)} aria-label={`Add ${task.task} to tasks`}><Clipboard size={14} /></button></div>
              )) : <p>No concrete task detected.</p>}
              {tasks.length > 0 && <small>{tasks.length} item{tasks.length === 1 ? "" : "s"} added locally</small>}
            </div>
            <div className="ai-section">
              <div className="tone-row"><h4>Reply draft</h4><select value={tone} onChange={(event) => setTone(event.target.value)} aria-label="Reply tone"><option value="formal">Formal</option><option value="friendly">Friendly</option><option value="brief">Brief</option></select></div>
              <pre className="reply-draft">{draftReply(selected, tone)}</pre>
              <button className="copy-button" onClick={copyReply}><Copy size={14} />Copy</button>
            </div>
            <div className="ai-section followup">
              <h4>Schedule follow-up</h4>
              <div><input type="datetime-local" value={followup} onChange={(event) => setFollowup(event.target.value)} aria-label="Follow-up date and time" /><button onClick={setFollowUp}>Schedule</button></div>
            </div>
            <div className="ai-section trace">
              <h4>Reasoning trace</h4>
              <pre>{analysis.trace}</pre>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Results() {
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  function runEvaluation() {
    setRunning(true);
    setRows([]);
    setTimeout(() => {
      setRows(sampleInbox.map((email) => {
        const predicted = classifyEmail(email).category;
        return { email: email.subject, expected: email.expected, predicted, pass: predicted === email.expected };
      }));
      setRunning(false);
    }, 500);
  }
  const passed = rows.filter((row) => row.pass).length;
  const accuracy = rows.length ? Math.round(passed / rows.length * 100) : null;
  return (
    <section className="section results-section" id="results">
      <div className="container">
        <div className="results-head">
          <div><p className="stage-label">Test and results</p><h2>Measure the agent, honestly.</h2></div>
          <button className="button button--primary" onClick={runEvaluation} disabled={running}>{running ? "Running…" : "Run evaluation"} <ArrowRight size={17} /></button>
        </div>
        {rows.length > 0 ? (
          <div className="results-body">
            <div className="accuracy"><strong>{accuracy}%</strong><span>{passed} of 12 labels passed</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Email</th><th>Expected</th><th>Predicted</th><th>Result</th></tr></thead>
                <tbody>{rows.map((row) => (
                  <tr key={row.email}><td>{row.email}</td><td>{row.expected}</td><td>{row.predicted}</td><td><span className={row.pass ? "pass" : "fail"}>{row.pass ? "Pass" : "Fail"}</span></td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="results-empty"><Bot size={24} /><p>Run all 12 fictional emails and compare each label with its expected category.</p></div>
        )}
      </div>
    </section>
  );
}

const caseStudies = [
  {
    name: "Gmail with Gemini",
    short: "Google",
    problem: "High email volume makes scanning, summarising and writing responses slow.",
    works: "Gemini reads context in Gmail, suggests summaries and draft responses, and can answer inbox questions.",
    input: "Selected email thread and workspace context.",
    decision: "A hosted model uses message context to identify likely intent and useful output.",
    actions: "Summarise, help write, search with natural language.",
    tech: "Cloud language model; Google Workspace integration.",
    pros: "Convenient inside Gmail with strong context.",
    limits: "Cloud dependency, account permissions, and variable model output.",
  },
  {
    name: "Microsoft Copilot",
    short: "Outlook",
    problem: "Outlook users need faster review of long threads and scheduled follow-ups.",
    works: "Copilot uses enterprise context to summarise a thread and help produce an appropriate reply.",
    input: "One or more Outlook messages plus user instruction.",
    decision: "Model reasoning combines thread context, mailbox data and the prompt.",
    actions: "Summarise threads, draft replies, extract next steps.",
    tech: "Microsoft Copilot stack; Microsoft 365 integration.",
    pros: "Strong for enterprise calendars and documents.",
    limits: "Licence, organisational policy and connected-data dependence.",
  },
  {
    name: "Superhuman AI",
    short: "Superhuman",
    problem: "A fast, high-volume inbox needs quick triage and repetitive writing support.",
    works: "AI writes from tone cues and can process natural-language inbox requests.",
    input: "Email text, recipient context and a direct instruction.",
    decision: "Generative output is selected and shaped from the prompt and message context.",
    actions: "Draft replies, rewrite text, search or organise messages.",
    tech: "Dedicated AI assistant integrated with a premium email client.",
    pros: "Fast workflow and keyboard-first interaction.",
    limits: "Paid product, cloud processing and less visible decision rules.",
  },
];

function CaseStudies() {
  const [active, setActive] = useState(0);
  const item = caseStudies[active];
  return (
    <section className="section cases-section" id="cases">
      <div className="container">
        <div className="section-heading"><h2>Three systems, three approaches.</h2></div>
        <div className="case-tabs" role="tablist" aria-label="Case studies">
          {caseStudies.map((study, index) => <button role="tab" aria-selected={active === index} key={study.name} onClick={() => setActive(index)}><span>{study.short}</span>{study.name}</button>)}
        </div>
        <article className="case-grid">
          {[
            ["Problem", item.problem], ["How it works", item.works], ["Input", item.input], ["Decision process", item.decision],
            ["Actions", item.actions], ["Technologies", item.tech], ["Advantages", item.pros], ["Limitations", item.limits],
          ].map(([label, value]) => <div key={label}><span>{label}</span><p>{value}</p></div>)}
        </article>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className="section architecture-section" id="architecture">
      <div className="container">
        <div className="architecture-head">
          <div><p className="stage-label">Architecture</p><h2>One loop, one visible trace.</h2></div>
          <a className="button button--quiet" href={`${import.meta.env.BASE_URL}EmailPilot_Source.zip`} download><Download size={17} />Source ZIP</a>
        </div>
        <div className="architecture-map" aria-label="EmailPilot architecture diagram">
          <div className="arch-node arch-user"><span>User</span><strong>Command or email</strong></div>
          <div className="arch-line" />
          <div className="arch-node"><span>Perceive</span><strong>Read fields</strong></div>
          <div className="arch-line" />
          <div className="arch-node arch-brain"><span>Decide</span><strong>RuleBrain | LLMBrain</strong></div>
          <div className="arch-line" />
          <div className="arch-node arch-tools"><span>Tools</span><strong>Summarise · Label · Reply</strong></div>
          <div className="arch-line" />
          <div className="arch-node"><span>Memory</span><strong>Task list in memory</strong></div>
          <div className="arch-line" />
          <div className="arch-node arch-user"><span>Respond</span><strong>UI and trace</strong></div>
        </div>
        <div className="tech-row">
          {["React", "Vite", "JavaScript", "Rule engine", "Optional API", "Python"].map((tech) => <span key={tech}>{tech}</span>)}
        </div>
      </div>
    </section>
  );
}

const codeExamples = {
  classify: {
    title: "classifyEmail",
    code: `export function classifyEmail(email) {
  const text = (email.subject + " " + email.body).toLower
  case();

  if (text.includes("unsubscribe")) return "Newsletter";
  if (text.includes("you won")) return "Spam";
  if (/urgent|today|tomorrow/.test(text)) return "Urgent";
  if (text.includes("?")) return "Needs reply";
  return "FYI";
}`,
    explanation: ["Combine the subject and body", "Check each category in a fixed priority", "Return the category for tools and the trace"],
  },
  score: {
    title: "scoreEmail",
    code: `let score = 1;
if (URGENT_WORDS.some(w => text.includes(w))) score += 3;
if (IMPORTANT_SENDERS.some(w => sender.includes(w))) score += 2;
if (text.includes("?")) score += 1;
if (SPAM_MARKERS.some(w => text.includes(w))) score -= 2;

return Math.max(1, Math.min(10, score));`,
    explanation: ["Start with a baseline score of 1", "Add urgency and importance signals", "Clamp the final number to 1–10"],
  },
  tasks: {
    title: "extractTasks",
    code: `export function extractTasks(email) {
  const text = email.subject + ". " + email.body;
  const matches = text.match(
    /(submit|complete|upload|send|review)[^.!?]+/gi
  ) ?? [];
  return matches.map(task => ({ task: task.trim() }));
}`,
    explanation: ["Read subject and body together", "Match action verbs and the rest of a sentence", "Return a simple task object"],
  },
  reply: {
    title: "draftReply",
    code: `export function draftReply(email, tone) {
  const name = email.sender.split(" ")[0];
  if (tone === "brief") {
    return \`Hi \${name},\\n\\nThanks, noted.\\n\\nTejas\`;
  }
  return \`Dear \${name},\\n\\nThank you for your email.\`;
}`,
    explanation: ["Use the first word of the sender name", "Choose a template by tone", "Return a readable draft to copy"],
  },
};

function Code() {
  const [active, setActive] = useState("classify");
  const example = codeExamples[active];
  return (
    <section className="section code-section" id="code">
      <div className="container">
        <div className="architecture-head">
          <div><p className="stage-label">Code explained</p><h2>Read the small pieces.</h2></div>
        </div>
        <div className="code-layout">
          <div className="code-tabs" role="tablist" aria-label="Code examples">
            {Object.entries(codeExamples).map(([key, value]) => <button key={key} role="tab" aria-selected={active === key} onClick={() => setActive(key)}>{value.title}</button>)}
          </div>
          <div className="code-window">
            <div className="code-window__top"><span /><span /><span /><strong>{example.title}.js</strong></div>
            <pre><code>{example.code}</code></pre>
          </div>
          <ol className="code-explanation">{example.explanation.map((line, index) => <li key={line}><span>{index + 1}</span><p>{line}</p></li>)}</ol>
        </div>
      </div>
    </section>
  );
}

function Conclusion() {
  return (
    <section className="section conclusion-section" id="conclusion">
      <div className="container conclusion-grid">
        <article>
          <p className="stage-label">Limitations</p>
          <h2>Clear boundaries.</h2>
          <p>RuleBrain cannot understand every paraphrase. The browser stores no mailbox data. LLMBrain is optional and can only be enabled with a key supplied for the current session.</p>
        </article>
        <article>
          <p className="stage-label">Future work</p>
          <h2>Extend the same loop.</h2>
          <p>Future versions could add a Gmail API connection, persistent local memory, calendar integration, multilingual models and a larger evaluation dataset.</p>
        </article>
        <article className="conclusion-statement">
          <p>Conclusion</p>
          <strong>EmailPilot demonstrates that a small, explainable agent can make everyday email more manageable.</strong>
        </article>
      </div>
    </section>
  );
}

function About() {
  return (
    <footer className="footer" id="about">
      <div className="container footer__grid">
        <div><span className="wordmark"><span className="wordmark__mark"><Send size={16} /></span>EmailPilot</span><p>AI Agents — Case Studies and Practical Implementation</p></div>
        <dl>
          <dt>Presenter</dt><dd>Tejas C.</dd>
          <dt>USN</dt><dd>ENG25CS0055</dd>
          <dt>Section</dt><dd>3A</dd>
          <dt>University</dt><dd>Dayananda Sagar University</dd>
        </dl>
      </div>
    </footer>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    let lenis;
    let gsapInstance;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    (async () => {
      if (!reduce) {
        const [{ default: Lenis }, gsapModule] = await Promise.all([import("lenis"), import("gsap")]);
        const { gsap } = gsapModule;
        gsapInstance = gsap;
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      }
    })();
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      lenis?.destroy();
      gsapInstance?.ticker.remove(() => {});
    };
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <Workflow />
        <Demo />
        <Results />
        <CaseStudies />
        <Architecture />
        <Code />
        <Conclusion />
      </main>
      <About />
    </>
  );
}
