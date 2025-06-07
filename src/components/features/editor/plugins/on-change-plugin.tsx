// import debounce from "lodash/debounce";
// import type { EditorState } from "lexical";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export function OnChangePlugin({
  onChange,
  debounceTime = 250,
}: {
  onChange: (arg0: string) => void;
  debounceTime?: number;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Create a debounced version of the onChange handler
    // const debouncedOnChange = debounce((editorState: EditorState) => {
    //   editorState.read(() => {
    //     const markdown = $convertToMarkdownString(TRANSFORMERS);
    //     onChange(markdown);
    //   });
    // }, debounceTime);

    // Register listener for editor updates
    return editor.registerUpdateListener(({ editorState }) => {
      // Call the onChange handler with the updated editor state
      // debouncedOnChange(editorState);

      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange(markdown);
      });
    });
  }, [
    editor,
    onChange,
    // debounceTime
  ]);

  return null;
}
