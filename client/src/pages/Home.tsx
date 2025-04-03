import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Navbar from "../components/Navbar";
export default function Home() {
  return (
    <Stack spacing={2}>
      <Navbar />
      <Stack px={2}>
        <Box>
          if logged in, show dashboard here with stats like
          <ul>
            <li>if not written today, show prominent CTA button to write</li>
            <li>if written today, show today's stats</li>
            <li>streak</li>
            <li>total words written</li>
            <li>general mood</li>
            <li>heatmap</li>
          </ul>
        </Box>
        <Box>
          if not logged in, landing page
          <ul>
            <li>hero section with CTA</li>
            <ul>
              <li>
                the main text should keep changing to reflect different use
                cases
              </li>
            </ul>
            <li>Why use this?</li>
            <ul>
              <li>thoughts dumping</li>
              <li>writing practice</li>
              <li>writing is thinking</li>
              <li>journaling</li>
            </ul>
            <li>features and screenshots</li>
            <li>self host and contribute CTA</li>
          </ul>
        </Box>
      </Stack>
    </Stack>
  );
}
