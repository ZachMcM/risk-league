const { hairlineWidth } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        "geist-thin": ["Geist-Thin"],
        "geist-thin-italic": ["Geist-ThinItalic"],
        "geist-extralight": ["Geist-ExtraLight"],
        "geist-extralight-italic": ["Geist-ExtraLightItalic"],
        "geist-light": ["Geist-Light"],
        "geist-light-italic": ["Geist-LightItalic"],
        geist: ["Geist-Regular"], // Default Geist
        "geist-italic": ["Geist-RegularItalic"],
        "geist-medium": ["Geist-Medium"],
        "geist-medium-italic": ["Geist-MediumItalic"],
        "geist-semibold": ["Geist-SemiBold"],
        "geist-semibold-italic": ["Geist-SemiBoldItalic"],
        "geist-bold": ["Geist-Bold"],
        "geist-bold-italic": ["Geist-BoldItalic"],
        "geist-extrabold": ["Geist-ExtraBold"],
        "geist-extrabold-italic": ["Geist-ExtraBoldItalic"],
        "geist-black": ["Geist-Black"],
        "geist-black-italic": ["Geist-BlackItalic"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
