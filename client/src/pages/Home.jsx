import HeroSection from '../components/home/HeroSection';
import TrustBar from '../components/home/TrustBar';
import PilaresSection from '../components/home/PilaresSection';
import ProductsScrollSection from '../components/home/ProductsScrollSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FinalCtaSection from '../components/home/FinalCtaSection';

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      <main>
        <HeroSection />
        <TrustBar />
        <PilaresSection />
        <ProductsScrollSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>
    </div>
  );
}
