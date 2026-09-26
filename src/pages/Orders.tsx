// Standalone My Orders page - own URL (/orders), no Home hero or other home page sections.
import Header from "./_components/header.tsx";
import MyOrders from "./_components/my-orders.tsx";
import Footer from "./_components/footer.tsx";
import BackToTop from "./_components/back-to-top.tsx";
import BottomNav from "./_components/bottom-nav.tsx";
import PromoBanner from "./_components/promo-banner.tsx";

export default function OrdersPage() {
  return (
    <>
      <PromoBanner placement="top_bar" className="rounded-none" />
      <Header />
      <main className="pb-16 pt-24 md:pb-0 md:pt-28">
        <MyOrders />
      </main>
      <Footer />
      <BackToTop />
      <BottomNav />
    </>
  );
}
