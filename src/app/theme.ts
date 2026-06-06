import { createTheme } from "@mui/material/styles";
import { cutlab } from "./design-system";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: cutlab.color.charcoal,
      paper: cutlab.color.graphite
    },
    primary: {
      main: cutlab.color.teal,
      light: cutlab.color.cyan,
      dark: cutlab.color.deepTeal,
      contrastText: cutlab.color.softWhite
    },
    secondary: {
      main: cutlab.color.cyan
    },
    error: {
      main: cutlab.color.error
    },
    warning: {
      main: cutlab.color.warning
    },
    success: {
      main: cutlab.color.success
    },
    text: {
      primary: cutlab.color.softWhite,
      secondary: "#A5ADB4"
    },
    divider: "#2A3138"
  },
  shape: {
    borderRadius: cutlab.radius.sm
  },
  typography: {
    fontFamily: cutlab.font.body,
    h1: {
      fontFamily: cutlab.font.heading,
      fontWeight: 700,
      letterSpacing: "-0.015em",
      lineHeight: 1.1
    },
    h2: {
      fontFamily: cutlab.font.heading,
      fontWeight: 600,
      letterSpacing: "-0.005em"
    },
    h3: {
      fontFamily: cutlab.font.heading,
      fontWeight: 600
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.01em"
    }
  },
  components: {
    MuiCard: {
      defaultProps: {
        variant: "outlined"
      },
      styleOverrides: {
        root: {
          borderColor: "var(--app-border, #2A3138)",
          color: `var(--app-ink, ${cutlab.color.softWhite})`,
          backgroundImage: "none",
          boxShadow: "none"
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: cutlab.radius.sm,
          transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 120ms ease",
          "&:active": { transform: "translateY(1px)" },
          "&:focus-visible": {
            outline: `2px solid ${cutlab.color.cyan}`,
            outlineOffset: 2
          }
        },
        containedPrimary: {
          backgroundColor: "var(--app-accent, #2D8C97)",
          "&:hover": { backgroundColor: "var(--app-highlight, #69C4CE)", color: cutlab.color.charcoal }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: `var(--app-control, ${cutlab.color.charcoal})`
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: `var(--app-ink, ${cutlab.color.softWhite})`
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: `var(--app-ink, ${cutlab.color.softWhite})`,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--app-border, #2A3138)"
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--app-highlight, #69C4CE)"
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--app-highlight, #69C4CE)"
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "var(--app-muted, #A5ADB4)",
          "&.Mui-focused": {
            color: "var(--app-highlight, #69C4CE)"
          }
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: `var(--app-panel, ${cutlab.color.graphite})`,
          color: `var(--app-ink, ${cutlab.color.softWhite})`,
          "&.Mui-selected": {
            backgroundColor: "var(--app-active, rgba(45,140,151,0.18))",
            color: "var(--app-highlight, #69C4CE)",
            "&:hover": {
              backgroundColor: "var(--app-active, rgba(45,140,151,0.18))"
            }
          },
          "&:hover": {
            backgroundColor: "var(--app-hover, rgba(105,196,206,0.09))"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: `var(--app-panel, ${cutlab.color.graphite})`,
          color: `var(--app-ink, ${cutlab.color.softWhite})`,
          borderColor: "var(--app-border, #2A3138)",
          backgroundImage: "none"
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: `var(--app-panel, ${cutlab.color.graphite})`,
          color: `var(--app-ink, ${cutlab.color.softWhite})`,
          border: "1px solid var(--app-border, #2A3138)",
          backgroundImage: "none"
        },
        list: {
          backgroundColor: `var(--app-panel, ${cutlab.color.graphite})`,
          color: `var(--app-ink, ${cutlab.color.softWhite})`
        }
      }
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: `var(--app-panel, ${cutlab.color.graphite})`,
          color: `var(--app-ink, ${cutlab.color.softWhite})`,
          borderColor: "var(--app-border, #2A3138)",
          backgroundImage: "none"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: cutlab.radius.xs
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: "1px solid var(--app-border, #2A3138)",
          borderRadius: cutlab.radius.md,
          boxShadow: cutlab.shadow[3]
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "var(--app-border, #2A3138)"
        },
        head: {
          color: "var(--app-muted, #A5ADB4)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em"
        }
      }
    }
  }
});
