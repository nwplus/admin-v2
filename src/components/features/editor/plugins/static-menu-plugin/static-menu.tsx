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

type StaticMenuState = {
  isBold: boolean;
  isCode: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  isOL: boolean;
  isUL: boolean;
};

type StaticMenuProps = {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
};

export const StaticMenu = forwardRef<HTMLDivElement, StaticMenuProps>(
  function StaticMenu(props, ref) {
    const { editor } = props;

    const [state, setState] = useState<StaticMenuState>({
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
      <div className="flex w-full items-center justify-start border-b">
        <div
          ref={ref}
          className="flex items-center justify-between gap-1 rounded-md bg-background p-1"
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
      </div>
    );
  },
);
