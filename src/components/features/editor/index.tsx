import { cn } from "@/lib/utils";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { DefaultNodes } from "./nodes/default-nodes";
import CodeHighlightPlugin from "./plugins/code-highlight-plugin";
import { FloatingMenuPlugin } from "./plugins/floating-menu-plugin";
import { HighlighterPlugin } from "./plugins/highlighter-plugin";
import { OnChangePlugin } from "./plugins/on-change-plugin";
import { StaticMenuPlugin } from "./plugins/static-menu-plugin";
import { theme } from "./theme";

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
      // attributes: { rel: 'noreferrer', target: '_blank' }, // Optional link attributes
    };
  },
];

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
  placeholder = "Enter some text...",
  onContentChange,
  ...props
}: {
  className?: string;
  padding?: number;
  initialContent?: string;
  readOnly?: boolean;
  placeholder?: string;
  onContentChange?: (arg0: string) => void;
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
        <StaticMenuPlugin />
        <RichTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={
            <ContentEditable
              style={{
                padding,
              }}
              className="max-h-[100vh] overflow-auto content-editable"
              aria-placeholder={placeholder}
              placeholder={
                <div
                  className="editor-placeholder"
                  style={{
                    padding,
                  }}
                >
                  {readOnly ? "" : placeholder}
                </div>
              }
            />
          }
        />
        <TabIndentationPlugin />
        <HistoryPlugin />
        <HighlighterPlugin />
        <MarkdownShortcutPlugin />
        <ListPlugin />
        <LinkPlugin />
        <CodeHighlightPlugin />
        <AutoLinkPlugin matchers={MATCHERS} />
        <ClickableLinkPlugin />
        {!readOnly && <FloatingMenuPlugin />}

        {/* Editing */}
        {onContentChange && !readOnly && <OnChangePlugin onChange={onContentChange} />}
      </LexicalComposer>
    </div>
  );
}
