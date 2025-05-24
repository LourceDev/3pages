import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import { Navbar } from "./components/Navbar";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Write } from "./pages/Write";
import { store } from "./store";

export function App() {
  return (
    <Provider store={store}>
      <CssBaseline />
      <ToastContainer />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route index element={<Home />} />
          <Route path="write" element={<Write />} />
          <Route path="about" element={<About />} />
          <Route path="signup" element={<Signup />} />
          <Route path="login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
