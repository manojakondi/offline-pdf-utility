import { FileText } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gradient-primary p-2 shadow-glow">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PDF Utility</h1>
              <p className="text-sm text-muted-foreground">Professional PDF Tools</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};