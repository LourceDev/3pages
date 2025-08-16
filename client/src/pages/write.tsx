import { API } from "@/api";
import dayjs from "@/dayjs";
import { RootState } from "@/store";
import { notifyFailure, notifySuccess } from "@/utils";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, Editor as TiptapEditor, useEditor } from "@tiptap/react";
import type { Dayjs } from "dayjs";
import { createLowlight, all as lowlightAll } from "lowlight";
import { RefObject, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

/* ------------------------------- Variables -------------------------------- */

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
    class: "border-2 border-gray-300 rounded-md p-4 focus:outline-none focus:border-blue-500 text-xl",
  },
};

const lowlight = createLowlight(lowlightAll);

const extensions = [
  Bold,
  BulletList,
  Code,
  CodeBlockLowlight.configure({ lowlight, HTMLAttributes: { spellcheck: "false" } }),
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
  Paragraph.configure({ HTMLAttributes: { class: "mt-0 mb-3" } }),
  Placeholder.configure({ placeholder: "Write something…", showOnlyWhenEditable: false }),
  Text,
];

const today = dayjs().startOf("day");

/* ------------------------------- Functions -------------------------------- */

function countWords(text: string) {
  // TODO: this is not efficient, improve it
  // split at whitespace, count the number of non-empty strings
  const words = text.trim().split(/\s+/);
  return words.filter((word) => !!word).length;
}

/* ------------------------------- Components ------------------------------- */

type DatePickerDayProps = PickersDayProps<Dayjs> & {
  highlightedDays?: Set<string>;
};

function DatePickerDay(props: DatePickerDayProps) {
  const { highlightedDays, day, outsideCurrentMonth, ...other } = props;
  const isSelected = !props.outsideCurrentMonth && highlightedDays?.has(props.day.format("YYYY-MM-DD"));

  return (
    <Badge key={props.day.toString()} color="secondary" variant="dot" overlap="circular" invisible={!isSelected}>
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

interface DateChangeToolbarProps {
  activeDate: Dayjs;
  setActiveDate: (date: Dayjs) => void;
  highlightedDays?: Set<string>;
}

function DateChangeToolbar(props: DateChangeToolbarProps) {
  const { activeDate, setActiveDate, highlightedDays } = props;
  const theme = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Button startIcon={<ChevronLeftIcon />} onClick={() => setActiveDate(activeDate.subtract(1, "day"))}>
          <Box component={"span"} sx={{ [theme.breakpoints.down("sm")]: { display: "none" } }}>
            {activeDate.subtract(1, "day").format("D MMMM YYYY")}
          </Box>
        </Button>

        {
          // TODO: every time calender is shown, show it for the active date's month and year. i.e. reset user's navigation inside the calendar
        }
        <Button
          sx={{ fontSize: "1.4rem" }}
          endIcon={showCalendar ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowCalendar(!showCalendar)}
        >
          {activeDate.format("D MMMM YYYY")}
        </Button>
        <Button
          endIcon={<ChevronRightIcon />}
          onClick={() => setActiveDate(activeDate.add(1, "day"))}
          sx={{ visibility: activeDate.isSame(today, "day") ? "hidden" : undefined }}
        >
          <Box component={"span"} sx={{ [theme.breakpoints.down("sm")]: { display: "none" } }}>
            {activeDate.add(1, "day").format("D MMMM YYYY")}
          </Box>
        </Button>
      </Box>
      <Box sx={{ display: showCalendar ? "flex" : "none", justifyContent: "center" }}>
        <StaticDatePicker
          value={activeDate}
          onChange={(value) => value && setActiveDate(value)}
          views={["year", "month", "day"]}
          renderLoading={() => <DayCalendarSkeleton />}
          slots={{ day: DatePickerDay }}
          slotProps={{
            day: { highlightedDays } as DatePickerDayProps,
            actionBar: { actions: ["today"] },
            toolbar: { hidden: true },
          }}
          displayWeekNumber
          disableFuture
        />
      </Box>
    </Stack>
  );
}

interface EditorProps {
  editor: TiptapEditor | null;
  editorRef: RefObject<HTMLDivElement | null>;
  wordCount: number;
}

function Editor(props: EditorProps) {
  const { editor, editorRef, wordCount } = props;
  return (
    <Stack spacing={1}>
      {
        // TODO: add a toolbar
      }
      <EditorContent editor={editor} ref={editorRef} />
      <Typography variant="caption" align="right">
        {wordCount} words
      </Typography>
    </Stack>
  );
}

export default function Write() {
  const token = useSelector((state: RootState) => state.app.token);
  // TODO: set this to 750 later
  const wordLimit = 15;
  // used to ensure that the success message is shown only once
  const [successMessageShown, setSuccessMessageShown] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions,
    editorProps,
    immediatelyRender: false,
    autofocus: true,
    onUpdate(props) {
      // TODO: this is not efficient, improve it
      const count = countWords(props.editor.getText());
      setWordCount(count);

      if (!successMessageShown && count > wordLimit) {
        notifySuccess(messages[Math.floor(Math.random() * messages.length)]);
        setSuccessMessageShown(true);
      }
    },
  });
  const [activeDate, setActiveDate] = useState(today);
  const [highlightedDays, setHighlightedDays] = useState<Set<string> | undefined>();
  const [wordCount, setWordCount] = useState(() => countWords(editor?.getText() || ""));

  useEffect(() => {
    if (!token) return;
    const getAllEntryDates = async () => {
      const dates = await API.getAllEntryDates(token);
      if (!dates.success) return notifyFailure(dates.error);
      setHighlightedDays(dates.data);
    };
    getAllEntryDates();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!editor) return;

    const getExistingEntry = async () => {
      if (!editorRef.current) return;

      // TODO: disabling the editor is ugly, we can do better later
      editor.setEditable(false);
      editorRef.current.style.cursor = "wait";

      const output = await API.getEntry(token, activeDate.format("YYYY-MM-DD"));

      editor.setEditable(true);
      editorRef.current.style.cursor = "text";

      if (!output.success) return notifyFailure(output.error);
      if (output.data === null) {
        editor.commands.setContent("");
        editor.commands.focus();
      } else editor.commands.setContent(output.data.text);
    };

    getExistingEntry();
  }, [token, editor, editorRef, activeDate]);

  if (!editor) return null;
  if (!token) return <div>Unauthorized</div>;

  return (
    <Stack spacing={4} component={Container}>
      <div>{/* added for spacing */}</div>

      <DateChangeToolbar activeDate={activeDate} setActiveDate={setActiveDate} highlightedDays={highlightedDays} />

      <Editor editor={editor} editorRef={editorRef} wordCount={wordCount} />

      <Button
        variant="contained"
        onClick={async () => {
          // TODO: this impl is temporary, implement auto save and ctrl+s save in future
          if (editor.isEmpty) {
            const output = await API.deleteEntry(token, activeDate.format("YYYY-MM-DD"));
            if (!output.success) return notifyFailure(output.error);

            setHighlightedDays((prev) => {
              const newDays = new Set(prev);
              newDays.delete(activeDate.format("YYYY-MM-DD"));
              return newDays;
            });
          } else {
            const entry = {
              date: activeDate.format("YYYY-MM-DD"),
              text: editor.getJSON(),
            };
            const output = await API.putEntry(token, entry);
            if (!output.success) return notifyFailure(output.error);

            setHighlightedDays((prev) => {
              const newDays = new Set(prev);
              newDays.add(activeDate.format("YYYY-MM-DD"));
              return newDays;
            });
          }
        }}
      >
        Submit
      </Button>
    </Stack>
  );
}
