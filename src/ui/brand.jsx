import React from "react";
import { providerInitials } from "../data/catalog";

/* Brand-logo mapping helper. Logos via Simple Icons CDN; graceful fallback to initials. */
export const BRAND = {
  "Monzo":      { slug: "monzo" },
  "Revolut":    { slug: "revolut" },
  "OVO Energy": { slug: "ovoenergy", logo: "https://logo.clearbit.com/ovoenergy.com" },
  "OVO":        { slug: "ovoenergy", logo: "https://logo.clearbit.com/ovoenergy.com" },
  "Sky TV":     { slug: "sky" },
  "Sky":        { slug: "sky" },
  "Lidl":       { slug: "lidl" },
  "O2":         { slug: "o2" },
  "Tesco":      { logo: "https://logo.clearbit.com/tesco.com" },
  "Boots":      { logo: "https://logo.clearbit.com/boots.com" },
  "IKEA":       { logo: "https://logo.clearbit.com/ikea.com" },
  "Greggs":     { logo: "https://logo.clearbit.com/greggs.co.uk" },
  "Nando's":    { logo: "https://logo.clearbit.com/nandos.co.uk" },
  "Pret":       { logo: "https://logo.clearbit.com/pret.co.uk" },
  "Deliveroo":  { logo: "https://logo.clearbit.com/deliveroo.co.uk" },
  "Amazon":     { logo: "https://logo.clearbit.com/amazon.co.uk" },
  "Spotify":    { logo: "https://logo.clearbit.com/spotify.com" },
  "Cineworld":  { logo: "https://logo.clearbit.com/cineworld.co.uk" },
  "ASOS":       { logo: "https://logo.clearbit.com/asos.com" },
  "Nationwide": { logo: "https://logo.clearbit.com/nationwide.co.uk" },
  "Santander":  { logo: "https://logo.clearbit.com/santander.co.uk" },
  "American Express":{ logo: "https://logo.clearbit.com/americanexpress.com" },
  "Vodafone":   { logo: "https://logo.clearbit.com/vodafone.co.uk" },
  "Costco":     { logo: "https://logo.clearbit.com/costco.co.uk" },
  "Blue Light Card":{ logo: "https://logo.clearbit.com/bluelightcard.co.uk" },
  "National Trust":{ logo: "https://logo.clearbit.com/nationaltrust.org.uk" },
  "Railcard":   { logo: "https://logo.clearbit.com/railcard.co.uk" },
  "British Airways":{ logo: "https://logo.clearbit.com/britishairways.com" },
};

export function BrandLogo({ provider, className = "w-7 h-7" }) {
  const [failed, setFailed] = React.useState(false);
  if (provider === "OVO Energy" || provider === "OVO") {
    return (
      <span className={`grid place-items-center rounded-full bg-white shrink-0 ${className}`} aria-label="OVO Energy">
        <span className="leading-none font-extrabold tracking-tight" style={{ color: "#0a9d2b", fontSize: "0.5em" }}>OVO</span>
      </span>
    );
  }
  const entry = BRAND[provider];
  const src = entry?.logo || (entry?.slug ? `https://cdn.simpleicons.org/${entry.slug}` : null);
  if (!src || failed) {
    return (
      <span className={`grid place-items-center rounded-full bg-purple/25 text-snow font-semibold shrink-0 ${className}`}>
        <span className="text-[0.6em] leading-none">{providerInitials(provider)}</span>
      </span>
    );
  }
  return (
    <span className={`grid place-items-center rounded-full bg-white shrink-0 overflow-hidden ${className}`}>
      <img
        src={src}
        alt={`${provider} logo`}
        onError={() => setFailed(true)}
        className="w-[62%] h-[62%] object-contain"
        loading="lazy"
      />
    </span>
  );
}
