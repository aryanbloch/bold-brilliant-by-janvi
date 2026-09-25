import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import Index from "./pages/Index.tsx";

createRoot(document.getElementById("root")!).render(
  <>
    <Index />
    <Toaster position="top-center" richColors />
  </>,
);
