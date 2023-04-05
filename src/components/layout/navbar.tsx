import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AdbIcon from "@mui/icons-material/Adb";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useState } from "react";
import NextLink from "next/link";
import axios from "axios";
import { env } from "@/environment";
import { Basket } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useBasketIdStore } from "@/stores";
import { Logout, Inventory2 } from "@mui/icons-material";
import { useAuth } from "@/contexts/auth-context";

const routes = [{ name: "Catalog", to: "/catalog" }];

export default function Navbar() {
  const { user, signIn, signOut } = useAuth();
  const basketId = useBasketIdStore((state) => state.basketId);
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const getBasket = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Basket>(
      `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${basketId}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data } = useQuery(
    ["/api/v1/baskets", basketId],
    ({ signal }) => getBasket(signal),
    {
      enabled: !!basketId,
    }
  );

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
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
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>

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
              id="menu-appbar"
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
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {routes.map(({ name, to }) => (
                <MenuItem key={to} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {routes.map(({ name, to }) => (
              <Button component={NextLink} href={to} key={to}>
                {name}
              </Button>
            ))}
          </Box>
          <IconButton component={NextLink} href="/basket" aria-label="cart">
            <Badge badgeContent={data?.items.length} color="secondary">
              <ShoppingCartIcon fontSize="small" />
            </Badge>
          </IconButton>
          {user ? (
            <Tooltip title="Account settings">
              <IconButton onClick={handleClick}>
                <Avatar
                  sx={{ width: 24, height: 24 }}
                  alt={user.firstName ?? "User avatar"}
                  src={user.avatarUrl}
                  imgProps={{ referrerPolicy: "no-referrer" }}
                />
              </IconButton>
            </Tooltip>
          ) : (
            <Button onClick={() => signIn()} sx={{ marginLeft: 1 }}>
              Login
            </Button>
          )}
        </Toolbar>
      </Container>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            fontSize: "1px",
            minWidth: 200,
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem component={NextLink} href="/orders" sx={{ fontSize: 14 }}>
          <ListItemIcon>
            <Inventory2 fontSize="small" />
          </ListItemIcon>
          Orders
        </MenuItem>
        <MenuItem onClick={signOut} sx={{ fontSize: 14 }}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
