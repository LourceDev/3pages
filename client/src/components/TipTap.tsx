import { Bold } from "@tiptap/extension-bold";
import { BulletList } from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
import { Document } from "@tiptap/extension-document";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Heading } from "@tiptap/extension-heading";
import { History } from "@tiptap/extension-history";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Italic } from "@tiptap/extension-italic";
import { ListItem } from "@tiptap/extension-list-item";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { EditorProvider } from "@tiptap/react";

const extensions = [
  Bold,
  BulletList,
  Document,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Heading,
  History,
  HorizontalRule,
  Italic,
  ListItem,
  OrderedList,
  Paragraph.configure({
    HTMLAttributes: {
      class: "mt-0 mb-3",
    },
  }),
  Text,
  CharacterCount,
];

export default function TipTap() {
  // TODO: add a toolbar
  // TODO: display word count
  // TODO: notify when 750 words are reached

  return (
    <EditorProvider
      extensions={extensions}
      editorProps={{
        attributes: {
          class:
            "border-2 border-gray-300 rounded-md p-4 focus:outline-none focus:border-blue-500 text-xl",
        },
      }}
      content={`<h1>h1</h1>

<h2>h2</h2>

<h3>h3</h3>

<h4>h4</h4>

<h5>h5</h5>

<h6>h6</h6>

<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p>`}
      autofocus
    ></EditorProvider>
  );
}
