import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { getRandomIntInclusive, notifySuccess } from "../utils";

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

export default function Write() {
  const [text, setText] = useState("");
  const wordLimit = 750;
  const [successMessageShown, setSuccessMessageShown] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Stack spacing={4} alignItems={"center"}>
      <Navbar />

      <Container>
        <Stack spacing={4}>
          <Typography variant="h4" gutterBottom align="center">
            {today}
          </Typography>
          <Stack spacing={1}>
            <TextField
              label="Write something..."
              multiline
              minRows={4}
              variant="outlined"
              fullWidth
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // TODO: this is not efficient, improve it
                if (!successMessageShown && countWords(text) > wordLimit) {
                  notifySuccess(
                    messages[getRandomIntInclusive(0, messages.length - 1)]
                  );
                  setSuccessMessageShown(true);
                }
              }}
              autoFocus
              spellCheck={false}
              slotProps={{
                htmlInput: {
                  sx: {
                    fontSize: 24,
                    lineHeight: 1.4,
                  },
                },
              }}
            />
            <Typography variant="caption" align="right">
              {countWords(text)} words
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
}
