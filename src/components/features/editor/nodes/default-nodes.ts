import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import type { Klass, LexicalNode } from "lexical";

export const DefaultNodes: Array<Klass<LexicalNode>> = [
  CodeHighlightNode,
  CodeNode,
  HashtagNode,
  AutoLinkNode,
  LinkNode,
  ListItemNode,
  ListNode,
  MarkNode,
  OverflowNode,
  HorizontalRuleNode,
  HeadingNode,
  QuoteNode,
];
