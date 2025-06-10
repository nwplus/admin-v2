import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";

import { DEFAULT_TRANSFORMERS } from "../markdown-transformers";

export default function MarkdownPlugin() {
  return <MarkdownShortcutPlugin transformers={DEFAULT_TRANSFORMERS} />;
}
