import WholesaleHero from "../components/wholesale/WholesaleHero";
import WholesaleBenefitsGrid from "../components/wholesale/WholesaleBenefitsGrid";
import WholesaleImages from "../components/wholesale/WholesaleImages";
import WholesaleTypes from "../components/wholesale/WholesaleTypes";
import WholesalePriceTable from "../components/wholesale/WholesalePriceTable";
import WholesaleAccess from "../components/wholesale/WholesaleAccess";

export default function WholesaleLanding() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      <WholesaleHero />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
      <WholesaleBenefitsGrid />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
      <WholesaleImages />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
      <WholesaleTypes />
      <WholesalePriceTable />
      <WholesaleAccess />
    </div>
  );
}
