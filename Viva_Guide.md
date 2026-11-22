# EmailPilot Viva Guide

1. **What is EmailPilot?** It is a local email-management agent that observes a message, decides a category and priority, runs useful tools, and explains the result.

2. **What is an agent here?** It is code that follows the Perceive–Decide–Act–Respond loop and chooses one of several actions.

3. **How does it perceive an email?** It reads sender, role, subject, body and time.

4. **How are categories decided?** Fixed rules check spam and newsletter markers first, then urgency words, questions and action phrases.

5. **How is the priority score calculated?** It starts at 1, adds urgency, sender importance and questions, subtracts spam markers, and stays between 1 and 10.

6. **Why use rule-based logic?** Rules are fast, predictable, transparent and usable offline.

7. **Why include an optional LLM?** It can handle wider language variation, but rules remain a reliable fallback.

8. **How is the API key protected?** It is stored only in React component memory and is never persisted or sent to this project's server.

9. **What happens when the LLM fails?** The catch block returns the RuleBrain result and shows a fallback explanation.

10. **How does summary work?** It is extractive: the first two sentences are reused rather than generated.

11. **How are tasks extracted?** The code finds action verbs such as submit, upload or review and checks for a deadline after "by".

12. **How is reply tone handled?** The user chooses one of three simple templates: formal, friendly or brief.

13. **What memory does the project use?** Browser memory holds the selected email, tasks and API key during the page session. It has no database.

14. **How is it different from a chatbot?** It is goal-oriented and tool-driven: it operates on an email through defined stages rather than only generating text.

15. **What are its main limitations?** It is sample-only, uses approximate rules, has no real Gmail permission, and cannot understand every context or language.
