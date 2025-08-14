import { GlassHeader } from "@/components/GlassHeader";
import { GlassDashboard } from "@/components/GlassDashboard";
import { FloatingOrbs } from "@/components/FloatingOrbs";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg relative">
      <FloatingOrbs />
      <GlassHeader />
      <GlassDashboard />
    </div>
  );
};

export default Index;
