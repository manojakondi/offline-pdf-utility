import { useState } from 'react';
import { 
  FileText, 
  Scissors, 
  Copy, 
  Edit3, 
  RefreshCw, 
  Minimize, 
  Lock,
  Shield,
  Sparkles,
  ArrowUpDown,
  FileDown
} from "lucide-react";
import { GlassPDFCard } from "./GlassPDFCard";
import { SplitTool } from './tools/SplitTool';
import { MergeTool } from './tools/MergeTool';
import { UnlockTool } from './tools/UnlockTool';
import { EditTool } from './tools/EditTool';
import { AddWatermarkTool } from './tools/AddWatermarkTool';
import { ConvertTool } from './tools/ConvertTool';
import { OrganizeTool } from './tools/OrganizeTool';
import { CompressTool } from './tools/CompressTool';

const pdfTools = [
  {
    id: "split",
    title: "Split PDF",
    description: "Split PDF into individual pages and download as a ZIP archive.",
    icon: Scissors,
  },
  {
    id: "merge",
    title: "Merge PDF",
    description: "Combine multiple PDF documents into a single file.",
    icon: Copy,
  },
  {
    id: "organize",
    title: "Organize PDF",
    description: "Reorganize PDF pages with drag-and-drop and visual previews.",
    icon: ArrowUpDown,
  },
  {
    id: "edit",
    title: "Edit Metadata",
    description: "Modify your PDF's title, author, subject, and keywords.",
    icon: Edit3,
  },
  {
    id: "convert",
    title: "Convert to PDF",
    description: "Convert JPG, PNG, or DOCX files to PDF format.",
    icon: RefreshCw,
  },
  {
    id: "unlock",
    title: "Unlock PDF",
    description: "Remove password protection from encrypted PDF files.",
    icon: Shield,
  },
  {
    id: "watermark",
    title: "Add Watermark",
    description: "Apply a text watermark to every page of your PDF.",
    icon: Sparkles,
  },
  {
    id: "compress",
    title: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality with three compression levels.",
    icon: FileDown,
  },
];

export const GlassDashboard = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
  };

  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Hero section with glassmorphism */}
        <div className="text-center mb-20 animate-scale-in">
          <div className="inline-flex items-center space-x-2 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-primary-soft" />
            <span className="text-sm font-medium text-muted-foreground">Professional PDF Tools</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Choose Your
            <span className="block bg-gradient-warm bg-clip-text text-transparent">
              PDF Tool
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Professional-grade document processing with stunning visual feedback. 
            Every operation is performed locally for <span className="text-primary-soft font-medium">maximum security</span> and speed.
          </p>
        </div>

        {/* Tools grid with staggered animations */}
              {activeTool ? (
        <div>
          <button 
            onClick={() => setActiveTool(null)} 
            className="mb-6 px-4 py-2 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-lg text-white hover:bg-glass-bg/80 transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Tools</span>
          </button>
          {activeTool === 'split' && <SplitTool />}
          {activeTool === 'merge' && <MergeTool />}
          {activeTool === 'organize' && <OrganizeTool />}
          {activeTool === 'unlock' && <UnlockTool />}
          {activeTool === 'edit' && <EditTool />}
          {activeTool === 'convert' && <ConvertTool />}
          {activeTool === 'watermark' && <AddWatermarkTool />}
          {activeTool === 'compress' && <CompressTool />}
          {/* Other tools will be rendered here */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {pdfTools.map((tool, index) => (
            <GlassPDFCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              onClick={() => handleToolClick(tool.id)}
              delay={index * 100}
            />
          ))}
        </div>
      )}
        {/* Security badge */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-2xl px-6 py-4 shadow-glass">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-warm rounded-lg blur-sm opacity-40"></div>
              <div className="relative rounded-lg bg-glass-bg backdrop-blur-sm border border-glass-border p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">100% Offline Processing</p>
              <p className="text-xs text-muted-foreground">Your files never leave your device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};