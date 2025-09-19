import { logout, RootState, User } from "@/store";
import AdbIcon from "@mui/icons-material/Adb";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Dispatch } from "@reduxjs/toolkit";
import NextLink from "next/link";
import { NextRouter, useRouter } from "next/router";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

const WEBSITE_NAME = "3pages";

const pages = {
  private: [{ label: "Write", url: "/writings" }],
  public: [
    { label: "Signup", url: "/signup" },
    { label: "Login", url: "/login" },
  ],
};

interface DesktopNavbarProps {
  user: User | null;
}

function DesktopNavbar(props: DesktopNavbarProps) {
  const { user } = props;
  return (
    <React.Fragment>
      {/* ---------------------------------- logo ---------------------------------- */}
      {
        // TODO: design a logo, and replace this default one
      }
      <Stack
        direction="row"
        alignItems="center"
        component={NextLink}
        href="/"
        sx={{ textDecoration: "none", color: "inherit", display: { xs: "none", md: "flex" } }}
        spacing={1}
      >
        <AdbIcon />
        {/* Website name */}
        <Typography variant="h6" noWrap sx={{ mr: 2, fontFamily: "monospace", fontWeight: 700 }}>
          {WEBSITE_NAME}
        </Typography>
      </Stack>
      {/* ------------------------------- nav links -------------------------------- */}
      <Box sx={{ flexGrow: 1, justifyContent: { md: "flex-end" }, display: { xs: "none", md: "flex" } }}>
        {(user ? pages.private : pages.public).map((page) => (
          <Button
            key={page.url}
            href={page.url}
            LinkComponent={NextLink}
            // lineHeight: inherit fixes issues with icon alignment https://github.com/mui/material-ui/issues/19584
            sx={{ color: "#fff", lineHeight: "inherit" }}
          >
            {page.label}
          </Button>
        ))}
      </Box>
    </React.Fragment>
  );
}

interface MobileNavbarProps {
  user: User | null;
}

function MobileNavbar(props: MobileNavbarProps) {
  const { user } = props;
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <Stack direction={"row"} alignItems="center" spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
      {/* ------------------------------- nav links -------------------------------- */}
      {
        // TODO: show signup/login link on mobile navbar if user is not logged in
      }
      <Box>
        <IconButton onClick={handleOpenNavMenu} color="inherit">
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorElNav}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{ display: { xs: "block", md: "none" } }}
          keepMounted
        >
          {(user ? pages.private : pages.public).map((page) => (
            <MenuItem key={page.url} onClick={handleCloseNavMenu} component={NextLink} href={page.url}>
              <Typography>{page.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
      {/* ---------------------------------- logo ---------------------------------- */}
      <Stack
        direction="row"
        alignItems="center"
        component={NextLink}
        href="/"
        sx={{ textDecoration: "none", color: "inherit" }}
        spacing={1}
      >
        <AdbIcon />
        <Typography variant="h5" noWrap sx={{ fontFamily: "monospace", fontWeight: 700 }}>
          {WEBSITE_NAME}
        </Typography>
      </Stack>
    </Stack>
  );
}

interface ProfileProps {
  user: User | null;
  dispatch: Dispatch;
  router: NextRouter;
}

function Profile(props: ProfileProps) {
  const { user, dispatch, router } = props;
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    user && (
      <React.Fragment>
        <Box mr={2} display={{ xs: "none", md: "initial" }} />
        <Box sx={{ flexGrow: 0 }}>
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            <Avatar alt={user?.name || "Profile"}>{user?.name.trim().charAt(0).toUpperCase()}</Avatar>
          </IconButton>
          <Menu
            sx={{ mt: "45px" }}
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            keepMounted
          >
            <MenuItem
              onClick={() => {
                dispatch(logout());
                handleCloseUserMenu();
                router.push("/");
              }}
            >
              <Typography sx={{ textAlign: "center" }}>Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </React.Fragment>
    )
  );
}

export function Navbar() {
  const { user } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <DesktopNavbar user={user} />
        <MobileNavbar user={user} />
        <Profile user={user} dispatch={dispatch} router={router} />
      </Toolbar>
    </AppBar>
  );
}
