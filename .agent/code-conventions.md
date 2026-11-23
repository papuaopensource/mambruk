# Comment Conventions

- Default to none. A comment earns its place for a non-obvious why or constraint.
- One line at the top of a file says what it holds, when the name does not.
- Before a function that needs it: one plain line starting with its name,
  Go-style (`// unseal returns ...`).
- If a comment is needed to explain what a function or variable does, fix the
  name instead.
- Short and flat, one line where possible, two at most. A reason longer than
  that goes in the commit message.
- No colons or semicolons. Use a comma, a full stop or `so`.
- No adverbs ("only", "safely", "usually", "never", "already"), no tags such as
  `TODO` or `NOTE`.
- Do not narrate consequences, explain what an attacker could do, or restate
  the code.
- Do not keep dead code in comments.
- Never delete or reword comments the user wrote, even when they break these
  rules; point it out at most.

Example:

```js
// Short code, alias and handle shapes. Plain JS so node --test can import it.

// 4-32 chars, no dots, so /favicon.ico and /robots.txt never reach D1.
export const CODE_RE = /^[A-Za-z0-9_-]{4,32}$/

// resolveTheme merges the owner's valid overrides onto the preset.
export function resolveTheme(themeName, overridesJson) {
```
