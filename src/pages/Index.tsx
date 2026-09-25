import Header from "./_components/header.tsx";
import Hero from "./_components/hero.tsx";
import Showcase from "./_components/showcase.tsx";
import Portfolio from "./_components/portfolio.tsx";
import About from "./_components/about.tsx";
import Founder from "./_components/founder.tsx";
import Booking from "./_components/booking.tsx";
import FaqContact from "./_components/faq-contact.tsx";
import Footer from "./_components/footer.tsx";
import FloatingContacts from "./_components/floating-contacts.tsx";

export default function Index() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Showcase />
        <Portfolio />
        <About />
        <Founder />
        <Booking />
        <FaqContact />
      </main>
      <Footer />
      <FloatingContacts />
    </>
  );
}
