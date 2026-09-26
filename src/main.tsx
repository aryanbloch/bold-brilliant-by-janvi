import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import Index from "./pages/Index.tsx";
import ShopPage from "./pages/Shop.tsx";
import AdminPage from "./pages/admin.tsx";
import { CartProvider } from "./hooks/use-cart.tsx";
import { SiteSettingsProvider } from "./hooks/use-site-settings.tsx";
import ProfileProvider from "./components/profile/profile-provider.tsx";

// /admin shows a separate password-gated dashboard for the studio owner - see src/pages/admin.tsx.
// /shop shows the shop as its own standalone page (no home page sections) - see src/pages/Shop.tsx.
const path = window.location.pathname;
const isAdmin = path.startsWith("/admin");
const isShop = path.startsWith("/shop");

// Browsers sometimes restore the previous scroll position on reload (or when returning from the
// back-forward cache), dropping visitors into the middle of the page instead of the top. Force
// every fresh load to start at the top, unless the url points at a specific section via a hash.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const forceScrollTop = () => {
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
};

forceScrollTop();
// Some browsers restore scroll position after the initial script runs (once layout/images settle),
// so re-apply on the window's load event and when the page is restored from cache.
window.addEventListener("load", forceScrollTop);
window.addEventListener("pageshow", forceScrollTop);

createRoot(document.getElementById("root")!).render(
  isAdmin ? (
    <>
      <AdminPage />
      <Toaster position="top-center" richColors />
    </>
  ) : (
    <SiteSettingsProvider>
      <CartProvider>
        <ProfileProvider>{isShop ? <ShopPage /> : <Index />}</ProfileProvider>
        <Toaster position="top-center" richColors />
      </CartProvider>
    </SiteSettingsProvider>
  ),
);
