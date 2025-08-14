import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PDFToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const PDFToolCard = ({ title, description, icon: Icon, onClick }: PDFToolCardProps) => {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 bg-gradient-card border-border hover:shadow-card-hover hover:scale-105 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-gradient-primary p-4 shadow-glow group-hover:shadow-glow transition-all duration-300">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        
        <h3 className="mb-3 text-xl font-semibold text-foreground group-hover:text-primary-glow transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};