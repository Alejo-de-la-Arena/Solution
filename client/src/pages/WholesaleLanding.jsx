import WholesaleHero from '../components/wholesale/WholesaleHero';
import WholesaleBenefits from '../components/wholesale/WholesaleBenefits';
import WholesaleTypes from '../components/wholesale/WholesaleTypes';
import WholesaleAccess from '../components/wholesale/WholesaleAccess';

export default function WholesaleLanding() {
  return (
    <div className="bg-black text-white min-h-screen">
      <WholesaleHero />
      <WholesaleBenefits />
      <WholesaleTypes />
      <WholesaleAccess />
    </div>
  );
}
