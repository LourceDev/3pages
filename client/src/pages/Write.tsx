import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Bold } from "@tiptap/extension-bold";
import { BulletList } from "@tiptap/extension-bullet-list";
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
import { EditorContent, useEditor } from "@tiptap/react";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { notifySuccess } from "../utils";

function countWords(text: string) {
  // TODO: this is not efficient, improve it
  // split at whitespace, count the number of non-empty strings
  const words = text.trim().split(/\s+/);
  return words.filter((word) => !!word).length;
}

const messages = [
  "🎉 You did it!",
  "🚀 Crushed it!",
  "✨ All done!",
  "🏆 Success!",
  "🔥 Nice work!",
  "🎶 That’s a wrap!",
];

const content = `<h1>h1</h1>

<h2>h2</h2>

<h3>h3</h3>

<h4>h4</h4>

<h5>h5</h5>

<h6>h6</h6>

<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam repellat ad maiores quaerat sit. Ducimus quasi quod minima, est quos nihil commodi neque cum illum exercitationem? Perferendis quaerat consectetur voluptatum?</p>`;

const editorProps = {
  attributes: {
    class:
      "border-2 border-gray-300 rounded-md p-4 focus:outline-none focus:border-blue-500 text-xl",
  },
};

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
];

const today = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function Write() {
  // TODO: set this to 750 later
  const wordLimit = 15;
  // used to ensure that the success message is shown only once
  const [successMessageShown, setSuccessMessageShown] = useState(false);
  const editor = useEditor({
    extensions,
    editorProps,
    // content,
    autofocus: true,
    onUpdate(props) {
      // TODO: this is not efficient, improve it
      const text = props.editor.getText();
      const count = countWords(text);
      setWordCount(count);

      if (!successMessageShown && count > wordLimit) {
        notifySuccess(messages[Math.floor(Math.random() * messages.length)]);
        setSuccessMessageShown(true);
      }
    },
  });
  const [wordCount, setWordCount] = useState(() =>
    countWords(editor?.getText() || "")
  );

  if (!editor) {
    return null;
  }

  return (
    <Stack spacing={4} alignItems={"center"}>
      <Navbar />
      <Container>
        <Stack spacing={4}>
          <Typography variant="h4" gutterBottom align="center">
            {today}
          </Typography>

          <Stack spacing={1}>
            {
              // TODO: add a toolbar
            }
            <EditorContent editor={editor} />
            <Typography variant="caption" align="right">
              {wordCount} words
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
}
