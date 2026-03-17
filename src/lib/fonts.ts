import localFont from "next/font/local";

export const dmSans = localFont({
  src: [
    { path: "../../public/fonts/dm-sans-400.ttf", weight: "400" },
    { path: "../../public/fonts/dm-sans-700.ttf", weight: "700" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const inter = localFont({
  src: [
    { path: "../../public/fonts/inter-400.ttf", weight: "400" },
    { path: "../../public/fonts/inter-700.ttf", weight: "700" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const syne = localFont({
  src: [
    { path: "../../public/fonts/syne-400.ttf", weight: "400" },
    { path: "../../public/fonts/syne-700.ttf", weight: "700" },
  ],
  variable: "--font-syne",
  display: "swap",
});

export const barlow = localFont({
  src: [
    { path: "../../public/fonts/barlow-400.ttf", weight: "400" },
    { path: "../../public/fonts/barlow-700.ttf", weight: "700" },
  ],
  variable: "--font-barlow",
  display: "swap",
});

export const oswald = localFont({
  src: [
    { path: "../../public/fonts/oswald-400.ttf", weight: "400" },
    { path: "../../public/fonts/oswald-700.ttf", weight: "700" },
  ],
  variable: "--font-oswald",
  display: "swap",
});

export const bebasNeue = localFont({
  src: [
    { path: "../../public/fonts/bebas-neue-400.ttf", weight: "400" },
    { path: "../../public/fonts/bebas-neue-400.ttf", weight: "700" },
  ],
  variable: "--font-bebas-neue",
  display: "swap",
});

export const montserrat = localFont({
  src: [
    { path: "../../public/fonts/montserrat-400.ttf", weight: "400" },
    { path: "../../public/fonts/montserrat-700.ttf", weight: "700" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

// Map from font value string to CSS variable -- used by estimates page and font picker
export const FONT_VARIABLES: Record<string, string> = {
  "DM Sans": "var(--font-dm-sans)",
  Inter: "var(--font-inter)",
  Syne: "var(--font-syne)",
  Barlow: "var(--font-barlow)",
  Oswald: "var(--font-oswald)",
  "Bebas Neue": "var(--font-bebas-neue)",
  Montserrat: "var(--font-montserrat)",
};

// All font objects in an array for applying className to layout roots
export const allOrgFonts = [
  dmSans,
  inter,
  syne,
  barlow,
  oswald,
  bebasNeue,
  montserrat,
];
