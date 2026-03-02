import WholesaleHero from "../components/wholesale/WholesaleHero";
import WholesaleBenefitsGrid from "../components/wholesale/WholesaleBenefitsGrid";
import WholesaleImages from "../components/wholesale/WholesaleImages";
import WholesaleTypes from "../components/wholesale/WholesaleTypes";
import WholesalePriceTable from "../components/wholesale/WholesalePriceTable";
import WholesaleAccess from "../components/wholesale/WholesaleAccess";

export default function WholesaleLanding() {
  return (
    <div className="bg-black text-white min-h-screen">
      <WholesaleHero />
      <div className="border-t border-white/10" />
      <WholesaleBenefitsGrid />
      <div className="border-t border-white/10" />
      <WholesaleImages />
      <div className="border-t border-white/10" />
      <WholesaleTypes />
      <WholesalePriceTable />
      <WholesaleAccess />
    </div>
  );
}
