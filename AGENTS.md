# TheSecurityVault — Writing Style Guide

This document defines the writing style used across blog posts on TheSecurityVault. All posts must conform to these guidelines. The canonical reference posts are the three most recent:

- `2026-06-03-supply_chain_attacks` — Protecting developers from supply chain attacks
- `2025-12-12-obfuscating_js_with_vm` — Building MirageVM
- `2025-05-07-bots-to-the-rescue-how-i-built-an-ai-security-wingman` — Bots to the Rescue

---

## Voice & Tone

- **First-person, practitioner voice.** Write from lived experience: "I built", "I've been implementing", "Here's what I found". Never third-person or royal "we" unless referring to a real team context.
- **Confident and direct.** No hedging with "maybe", "perhaps", "I think" unless genuinely uncertain. State things plainly.
- **Opinionated where warranted.** "This is, by a wide margin, the most impactful control." "That's the goal." Take positions.
- **Technical but human.** Deep technical content is expected; padding is not. Skip explanatory throat-clearing.

---

## Structure & Headers

- Use `##` for all primary section headers. `###` is reserved for subsections inside an existing `##` section only. Never open a post body with `###` as the first heading level.
- **Headers are statements or noun phrases, not questions.** Write "How Antivirus Signatures Work", not "So how does antivirus work?". Remove question-mark headers.
- Avoid headers that are just "Introduction", "Overview", or "Summary". Name sections by what they actually cover.
- No concluding "Summary" or "TL;DR" section at the end unless the post is genuinely a reference doc. Just end when the content ends.

---

## Openings

- **Jump straight into the content.** The first sentence should establish stakes, context, or the core problem. No "In this post I will..." or "Today we are going to explore..." or "Once again, I bring a topic that..."
- The opening paragraph sets the scene: why this matters, what's actually happening, or what the problem is. One tight paragraph is enough before the first section.

---

## Sentence Style

- Mix short punchy sentences with longer technical ones. Short sentences land emphasis. Longer sentences carry technical explanation.
- Active voice. "An attacker injects a payload" not "A payload is injected by an attacker."
- No filler transitions: "OK, so...", "Well, ...", "And...", "But yeah...", "Lets start by..."
- Contractions are fine (it's, that's, doesn't, can't). Formal register is not required.

---

## Inline Formatting

- **Bold text** (`**term**`) for key concepts, proper names of tools or techniques being introduced, or the lead-in of a list item that has a following explanation. Use it sparingly (one or two per section, not for decoration).
- Code blocks for all code, commands, and config snippets, even one-liners.
- Inline code (`backticks`) for identifiers, filenames, flags, method names referenced in prose.

---

## Lists

- Use bullet lists when content is genuinely enumerable and parallel.
- For lists with explanation, use bold lead-ins: `**Term:** explanation of the term.`
- Avoid converting flowing prose into bullet lists. If it reads naturally as sentences, keep it that way.
- Numbered lists only for true sequential steps.

---

## Technical Content

- Ground claims in specifics: real tool names, real CVEs, real campaigns, actual code. No vague references.
- Code examples should be complete enough to run or understand. Add a brief sentence before and/or after explaining what it shows — don't leave code blocks floating without context.
- Image references: keep `[![alt](path)](path)` format. Keep all Hugo shortcodes unchanged.
- External links should be inline `[anchor text](url)` — no bare URLs in prose.

---

## Endings

- End when the content is done. No "To wrap up", "In conclusion", "I hope you enjoyed this post", or trailing summary. The last section should deliver the final substantive point.
- A closing practical statement is fine: "The combination of X and Y creates good layered coverage." Just keep it tight.

---

## Common Anti-Patterns to Avoid

| Anti-pattern | Replace with |
| --- | --- |
| `So what is X?` (question header) | `## What X Is` or a direct statement header |
| `Lets start by...` | Just start |
| `I'm going to talk about...` | Just talk about it |
| `This time I'm not going to...` | Get to the point |
| `its`, `doesnt`, `youre` | `it's`, `doesn't`, `you're` |
| `### Header` as top-level | `## Header` |
| `Once again, I bring a topic...` | Open with the problem |
| `You can find the source code at the end` | Link inline when relevant |
| `;TLDR` / `TL;DR` section | Integrate key points into the body |
| `Ok, so...` | Remove |
| `In this article I'm going to...` | Start the article |
| Em dash (`—`) | Use colons, parentheses, or periods instead |

---

## Frontmatter

Keep all existing frontmatter fields intact. Do not change `title`, `description`, `date`, `keywords`, `aliases`, `type`, `category`, `preview`, `lastmod`, or `draft` values.
