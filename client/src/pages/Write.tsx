import Button from "@mui/material/Button";
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
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { API } from "../api";
import { RootState } from "../store";
import { notifyFailure, notifySuccess } from "../utils";

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

const todayIso8601 = new Date().toISOString().substring(0, 10);

export function Write() {
  /**
   * YYYY-MM-DD
   */
  const token = useSelector((state: RootState) => state.app.token);
  // TODO: set this to 750 later
  const wordLimit = 15;
  // used to ensure that the success message is shown only once
  const [successMessageShown, setSuccessMessageShown] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions,
    editorProps,
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

  useEffect(() => {
    if (!token) return;
    if (!editor) return;

    const asyncFn = async () => {
      if (!editorRef.current) return;

      // TODO: disabling the editor is ugly, we can do better later
      editor.setEditable(false);
      editor.commands.setContent("Loading...");
      editorRef.current.style.cursor = "not-allowed";

      const output = await API.getEntry(token, todayIso8601);

      editor.setEditable(true);
      editorRef.current.style.cursor = "text";

      if (!output.success) return notifyFailure(output.error);
      if (output.data === null) editor.commands.setContent("");
      else editor.commands.setContent(output.data.text);
    };

    asyncFn();
  }, [token, editor, editorRef]);

  if (!editor) {
    return null;
  }

  if (!token) {
    return <div>Unauthorized</div>;
  }

  return (
    <Stack spacing={4} alignItems={"center"}>
      <div>{/* added for spacing */}</div>
      <Container>
        <Stack spacing={4}>
          <Typography variant="h4" gutterBottom align="center">
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Typography>

          <Stack spacing={1}>
            {
              // TODO: add a toolbar
            }
            <EditorContent editor={editor} ref={editorRef} />
            <Typography variant="caption" align="right">
              {wordCount} words
            </Typography>
          </Stack>
          <Button
            variant="contained"
            onClick={async () => {
              // TODO: this impl is temporary, implement auto save and ctrl+s save in future
              const entry = {
                date: todayIso8601,
                text: editor.getJSON(),
              };
              console.log(entry);
              const output = await API.putEntry(token, entry);
              if (!output.success) {
                return notifyFailure(output.error);
              }
            }}
          >
            Submit
          </Button>
        </Stack>
      </Container>
    </Stack>
  );
}
