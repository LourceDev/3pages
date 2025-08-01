import { API } from "@/api";
import { loginSuccess } from "@/store";
import { notifyFailure } from "@/utils";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Button, Container, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

export default function Login() {
  const dispatch = useDispatch();

  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name as keyof typeof form;
    let value = e.target.value;
    const toTrim: Partial<Record<keyof typeof form, boolean>> = { email: true };
    if (key in toTrim) {
      value = value.trim();
    }
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const output = await API.login(form);
    if (!output.success) {
      return notifyFailure(output.error);
    }
    dispatch(loginSuccess(output.data));
    router.push("/");
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button fullWidth variant="contained" color="primary" type="submit" sx={{ mt: 3 }}>
            Log In
          </Button>
        </form>
      </Box>
    </Container>
  );
}
