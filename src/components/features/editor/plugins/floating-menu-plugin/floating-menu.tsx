import { Button } from "@/components/ui/button";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import type { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { Bold, Code, Italic, List, ListOrdered, Strikethrough, Underline } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";

export type FloatingMenuCoords = { x: number; y: number } | undefined;

type FloatingMenuState = {
  isBold: boolean;
  isCode: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  isOL: boolean;
  isUL: boolean;
};

type FloatingMenuProps = {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
  coords: FloatingMenuCoords;
};

export const FloatingMenu = forwardRef<HTMLDivElement, FloatingMenuProps>(
  function FloatingMenu(props, ref) {
    const { editor, coords } = props;
    const shouldShow = coords !== undefined;
    const [lastValidCoords, setLastValidCoords] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
      if (coords) {
        setLastValidCoords({ x: coords.x, y: coords.y });
      }
    }, [coords]);

    const [state, setState] = useState<FloatingMenuState>({
      isBold: false,
      isCode: false,
      isItalic: false,
      isStrikethrough: false,
      isUnderline: false,
      isOL: false,
      isUL: false,
    });

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          setState({
            isBold: selection.hasFormat("bold"),
            isCode: selection.hasFormat("code"),
            isItalic: selection.hasFormat("italic"),
            isStrikethrough: selection.hasFormat("strikethrough"),
            isUnderline: selection.hasFormat("underline"),
            isOL: selection.getNodes().some((node) => {
              let parent = node.getParent();
              while (parent) {
                if ($isListNode(parent) && parent.getListType() === "number") {
                  return true;
                }
                parent = parent.getParent();
              }
              return false;
            }),
            isUL: selection.getNodes().some((node) => {
              let parent = node.getParent();
              while (parent) {
                if ($isListNode(parent) && parent.getListType() === "bullet") {
                  return true;
                }
                parent = parent.getParent();
              }
              return false;
            }),
          });
        });
      });
      return unregisterListener;
    }, [editor]);

    return (
      <div
        ref={ref}
        className="flex items-center justify-between gap-1 rounded-md bg-background p-1 shadow-lg transition-all duration-200"
        aria-hidden={!shouldShow}
        style={{
          position: "absolute",
          zIndex: 777,
          top: coords?.y ?? lastValidCoords?.y ?? 0,
          left: coords?.x ?? lastValidCoords?.x ?? 0,
          visibility: shouldShow ? "visible" : "hidden",
          opacity: shouldShow ? 1 : 0,
          transform: shouldShow ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <Button
          aria-label="Format text as bold"
          size="icon"
          variant={state.isBold ? "secondary" : "ghost"}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          }}
        >
          <Bold />
        </Button>
        <Button
          aria-label="Format text as italics"
          size="icon"
          variant={state.isItalic ? "secondary" : "ghost"}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          }}
        >
          <Italic />
        </Button>
        <Button
          aria-label="Format text to underlined"
          size="icon"
          variant={state.isUnderline ? "secondary" : "ghost"}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          }}
        >
          <Underline />
        </Button>
        <Button
          aria-label="Format text with a strikethrough"
          size="icon"
          variant={state.isStrikethrough ? "secondary" : "ghost"}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          }}
        >
          <Strikethrough />
        </Button>
        <Button
          aria-label="Format text with inline code"
          size="icon"
          variant={state.isCode ? "secondary" : "ghost"}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
          }}
        >
          <Code />
        </Button>
        <div className="h-[20px] w-[1px] bg-secondary" />
        <Button
          aria-label="Format an unordered list"
          size="icon"
          variant={state.isUL ? "secondary" : "ghost"}
          onClick={() => {
            if (state.isUL) {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }
          }}
        >
          <List />
        </Button>
        <Button
          aria-label="Format an ordered list"
          size="icon"
          variant={state.isOL ? "secondary" : "ghost"}
          onClick={() => {
            if (state.isOL) {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }
          }}
        >
          <ListOrdered />
        </Button>
      </div>
    );
  },
);
