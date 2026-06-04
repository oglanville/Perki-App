import React from "react";
import { providerInitials } from "../data/catalog";

/* Brand-logo mapping helper. Logos via Simple Icons CDN; graceful fallback to initials. */
export const BRAND = {
  "Monzo":      { slug: "monzo" },
  "Revolut":    { slug: "revolut" },
  "OVO Energy": { slug: "ovoenergy" },
  "OVO":        { slug: "ovoenergy" },
  "Sky TV":     { slug: "sky" },
  "Sky":        { slug: "sky" },
  "Lidl":       { slug: "lidl" },
  "O2":         { slug: "o2" },
};

export function BrandLogo({ provider, className = "w-7 h-7" }) {
  const [failed, setFailed] = React.useState(false);
  const slug = BRAND[provider]?.slug;
  if (!slug || failed) {
    return (
      <span className={`grid place-items-center rounded-full bg-purple/25 text-snow font-semibold shrink-0 ${className}`}>
        <span className="text-[0.6em] leading-none">{providerInitials(provider)}</span>
      </span>
    );
  }
  return (
    <span className={`grid place-items-center rounded-full bg-white shrink-0 overflow-hidden ${className}`}>
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt={`${provider} logo`}
        onError={() => setFailed(true)}
        className="w-[62%] h-[62%] object-contain"
        loading="lazy"
      />
    </span>
  );
}
