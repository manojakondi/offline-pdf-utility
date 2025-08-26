import { useState, useRef, useEffect } from 'react';
import { reorganizePdf } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, FileText, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Download, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface PagePreview {
  index: number;
  pageNumber: number; // 1-based for display
  thumbnail: string;
}

export const OrganizeTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [renderingProgress, setRenderingProgress] = useState(0);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('pagePreviews state changed:', pagePreviews);
    console.log('pageOrder state changed:', pageOrder);
  }, [pagePreviews, pageOrder]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPagePreviews([]);
      setPageOrder([]);
      
      // Generate page previews
      await generatePagePreviews(selectedFile);
    }
  };

  const generatePagePreviews = async (pdfFile: File) => {
    setIsGeneratingPreviews(true);
    setRenderingProgress(0);
    
    try {
      console.log('Starting PDF preview generation...');
      const arrayBuffer = await pdfFile.arrayBuffer();
      console.log('PDF file loaded, array buffer size:', arrayBuffer.byteLength);
      
      // Use pdf-lib for reliable page information
      await generatePdfLibPreviews(arrayBuffer);
      
    } catch (error) {
      console.error('Error generating previews:', error);
      toast({ 
        title: 'Error', 
        description: `Could not generate page previews: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if the PDF is valid.`, 
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingPreviews(false);
      setRenderingProgress(0);
    }
  };

  const generatePdfLibPreviews = async (arrayBuffer: ArrayBuffer) => {
    console.log('Using pdf-lib for reliable preview generation');
    
    try {
      // Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      console.log('PDF loaded successfully with pdf-lib, page count:', pageCount);
      
      const previews: PagePreview[] = [];
      const order: number[] = [];
      
      for (let i = 0; i < pageCount; i++) {
        order.push(i);
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        console.log(`Creating preview for page ${i + 1}: ${width} x ${height}`);
        
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.min(200 / width, 200 / height);
          canvas.width = width * scale;
          canvas.height = height * scale;
          
          console.log(`Canvas size for page ${i + 1}: ${canvas.width} x ${canvas.height}`);
          
          // Create a professional-looking placeholder with actual page information
          createProfessionalPreview(ctx, canvas.width, canvas.height, i + 1, width, height);
          
          const thumbnailDataUrl = canvas.toDataURL();
          console.log(`Generated professional preview for page ${i + 1}, data URL length:`, thumbnailDataUrl.length);
          
          previews.push({
            index: i,
            pageNumber: i + 1,
            thumbnail: thumbnailDataUrl
          });
        }
        
        // Update progress
        setRenderingProgress(((i + 1) / pageCount) * 100);
      }
      
      console.log('All professional previews generated, setting state...');
      setPagePreviews(previews);
      setPageOrder(order);
      
      console.log('pdf-lib preview generation completed successfully');
      
    } catch (error) {
      console.error('pdf-lib method failed:', error);
      throw new Error('Could not generate previews with pdf-lib');
    }
  };

  const createLoadingPreview = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    pageNumber: number
  ) => {
    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    
    // Loading indicator
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', width / 2, height / 2);
    
    // Page number
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Arial';
    ctx.fillText(`Page ${pageNumber}`, width / 2, height - 10);
  };

  const createFallbackPreview = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    pageNumber: number, 
    originalWidth: number, 
    originalHeight: number
  ) => {
    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    
    // Page number background
    const pageNumBgHeight = 30;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, pageNumBgHeight);
    
    // Page number
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber}`, width / 2, pageNumBgHeight / 2 + 4);
    
    // Content area indicator
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(10, pageNumBgHeight + 10, width - 20, height - pageNumBgHeight - 20);
    
    // Content lines (simulating text)
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px Arial';
    const lineHeight = 12;
    const startY = pageNumBgHeight + 25;
    const numLines = Math.floor((height - startY - 10) / lineHeight);
    
    for (let j = 0; j < numLines; j++) {
      const lineWidth = Math.random() * 0.8 + 0.2; // Random line width
      ctx.fillRect(15, startY + j * lineHeight, (width - 30) * lineWidth, 2);
    }
    
    // Page dimensions info
    ctx.fillStyle = '#9ca3af';
    ctx.font = '8px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(originalWidth)} × ${Math.round(originalHeight)}`, width - 5, height - 5);
  };

  const createProfessionalPreview = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    pageNumber: number, 
    originalWidth: number, 
    originalHeight: number
  ) => {
    console.log(`Drawing professional preview for page ${pageNumber}, canvas: ${width} x ${height}`);
    
    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Professional border with subtle shadow effect
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Inner border for depth
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, width - 6, height - 6);
    
    // Header area with gradient-like effect
    const headerHeight = Math.min(35, height * 0.12);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, headerHeight);
    
    // Page number in header with professional styling
    ctx.fillStyle = '#475569';
    ctx.font = `bold ${Math.max(12, headerHeight * 0.4)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber}`, width / 2, headerHeight / 2 + 4);
    
    // Content area with simulated document structure
    const contentStart = headerHeight + 15;
    const contentHeight = height - contentStart - 15;
    
    // Title area
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${Math.max(14, width * 0.08)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('PDF Document', 12, contentStart + 20);
    
    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.max(11, width * 0.06)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillText('Professional Preview', 12, contentStart + 35);
    
    // Content lines with realistic spacing
    ctx.fillStyle = '#334155';
    ctx.font = `${Math.max(9, width * 0.05)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const lineHeight = Math.max(14, width * 0.07);
    const maxLines = Math.floor((contentHeight - 50) / lineHeight);
    
    for (let i = 0; i < maxLines; i++) {
      const y = contentStart + 55 + i * lineHeight;
      if (y < height - 20) {
        // Vary line lengths to look more realistic
        const lineLength = 0.6 + (Math.random() * 0.4);
        const text = 'This is a professional PDF page preview showing the actual page dimensions and layout structure.';
        const displayText = text.substring(0, Math.floor(text.length * lineLength));
        ctx.fillText(displayText, 12, y);
      }
    }
    
    // Footer with technical information
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.max(8, width * 0.045)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(originalWidth)} × ${Math.round(originalHeight)}`, width - 8, height - 8);
    
    // Page indicator dot
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(width - 15, height - 15, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    console.log(`Professional preview drawing completed for page ${pageNumber}`);
  };



  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;
    
    const newOrder = [...pageOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setPageOrder(newOrder);
  };

  const movePage = (fromIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...pageOrder];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= newOrder.length) return;
    
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setPageOrder(newOrder);
  };

  const sortPages = (direction: 'asc' | 'desc') => {
    const newOrder = [...pageOrder];
    if (direction === 'asc') {
      newOrder.sort((a, b) => a - b);
    } else {
      newOrder.sort((a, b) => b - a);
    }
    setPageOrder(newOrder);
  };

  const removePage = (orderIndex: number) => {
    const newOrder = [...pageOrder];
    newOrder.splice(orderIndex, 1);
    setPageOrder(newOrder);
  };

  const resetOrder = () => {
    const originalOrder = pagePreviews.map((_, index) => index);
    setPageOrder(originalOrder);
  };

  const handleOrganize = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a PDF file to organize.', variant: 'destructive' });
      return;
    }
    if (pageOrder.length === 0) {
      toast({ title: 'No pages to organize', description: 'Please wait for page previews to load.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const blob = await reorganizePdf(file, pageOrder, password);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_reorganized.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const removedPages = pagePreviews.length - pageOrder.length;
      const message = removedPages > 0 
        ? `Your PDF has been reorganized successfully. ${removedPages} page${removedPages > 1 ? 's were' : ' was'} removed.`
        : 'Your PDF has been reorganized successfully.';
      
      toast({ title: 'Success!', description: message });
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: 'Error organizing PDF', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-white">
      <h2 className="text-2xl font-bold">Organize PDF Pages</h2>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Reorganize your PDF pages by dragging and dropping them into the desired order, or use the quick sort options. You can also remove unwanted pages using the close button on each preview.
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="file">PDF File</Label>
        <Input id="file" type="file" onChange={handleFileChange} accept=".pdf" />
        {file && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
            <FileText className="h-4 w-4" />
            <span>Selected: {file.name}</span>
            {pagePreviews.length > 0 && <span>• {pagePreviews.length} pages</span>}
          </div>
        )}
      </div>

      {isGeneratingPreviews && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-sm text-gray-400 mt-2">Generating page previews...</p>
          {renderingProgress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${renderingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round(renderingProgress)}% complete
              </p>
            </div>
          )}
        </div>
      )}

      {pagePreviews.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => sortPages('asc')}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Sort Ascending
            </Button>
            <Button
              onClick={() => sortPages('desc')}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              Sort Descending
            </Button>
            <Button
              onClick={resetOrder}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset Order
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Page Order (drag to reorder)</Label>
              <div className="text-sm text-gray-400">
                {pageOrder.length} of {pagePreviews.length} pages selected
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pageOrder.map((pageIndex, orderIndex) => {
                const page = pagePreviews[pageIndex];
                return (
                  <div
                    key={`${pageIndex}-${orderIndex}`}
                    className="relative group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, orderIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, orderIndex)}
                  >
                    <div className="border-2 border-gray-600 rounded-lg p-2 bg-gray-800 hover:border-blue-500 transition-colors cursor-move">
                      {/* Close button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(orderIndex);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <img
                        src={page.thumbnail}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-auto rounded"
                      />
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium">Page {page.pageNumber}</p>
                        <p className="text-xs text-gray-400">Position {orderIndex + 1}</p>
                      </div>
                      
                      {/* Move buttons */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={() => movePage(orderIndex, 'up')}
                            disabled={orderIndex === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={() => movePage(orderIndex, 'down')}
                            disabled={orderIndex === pageOrder.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      
      <div>
        <Label htmlFor="password">Password (if encrypted)</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
      
      <Button 
        onClick={handleOrganize} 
        disabled={isLoading || pageOrder.length === 0} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Organizing PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Reorganized PDF
          </>
        )}
      </Button>
      
      <div className="text-sm text-gray-400 text-center">
        <p>Pages will be reorganized according to the order shown above</p>
        <p>Drag and drop pages or use the quick sort buttons</p>
      </div>
    </div>
  );
};
