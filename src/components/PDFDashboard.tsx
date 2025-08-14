import { 
  FileText, 
  Scissors, 
  Copy, 
  Edit3, 
  RefreshCw, 
  Minimize, 
  Lock 
} from "lucide-react";
import { PDFToolCard } from "./PDFToolCard";

const pdfTools = [
  {
    id: "split",
    title: "Split PDF",
    description: "Extract pages or split PDF into multiple documents with precise control",
    icon: Scissors,
  },
  {
    id: "merge",
    title: "Merge PDF",
    description: "Combine multiple PDF files into a single document in any order",
    icon: Copy,
  },
  {
    id: "edit",
    title: "Edit Pages",
    description: "Rotate, delete, reorder, and modify pages within your PDF documents",
    icon: Edit3,
  },
  {
    id: "convert",
    title: "Convert",
    description: "Convert PDF to various formats or convert other formats to PDF",
    icon: RefreshCw,
  },
  {
    id: "compress",
    title: "Compress",
    description: "Reduce PDF file size while maintaining quality and readability",
    icon: Minimize,
  },
  {
    id: "password",
    title: "Password Tools",
    description: "Add password protection or remove security from PDF documents",
    icon: Lock,
  },
];

export const PDFDashboard = () => {
  const handleToolClick = (toolId: string) => {
    console.log(`Opening ${toolId} tool`);
    // This is where you'll connect to your backend
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Choose Your PDF Tool
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade PDF utilities for all your document processing needs. 
            Fast, secure, and completely offline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pdfTools.map((tool) => (
            <PDFToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              onClick={() => handleToolClick(tool.id)}
            />
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">All processing happens offline - your files never leave your device</span>
          </div>
        </div>
      </div>
    </div>
  );
};