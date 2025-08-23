import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useRef } from "react";
import { StaticMenu } from "./static-menu";

export function StaticMenuPlugin() {
  const ref = useRef<HTMLDivElement>(null);

  const [editor] = useLexicalComposerContext();

  return <StaticMenu ref={ref} editor={editor} />;
}
