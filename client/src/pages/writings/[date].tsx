import { API } from "@/api";
import dayjs from "@/dayjs";
import { RootState } from "@/store";
import { notifyFailure } from "@/utils";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
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
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import TiptapLink from "@tiptap/extension-link";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import { Dropcursor, Gapcursor, Placeholder, UndoRedo } from "@tiptap/extensions";
import { EditorContent, Editor as TiptapEditor, useEditor } from "@tiptap/react";
import type { Dayjs } from "dayjs";
import { createLowlight, all as lowlightAll } from "lowlight";
import Link from "next/link";
import { useRouter } from "next/router";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";

/* ------------------------------- Variables -------------------------------- */

const editorProps = {
  attributes: {
    class: "border-2 border-gray-300 rounded-md p-4 focus:outline-none focus:border-blue-500 text-xl",
  },
};

const lowlight = createLowlight(lowlightAll);

const extensions = [
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlockLowlight.configure({ lowlight, HTMLAttributes: { spellcheck: "false" } }),
  Document,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Heading,
  HorizontalRule,
  Italic,
  ListItem,
  OrderedList,
  Paragraph.configure({ HTMLAttributes: { class: "mt-0 mb-3" } }),
  Placeholder.configure({ placeholder: "Write something…", showOnlyWhenEditable: false }),
  Strike,
  Text,
  // TODO: support markdown link syntax: https://github.com/ueberdosis/tiptap/discussions/6140
  TiptapLink.configure({ protocols: ["http", "https", "mailto", "tel", "ftp", "magnet"], autolink: false }),
  Underline,
  UndoRedo,
];

// TODO: set this to 750 later
const wordLimit = 15;

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
  const { highlightedDays, ...other } = props;
  const isSelected = !props.outsideCurrentMonth && highlightedDays?.has(props.day.format("YYYY-MM-DD"));

  return (
    <Badge key={props.day.toString()} color="secondary" variant="dot" overlap="circular" invisible={!isSelected}>
      {props.disabled ? (
        <PickersDay {...other} />
      ) : (
        <Link href={`/writings/${props.day.format("YYYY-MM-DD")}`}>
          <PickersDay {...other} />
        </Link>
      )}
    </Badge>
  );
}

interface DateChangeToolbarProps {
  today: Dayjs;
  activeDate: Dayjs;
  highlightedDays?: Set<string>;
}

function DateChangeToolbar(props: DateChangeToolbarProps) {
  const { today, activeDate, highlightedDays } = props;
  const theme = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Button
          startIcon={<ChevronLeftIcon />}
          LinkComponent={Link}
          href={`/writings/${activeDate.subtract(1, "day").format("YYYY-MM-DD")}`}
        >
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
          LinkComponent={Link}
          href={`/writings/${activeDate.add(1, "day").format("YYYY-MM-DD")}`}
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
  editor: TiptapEditor;
  editorRef: RefObject<HTMLDivElement | null>;
  wordCount: number;
  saveStatus: "saving" | "saved";
  save: (editor: TiptapEditor) => Promise<void>;
}

function Editor(props: EditorProps) {
  const { editor, editorRef, wordCount, saveStatus: saveState, save } = props;
  return (
    <Stack spacing={1}>
      {
        // TODO: add a toolbar
      }
      <EditorContent editor={editor} ref={editorRef} />
      <Stack direction={"row"} justifyContent={"end"} gap={1} alignItems={"center"}>
        <Typography variant="caption" sx={wordCount >= wordLimit ? { fontWeight: "bold" } : { fontWeight: "normal" }}>
          {wordCount} words
        </Typography>

        {saveState === "saving" ? (
          <SyncOutlinedIcon fontSize="small" />
        ) : saveState === "saved" ? (
          <CloudDoneOutlinedIcon fontSize="small" />
        ) : null}

        <Button
          size="small"
          sx={{ padding: 0.5, margin: 0, width: "fit-content", minWidth: 0 }}
          onClick={() => save(editor)}
        >
          <SaveOutlinedIcon color="inherit" fontSize="small" />
        </Button>
      </Stack>
    </Stack>
  );
}

const today = dayjs().startOf("day");

export default function Write() {
  // -------------------
  // State and functions
  // -------------------

  const router = useRouter();
  const token = useSelector((state: RootState) => state.app.token);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved">("saved");
  // @ts-expect-error assume that date given is always valid
  const activeDate = useMemo(() => dayjs(router.query.date).startOf("day"), [router.query.date]);
  const [highlightedDays, setHighlightedDays] = useState<Set<string> | undefined>();

  const save = async (editor: TiptapEditor) => {
    if (!token || !hasUnsavedChanges) return;

    setSaveStatus("saving");

    // if editor is empty, delete the entry
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

    setSaveStatus("saved");
    setHasUnsavedChanges(false);
  };

  const debouncedSave = useDebouncedCallback(save, 2000);

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
      setHasUnsavedChanges(true);
      debouncedSave(props.editor);
    },
  });
  const [wordCount, setWordCount] = useState(() => countWords(editor?.getText() || ""));

  // TODO: redirect to today's page if date in url is in the future

  // ----------------------
  // Handle unsaved changes
  // ----------------------

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (hasUnsavedChanges) debouncedSave.flush();
    };
  }, [hasUnsavedChanges, debouncedSave]);

  // -----------------------------------------
  // Get all entry dates for DateChangeToolbar
  // -----------------------------------------

  useEffect(() => {
    if (!token) return;
    const getAllEntryDates = async () => {
      const dates = await API.getAllEntryDates(token);
      if (!dates.success) return notifyFailure(dates.error);
      setHighlightedDays(dates.data);
    };
    getAllEntryDates();
  }, [token]);

  // ------------------------
  // Fetch activeDate's entry
  // ------------------------

  useEffect(() => {
    if (!token) return;
    if (!editor) return;

    // redirect to today if date is in the future
    // @ts-expect-error assume valid date
    if (dayjs(router.query.date).isAfter(today, "day")) {
      router.replace("/writings/" + today.format("YYYY-MM-DD"));
      return;
    }

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
  }, [token, editor, activeDate, router]);

  if (!editor) return null;
  if (!token) return <div>Unauthorized</div>;

  return (
    <Stack spacing={4} component={Container}>
      <div>{/* added for spacing */}</div>
      <DateChangeToolbar today={today} activeDate={activeDate} highlightedDays={highlightedDays} />
      <Editor editor={editor} editorRef={editorRef} wordCount={wordCount} saveStatus={saveStatus} save={save} />
    </Stack>
  );
}
