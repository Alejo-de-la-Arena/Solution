import HeroSection from '../../components/home/_unused/HeroSection';
import TrustBar from '../../components/home/_unused/TrustBar';
import PilaresSection from '../../components/home/_unused/PilaresSection';
import ProductsScrollSection from '../../components/home/_unused/ProductsScrollSection';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import FinalCtaSection from '../../components/home/FinalCtaSection';

export default function Home() {
  return (
    <div className="home-page bg-black text-white min-h-screen">
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
