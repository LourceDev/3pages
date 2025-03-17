import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline } from "@mui/material";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import About from "./pages/About";
import Home from "./pages/Home";
import Write from "./pages/Write";

export default function App() {
  return (
    <React.Fragment>
      <CssBaseline />
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="write" element={<Write />} />
          <Route path="about" element={<About />} />
        </Routes>
      </BrowserRouter>
    </React.Fragment>
  );
}
