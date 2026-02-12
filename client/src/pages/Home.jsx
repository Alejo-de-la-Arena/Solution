import HeroSection from '../components/home/HeroSection';
import DelReventaSection from '../components/home/DelReventaSection';
import CtaColeccionSection from '../components/home/CtaColeccionSection';
import ElProcesoSection from '../components/home/ElProcesoSection';
import CirculoCincoSection from '../components/home/CirculoCincoSection';
import ElResultadoSection from '../components/home/ElResultadoSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import WholesaleSection from '../components/home/WholesaleSection';
import FinalCtaSection from '../components/home/FinalCtaSection';

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      <main>
        <HeroSection />
        <DelReventaSection />
        <CtaColeccionSection />
        <ElProcesoSection />
        <CirculoCincoSection />
        <ElResultadoSection />
        <TestimonialsSection />
        <WholesaleSection />
        <FinalCtaSection />
      </main>
    </div>
  );
}
