import { cn } from "@/lib/utils";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { DefaultNodes } from "./nodes/default-nodes";
import CodeHighlightPlugin from "./plugins/code-highlight-plugin";
import { FloatingMenuPlugin } from "./plugins/floating-menu-plugin";
import { HighlighterPlugin } from "./plugins/highlighter-plugin";
import { OnChangePlugin } from "./plugins/on-change-plugin";
import { theme } from "./theme";

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: unknown) {
  throw error;
}

export function Editor({
  className,
  readOnly = false,
  initialContent,
  padding = 0,
  onChange,
  ...props
}: {
  className?: string;
  padding?: number;
  initialContent?: string;
  readOnly?: boolean;
  onChange?: (arg0: string) => void;
} & React.ComponentProps<"div">) {
  const initialConfig = {
    namespace: "InitialEditor",
    theme,
    onError,
    editable: !readOnly,
    nodes: [...DefaultNodes],
    editorState: () => $convertFromMarkdownString(initialContent ?? "", TRANSFORMERS),
  };

  return (
    <div className={cn("relative h-full", className)} {...props}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={
            <ContentEditable
              style={{
                padding,
              }}
              className="content-editable"
              aria-placeholder={"Enter some text..."}
              placeholder={
                <div
                  className="editor-placeholder"
                  style={{
                    padding,
                  }}
                >
                  {readOnly ? "" : "Enter some text..."}
                </div>
              }
            />
          }
        />
        <HistoryPlugin />
        <HighlighterPlugin />
        <MarkdownShortcutPlugin />
        <ListPlugin />
        <CodeHighlightPlugin />
        {!readOnly && <FloatingMenuPlugin />}

        {/* Editing */}
        {onChange && !readOnly && <OnChangePlugin onChange={onChange} />}
      </LexicalComposer>
    </div>
  );
}
