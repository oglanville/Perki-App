/** Perki — design system v2 (light / eggshell). Brand-locked palette. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#E0A93B",      // value accent
        goldlight: "#F7ECD4", // gold tint (badge fills)
        golddeep: "#B07C1A",  // gold for small text / icons on light
        purple: "#2B2A6E",    // indigo — primary action (kept name to re-skin in place)
        ink: "#F4F0E6",       // surface / page background (eggshell)
        ink2: "#FCFAF4",      // raised surfaces / inputs
        snow: "#23202A",      // primary text (kept name to re-skin in place)
        muted: "#6B6757",     // secondary text (warm grey)
      },
      fontFamily: {
        sans: ['"Work Sans"', "system-ui", "sans-serif"],
        display: ['"Outfit"', "system-ui", "sans-serif"],
      },
      borderRadius: { btn: "999px", card: "14px", modal: "16px" },
      boxShadow: {
        sm: "0 1px 2px rgba(43,42,40,.06)",
        md: "0 4px 12px rgba(43,42,40,.08)",
        lg: "0 12px 28px rgba(43,42,40,.10)",
        xl: "0 20px 40px rgba(43,42,40,.12)",
      },
      transitionTimingFunction: { fluid: "cubic-bezier(.4,0,.2,1)" },
      maxWidth: { content: "72rem" },
    },
  },
  plugins: [],
};
