// Standalone Shop page - own URL (/shop), no Home hero or other home page sections.
import Header from "./_components/header.tsx";
import Shop from "./_components/shop.tsx";
import Footer from "./_components/footer.tsx";
import BackToTop from "./_components/back-to-top.tsx";
import BottomNav from "./_components/bottom-nav.tsx";
import PromoBanner from "./_components/promo-banner.tsx";

export default function ShopPage() {
  return (
    <>
      <PromoBanner placement="top_bar" className="rounded-none" />
      <Header />
      <main className="pb-16 pt-24 md:pb-0 md:pt-28">
        <Shop />
      </main>
      <Footer />
      <BackToTop />
      <BottomNav />
    </>
  );
}
