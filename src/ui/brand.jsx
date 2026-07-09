import React from "react";
import { providerInitials } from "../data/catalog";

/* Brand-logo mapping. Each provider carries a domain (drives Clearbit + Google favicon)
   and/or a Simple Icons slug. BrandLogo walks the chain and only shows initials if
   every source fails, so every membership resolves to a real logo. */
export const BRAND = {
  "Monzo":            { slug: "monzo",        domain: "monzo.com" },
  "Revolut":          { slug: "revolut",      domain: "revolut.com" },
  "OVO Energy":       { slug: "ovoenergy",    domain: "ovoenergy.com" },
  "OVO":              { slug: "ovoenergy",    domain: "ovoenergy.com" },
  "Sky TV":           { slug: "sky",          domain: "sky.com" },
  "Sky":              { slug: "sky",          domain: "sky.com" },
  "Lidl":             { slug: "lidl",         domain: "lidl.co.uk" },
  "O2":               { slug: "o2",           domain: "o2.co.uk" },
  "Tesco":            { domain: "tesco.com" },
  "Boots":            { domain: "boots.com" },
  "IKEA":             { domain: "ikea.com" },
  "Greggs":           { domain: "greggs.co.uk" },
  "Nando's":          { domain: "nandos.co.uk" },
  "Pret":             { domain: "pret.co.uk" },
  "Deliveroo":        { domain: "deliveroo.co.uk" },
  "Amazon":           { domain: "amazon.co.uk" },
  "Spotify":          { slug: "spotify", domain: "spotify.com" },
  "Cineworld":        { domain: "cineworld.co.uk" },
  "ASOS":             { domain: "asos.com" },
  "Nationwide":       { domain: "nationwide.co.uk" },
  "Santander":        { domain: "santander.co.uk" },
  "American Express": { domain: "americanexpress.com" },
  "Vodafone":         { domain: "vodafone.co.uk" },
  "Costco":           { domain: "costco.co.uk" },
  "Blue Light Card":  { domain: "bluelightcard.co.uk" },
  "National Trust":   { domain: "nationaltrust.org.uk" },
  "Railcard":         { domain: "railcard.co.uk" },
  "British Airways":  { domain: "britishairways.com" },
  "British Gas":      { domain: "britishgas.co.uk" },
  "E.On Next":        { domain: "eonnext.com" },
  "EDF":              { domain: "edfenergy.com" },
  "Octopus Energy":   { domain: "octopus.energy" },
  "Scottish Power":   { domain: "scottishpower.co.uk" },
  "Utilita":          { domain: "utilita.co.uk" },
  "Utility Warehouse":{ domain: "uw.co.uk" },
  "EE":               { domain: "ee.co.uk" },
  "Three":            { domain: "three.co.uk" },
  "giffgaff":         { slug: "giffgaff", domain: "giffgaff.com" },
  "Sky Mobile":       { slug: "sky", domain: "sky.com" },
  "Tesco Mobile":     { domain: "tescomobile.com" },
  "Lebara":           { domain: "lebara.com" },
  "BT":               { domain: "bt.com" },
  "Sky Broadband":    { slug: "sky", domain: "sky.com" },
  "Virgin Media":     { domain: "virginmedia.com" },
  "TalkTalk":         { domain: "talktalk.co.uk" },
  "Plusnet":          { domain: "plus.net" },
  "Vodafone Broadband":{ domain: "vodafone.co.uk" },
  "Hyperoptic":       { domain: "hyperoptic.com" },
  "Community Fibre":  { domain: "communityfibre.co.uk" },
  "Netflix":          { slug: "netflix", domain: "netflix.com" },
  "Disney+":          { domain: "disneyplus.com" },
  "Apple TV+":        { slug: "appletv", domain: "apple.com" },
  "NOW":              { domain: "nowtv.com" },
  "Paramount+":       { slug: "paramountplus", domain: "paramountplus.com" },
  "YouTube Premium":  { slug: "youtube", domain: "youtube.com" },
  "Apple Music":      { slug: "applemusic", domain: "apple.com" },
  "Amazon Music":     { domain: "amazon.co.uk" },
  "YouTube Music":    { slug: "youtubemusic", domain: "youtube.com" },
  "Tidal":            { slug: "tidal", domain: "tidal.com" },
  "Deezer":           { slug: "deezer", domain: "deezer.com" },
  "Barclaycard":      { domain: "barclaycard.co.uk" },
  "HSBC":             { domain: "hsbc.co.uk" },
  "NatWest":          { domain: "natwest.com" },
  "M&S Bank":         { domain: "marksandspencer.com" },
  "John Lewis Money": { domain: "johnlewis.com" },
  "Virgin Money":     { domain: "virginmoney.com" },
};

/* Ordered logo sources for a provider: full-colour logo, brand glyph, then favicon. */
export function brandLogoSources(provider) {
  const e = BRAND[provider];
  if (!e) return [];
  const out = [];
  if (e.domain) out.push(`https://logo.clearbit.com/${e.domain}`);
  if (e.slug) out.push(`https://cdn.simpleicons.org/${e.slug}`);
  if (e.domain) out.push(`https://www.google.com/s2/favicons?domain=${e.domain}&sz=64`);
  return [...new Set(out)];
}

export function BrandLogo({ provider, className = "w-7 h-7" }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { setIdx(0); }, [provider]);

  if (provider === "OVO Energy" || provider === "OVO") {
    /* SVG so the wordmark scales with the badge box (em-based text didn't — it
       tracked the surrounding font size, so it rendered tiny or clipped). */
    return (
      <span className={`grid place-items-center rounded-full bg-white overflow-hidden shrink-0 ${className}`} aria-label="OVO Energy">
        <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
          <text x="20" y="24.5" textAnchor="middle" dominantBaseline="middle" fontFamily="Outfit, system-ui, sans-serif" fontWeight="800" fontSize="14" letterSpacing="-0.5" fill="#0a9d2b">OVO</text>
        </svg>
      </span>
    );
  }

  const srcs = brandLogoSources(provider);
  const src = srcs[idx];
  if (!src) {
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
        onError={() => setIdx((i) => i + 1)}
        className="w-[62%] h-[62%] object-contain"
        loading="lazy"
      />
    </span>
  );
}
