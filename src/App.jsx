import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { TopNav, Footer } from "./ui/components";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Perks from "./pages/Perks";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AppShell from "./app/AppShell";
import { PerkDrawerProvider } from "./ui/PerkDrawer";

function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink text-snow">
      <TopNav />
      <main className="max-w-content mx-auto px-4 pt-24">{children}</main>
      <Footer />
    </div>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <PerkDrawerProvider>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<MarketingLayout><Home /></MarketingLayout>} />
        <Route path="/how-it-works" element={<MarketingLayout><HowItWorks /></MarketingLayout>} />
        <Route path="/perks" element={<MarketingLayout><Perks /></MarketingLayout>} />
        <Route path="/pricing" element={<MarketingLayout><Pricing /></MarketingLayout>} />
        <Route path="/signup" element={<MarketingLayout><Auth mode="signup" /></MarketingLayout>} />
        <Route path="/login" element={<MarketingLayout><Auth mode="login" /></MarketingLayout>} />

        {/* New design-system Profile page (live Supabase data) */}
        <Route path="/app/account" element={<Profile />} />

        {/* Existing authenticated app — preserved */}
        <Route path="/app/*" element={<AppShell />} />

        <Route path="*" element={<MarketingLayout><Home /></MarketingLayout>} />
      </Routes>
    </PerkDrawerProvider>
  );
}
