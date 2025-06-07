import { computePosition } from "@floating-ui/dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { usePointerInteractions } from "@/hooks/use-pointer-interactions";
import { $getSelection, $isRangeSelection } from "lexical";
import { FloatingMenu, type FloatingMenuCoords } from "./floating-menu";

export function FloatingMenuPlugin() {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<FloatingMenuCoords>(undefined);
  const [editor] = useLexicalComposerContext();

  const { isPointerDown, isPointerReleased } = usePointerInteractions();

  const calculatePosition = useCallback(() => {
    const domSelection = getSelection();
    const domRange = domSelection?.rangeCount !== 0 && domSelection?.getRangeAt(0);

    if (!domRange || !ref.current || isPointerDown) return setCoords(undefined);

    computePosition(domRange, ref.current, { placement: "top" })
      .then((pos) => {
        setCoords({ x: pos.x, y: pos.y - 10 });
      })
      .catch(() => {
        setCoords(undefined);
      });
  }, [isPointerDown]);

  const $handleSelectionChange = useCallback(() => {
    if (editor.isComposing() || editor.getRootElement() !== document.activeElement) {
      setCoords(undefined);
      return;
    }

    const selection = $getSelection();

    if ($isRangeSelection(selection) && !selection.anchor.is(selection.focus)) {
      calculatePosition();
    } else {
      setCoords(undefined);
    }
  }, [editor, calculatePosition]);

  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => $handleSelectionChange());
    });
    return unregisterListener;
  }, [editor, $handleSelectionChange]);

  const show = coords !== undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: speed
  useEffect(() => {
    if (!show && isPointerReleased) {
      editor.getEditorState().read(() => $handleSelectionChange());
    }
  }, [isPointerReleased, $handleSelectionChange, editor]);

  return (
    typeof document !== "undefined" &&
    createPortal(<FloatingMenu ref={ref} editor={editor} coords={coords} />, document.body)
  );
}
