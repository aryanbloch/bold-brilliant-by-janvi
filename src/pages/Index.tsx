import Header from "./_components/header.tsx";
import Hero from "./_components/hero.tsx";
import Showcase from "./_components/showcase.tsx";
import Gallery from "./_components/gallery.tsx";
import About from "./_components/about.tsx";
import Founder from "./_components/founder.tsx";
import Testimonials from "./_components/testimonials.tsx";
import OrderGuide from "./_components/order-guide.tsx";
import FaqContact from "./_components/faq-contact.tsx";
import Footer from "./_components/footer.tsx";
import BackToTop from "./_components/back-to-top.tsx";
import BottomNav from "./_components/bottom-nav.tsx";
import PromoBanner from "./_components/promo-banner.tsx";
import PopupBanner from "./_components/popup-banner.tsx";

// Shop, Book and My Orders each live on their own page now - see src/pages/Shop.tsx, Book.tsx
// and Orders.tsx - so they no longer render here.
export default function Index() {
  return (
    <>
      <PromoBanner placement="top_bar" className="rounded-none" />
      <Header />
      <main className="pb-16 md:pb-0">
        <Hero />
        <Showcase />
        <Gallery />
        <About />
        <Founder />
        <Testimonials />
        <OrderGuide />
        <FaqContact />
      </main>
      <Footer />
      <BackToTop />
      <BottomNav />
      <PopupBanner />
    </>
  );
}
