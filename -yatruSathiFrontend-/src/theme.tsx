import { createTheme, alpha } from '@mui/material/styles';

/**
 * "Himalayan Green" — the YatruSathi travel identity.
 * Deep forest green + warm off-white paper + serif display headings.
 */

const GREEN = '#1F7A4D';
const GREEN_DARK = '#0F5132';
const GREEN_LIGHT = '#3AA06A';
const GREEN_DEEP = '#123D28'; // footer / very dark bands
const AMBER = '#F2B705'; // star ratings, small accents
const PAPER = '#FFFFFF';
const CANVAS = '#F4F7F5'; // section backgrounds
const INK = '#17251E';
const INK_MUTED = '#5B6B63';
const HAIRLINE = '#E3E9E4';

const SERIF = '"Playfair Display", "Georgia", "Times New Roman", serif';
const SANS = '"Inter", "Helvetica", "Arial", sans-serif';

const theme = createTheme({
  palette: {
    primary: {
      main: GREEN,
      light: GREEN_LIGHT,
      dark: GREEN_DARK,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: GREEN_DEEP,
      light: '#2C6A48',
      dark: '#0C2C1D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: AMBER,
      dark: '#CE9B00',
      contrastText: INK,
    },
    success: { main: GREEN },
    error: { main: '#C0392B' },
    background: {
      default: PAPER,
      paper: PAPER,
    },
    text: {
      primary: INK,
      secondary: INK_MUTED,
    },
    divider: HAIRLINE,
  },

  typography: {
    fontFamily: SANS,
    h1: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.08 },
    h2: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.12 },
    h3: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.005em', lineHeight: 1.18 },
    h4: { fontFamily: SERIF, fontWeight: 600, lineHeight: 1.2 },
    h5: { fontFamily: SERIF, fontWeight: 600, lineHeight: 1.25 },
    h6: { fontFamily: SANS, fontWeight: 700, letterSpacing: '-0.005em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    overline: { fontWeight: 700, letterSpacing: '0.14em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },

  shape: { borderRadius: 10 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: PAPER,
          color: INK,
          WebkitFontSmoothing: 'antialiased',
        },
        '::selection': { backgroundColor: alpha(GREEN, 0.18) },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 20,
          paddingBlock: 10,
          fontWeight: 600,
          boxShadow: 'none',
        },
        sizeLarge: { paddingInline: 26, paddingBlock: 13, fontSize: '1rem' },
        sizeSmall: { paddingInline: 14, paddingBlock: 6 },
        containedPrimary: {
          '&:hover': {
            backgroundColor: GREEN_DARK,
            boxShadow: `0 10px 22px -12px ${alpha(GREEN, 0.75)}`,
          },
        },
        outlined: {
          borderColor: alpha(INK, 0.18),
          '&:hover': { borderColor: GREEN, background: alpha(GREEN, 0.05) },
        },
        text: { '&:hover': { background: alpha(GREEN, 0.08) } },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 14 },
        outlined: { borderColor: HAIRLINE },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${HAIRLINE}`,
          boxShadow: `0 8px 28px -18px ${alpha(INK, 0.28)}`,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        outlined: { borderColor: HAIRLINE },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: PAPER,
          color: INK,
          boxShadow: 'none',
          borderBottom: `1px solid ${HAIRLINE}`,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: PAPER, borderRight: `1px solid ${HAIRLINE}` },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: PAPER,
          '& fieldset': { borderColor: HAIRLINE },
          '&:hover fieldset': { borderColor: alpha(INK, 0.3) },
          '&.Mui-focused fieldset': { borderColor: GREEN, borderWidth: 2 },
        },
      },
    },

    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiTabs: {
      styleOverrides: { indicator: { height: 3, borderRadius: 3, backgroundColor: GREEN } },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: INK,
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '6px 10px',
        },
      },
    },

    MuiLink: { defaultProps: { underline: 'hover' } },
  },
});

/** Shared palette constants for one-off styling outside the MUI system. */
export const BRAND = {
  green: GREEN,
  greenDark: GREEN_DARK,
  greenLight: GREEN_LIGHT,
  greenDeep: GREEN_DEEP,
  amber: AMBER,
  canvas: CANVAS,
  ink: INK,
  inkMuted: INK_MUTED,
  hairline: HAIRLINE,
  serif: SERIF,
};

export default theme;
