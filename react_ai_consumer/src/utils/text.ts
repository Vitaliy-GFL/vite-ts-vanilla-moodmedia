// mframe strings carry a line break as a literal "\n" (multiline params render broken in
// Harmony, see docs/mframe.md). Turns it, and "\r\n", into a real newline; render the
// result in an element with the `pre-line` class.
export function withLineBreaks(text: string): string {
  return text.replace(/\\n|\r\n/g, "\n");
}
