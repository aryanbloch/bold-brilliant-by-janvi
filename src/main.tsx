import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import Index from "./pages/Index.tsx";
import { CartProvider } from "./hooks/use-cart.tsx";
import ProfileProvider from "./components/profile/profile-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <ProfileProvider>
      <Index />
    </ProfileProvider>
    <Toaster position="top-center" richColors />
  </CartProvider>,
);
