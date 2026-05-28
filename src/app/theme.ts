import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#fbfaf8",
      paper: "#ffffff"
    },
    primary: {
      main: "#5b3fa0",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#8167c4"
    },
    error: {
      main: "#bc3d35"
    },
    warning: {
      main: "#b27616"
    },
    text: {
      primary: "#19171f",
      secondary: "#6f6a78"
    },
    divider: "#dedbe5"
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    h1: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 760,
      letterSpacing: 0,
      lineHeight: 0.94
    },
    h2: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 760,
      letterSpacing: 0
    },
    h3: {
      fontWeight: 720
    },
    button: {
      fontWeight: 800,
      textTransform: "none"
    }
  },
  components: {
    MuiCard: {
      defaultProps: {
        variant: "outlined"
      },
      styleOverrides: {
        root: {
          borderColor: "#dedbe5",
          color: "var(--app-ink, #19171f)",
          backgroundImage: "none",
          boxShadow: "none"
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "var(--app-panel, #ffffff)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800
        }
      }
    }
  }
});
