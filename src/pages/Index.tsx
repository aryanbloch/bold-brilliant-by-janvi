import Header from "./_components/header.tsx";
import Hero from "./_components/hero.tsx";
import Showcase from "./_components/showcase.tsx";
import Gallery from "./_components/gallery.tsx";
import Shop from "./_components/shop.tsx";
import About from "./_components/about.tsx";
import Founder from "./_components/founder.tsx";
import Testimonials from "./_components/testimonials.tsx";
import Booking from "./_components/booking.tsx";
import OrderGuide from "./_components/order-guide.tsx";
import MyOrders from "./_components/my-orders.tsx";
import FaqContact from "./_components/faq-contact.tsx";
import Footer from "./_components/footer.tsx";
import BackToTop from "./_components/back-to-top.tsx";

export default function Index() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Showcase />
        <Gallery />
        <Shop />
        <About />
        <Founder />
        <Testimonials />
        <Booking />
        <OrderGuide />
        <MyOrders />
        <FaqContact />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
