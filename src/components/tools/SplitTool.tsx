import { useState } from 'react';
import { splitPdfIntoMultipleFiles, splitPdfByRanges } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, FileText } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PDFDocument } from 'pdf-lib';

export const SplitTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState('');
  const [password, setPassword] = useState('');
  const [splitMode, setSplitMode] = useState<'individual' | 'ranges'>('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Get page count for user guidance
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPageCount(pdfDoc.getPageCount());
      } catch (error) {
        setPageCount(null);
        console.warn('Could not determine page count:', error);
      }
    }
  };

  const handleSplit = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a PDF file to split.', variant: 'destructive' });
      return;
    }
    if (!pages) {
      toast({ title: 'No pages specified', description: 'Please enter the page range to extract.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const blob = splitMode === 'individual' 
        ? await splitPdfIntoMultipleFiles(file, pages, password)
        : await splitPdfByRanges(file, pages, password);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = splitMode === 'individual' 
        ? `${file.name.replace('.pdf', '')}_split_pages.zip`
        : `${file.name.replace('.pdf', '')}_split_ranges.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const modeText = splitMode === 'individual' ? 'individual pages' : 'page ranges';
      toast({ 
        title: 'Success!', 
        description: `Your PDF has been split into ${modeText} and downloaded as a ZIP file.` 
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: 'Error splitting PDF', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-white">
      <h2 className="text-2xl font-bold">Split PDF</h2>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Choose how you want to split your PDF and specify the page ranges. Each split will become a separate PDF file, packaged into a ZIP archive.
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="file">PDF File</Label>
        <Input id="file" type="file" onChange={handleFileChange} accept=".pdf" />
        {file && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
            <FileText className="h-4 w-4" />
            <span>Selected: {file.name}</span>
            {pageCount && <span>• {pageCount} pages</span>}
          </div>
        )}
      </div>
      
      <div>
        <Label>Split Mode</Label>
        <RadioGroup value={splitMode} onValueChange={(value: 'individual' | 'ranges') => setSplitMode(value)} className="mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="text-sm">Individual Pages</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ranges" id="ranges" />
            <Label htmlFor="ranges" className="text-sm">Page Ranges</Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-gray-400 mt-1">
          {splitMode === 'individual' 
            ? 'Each page becomes a separate PDF file'
            : 'Each range becomes a separate PDF file'
          }
        </p>
      </div>
      
      <div>
        <Label htmlFor="pages">
          {splitMode === 'individual' ? 'Pages to Extract' : 'Page Ranges'}
        </Label>
        <Input 
          id="pages" 
          value={pages} 
          onChange={(e) => setPages(e.target.value)} 
          placeholder={splitMode === 'individual' ? "1, 3, 5" : "1-3, 4-6, 8"} 
        />
        <p className="text-sm text-gray-400 mt-1">
          {splitMode === 'individual' 
            ? 'Examples: 1, 3, 5 or 1-5 or "all" for all pages'
            : 'Examples: 1-3, 4-6, 8 (creates 3 separate PDFs)'
          }
        </p>
        {pageCount && (
          <p className="text-xs text-gray-500 mt-1">
            Available pages: 1 to {pageCount}
          </p>
        )}
      </div>
      
      <div>
        <Label htmlFor="password">Password (if encrypted)</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
      
      <Button onClick={handleSplit} disabled={isLoading} className="w-full">
        {isLoading ? 'Splitting PDF...' : `Split PDF by ${splitMode === 'individual' ? 'Pages' : 'Ranges'}`}
      </Button>
      
      <div className="text-sm text-gray-400 text-center">
        <p>
          {splitMode === 'individual' 
            ? 'Each page will become a separate PDF file'
            : 'Each range will become a separate PDF file'
          }
        </p>
        <p>Files will be downloaded as a ZIP archive</p>
      </div>
    </div>
  );
};
