/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F3F3F3",
        surface: "#EFEFEF",
        white: "#FFFFFF",
        primary: {
          default: "#1799F6",
          dark: "#1772B2",
        },
        secondary: {
          default: "#EB520E",
          dark: "#B8400B",
        },
        textgray: "#757575",
        bordergray: "#BFBFBF",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        compact: "16px",
        button: "8px",
        search: "16px",
      },
      boxShadow: {
        header: "2px 2px 8px 0px rgba(0,0,0,0.04)",
        card: "2px 2px 8px 0px rgba(0,0,0,0.08)",
        "card-lg": "2px 2px 8px 0px rgba(0,0,0,0.12)",
        panel: "2px 2px 16px 0px rgba(0,0,0,0.08)",
        compact: "2px 2px 4px 0px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
