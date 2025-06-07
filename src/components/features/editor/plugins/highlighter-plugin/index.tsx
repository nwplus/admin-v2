import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect } from "react";
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical";

export function HighlighterPlugin() {
  const [editor] = useLexicalComposerContext();

  const $handleSelectionChange = useCallback(() => {
    if (editor.isComposing() || editor.getRootElement() !== document.activeElement) {
      return;
    }

    const selection = $getSelection();

    if ($isRangeSelection(selection) && !selection.anchor.is(selection.focus)) {
      const selectedText = selection.getTextContent();

      // TODO
    }
  }, [editor]);

  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => $handleSelectionChange());
    });
    return unregisterListener;
  }, [editor, $handleSelectionChange]);

  return null;
}
