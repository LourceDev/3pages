import AdbIcon from "@mui/icons-material/Adb";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import * as React from "react";
import HrefRouterLink from "./HrefRouterLink";

const WEBSITE_NAME = "3pages";

const pages = [{ label: "Write", url: "/write" }];
// TODO: changes these later
const settings = ["Profile", "Account", "Dashboard", "Logout"];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* --------------------------- desktop view logo ---------------------------- */}
        {
          // TODO: design a logo, and replace this default one
        }
        <AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
        {/* Website name */}
        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          sx={{
            mr: 2,
            display: { xs: "none", md: "flex" },
            fontFamily: "monospace",
            fontWeight: 700,
            color: "inherit",
            textDecoration: "none",
          }}
        >
          {WEBSITE_NAME}
        </Typography>

        {/* --------------------- mobile view nav links --------------------- */}
        <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            {pages.map((page) => (
              <MenuItem key={page.url} onClick={handleCloseNavMenu}>
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                  component={HrefRouterLink}
                  href={page.url}
                >
                  {page.label}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* -------------------- mobile view logo --------------------- */}
        <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
        <Typography
          variant="h5"
          noWrap
          component="a"
          href="/"
          sx={{
            mr: 2,
            display: { xs: "flex", md: "none" },
            flexGrow: 1,
            fontFamily: "monospace",
            fontWeight: 700,
            color: "inherit",
            textDecoration: "none",
          }}
        >
          {WEBSITE_NAME}
        </Typography>

        {/* ------------------------- desktop view nav links ------------------------- */}
        <Box
          sx={{
            flexGrow: 1,
            justifyContent: { md: "flex-end" },
            display: { xs: "none", md: "flex" },
          }}
        >
          {pages.map((page) => (
            <Button
              key={page.url}
              href={page.url}
              LinkComponent={HrefRouterLink}
              // lineHeight: inherit fixes issues with icon alignment https://github.com/mui/material-ui/issues/19584
              sx={{ color: "#fff", lineHeight: "inherit" }}
            >
              {page.label}
            </Button>
            // <Button
            //   key={page.url}
            //   onClick={handleCloseNavMenu}
            //   sx={{ my: 2, color: "white", display: "block" }}
            // >
            //   {page.label}
            // </Button>
          ))}
        </Box>
        <Box mr={2} display={{ xs: "none", md: "initial" }} />

        {/* ------------------------- logged in user profile ------------------------- */}
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((setting) => (
              <MenuItem key={setting} onClick={handleCloseUserMenu}>
                <Typography sx={{ textAlign: "center" }}>{setting}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
export default ResponsiveAppBar;
