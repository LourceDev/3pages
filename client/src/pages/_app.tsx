import { Navbar } from "@/components/Navbar";
import { rehydrate, store } from "@/store";
import "@/styles/globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AppProps } from "next/app";
import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";

const theme = createTheme();

function InnerApp({ Component, pageProps }: AppProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(rehydrate());
  }, [dispatch]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer />
        <Navbar />
        <Component {...pageProps} />
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <Provider store={store}>
      <InnerApp {...props} />
    </Provider>
  );
}
