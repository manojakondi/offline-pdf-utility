import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Upload, FileDown, Info } from 'lucide-react';
import { compressPdf, getCompressionInfo } from '@/lib/pdf-utils';

interface CompressionInfo {
  originalSize: number;
  originalSizeMB: string;
  estimatedCompressedSize: {
    extreme: string;
    recommended: string;
    minimal: string;
  };
}

export const CompressTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<number>(2); // Default to recommended
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      try {
        // Get compression information
        const info = await getCompressionInfo(selectedFile);
        setCompressionInfo(info);
      } catch (error) {
        console.error('Error getting compression info:', error);
        toast({
          title: 'Error',
          description: 'Could not analyze PDF file. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleCompress = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to compress.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const compressedBlob = await compressPdf(file, selectedQuality, password || undefined);
      
      // Create download link
      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const originalName = file.name.replace(/\.pdf$/i, '');
      const qualityNames = ['extreme', 'recommended', 'minimal'];
      const qualityName = qualityNames[selectedQuality - 1];
      link.download = `${originalName}_compressed_${qualityName}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Show success message with size comparison
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedBlob.size / (1024 * 1024)).toFixed(2);
      const reduction = ((file.size - compressedBlob.size) / file.size * 100).toFixed(1);
      
      toast({
        title: 'Success!',
        description: `PDF compressed successfully! Reduced from ${originalSizeMB}MB to ${compressedSizeMB}MB (${reduction}% reduction)`,
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getQualityDescription = (quality: number) => {
    switch (quality) {
      case 1:
        return 'Extreme Compression - Less Quality, High Compression';
      case 2:
        return 'Recommended Compression - Good Quality, Good Compression';
      case 3:
        return 'Minimal Compression - High Quality, Less Compression';
      default:
        return '';
    }
  };

  const getQualityColor = (quality: number) => {
    switch (quality) {
      case 1:
        return 'bg-red-900/20 text-red-300 border-red-700';
      case 2:
        return 'bg-blue-900/20 text-blue-300 border-blue-700';
      case 3:
        return 'bg-green-900/20 text-green-300 border-green-700';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 text-white">
      <h2 className="text-2xl font-bold">Compress PDF</h2>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Compress your PDF files to reduce file size while maintaining quality. Choose the compression level that best fits your needs.
        </AlertDescription>
      </Alert>

      {/* File Upload */}
      <div>
        <Label htmlFor="pdf-file">PDF File</Label>
        <Input
          id="pdf-file"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
        {file && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
            <FileText className="h-4 w-4" />
            <span>Selected: {file.name}</span>
            <span className="text-gray-500">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
          </div>
        )}
      </div>

      {/* Compression Info Display & Quality Selection */}
      {compressionInfo && (
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4 border border-gray-700">
          <h3 className="font-semibold text-white">Compression Options</h3>
          
          {/* File Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Original Size:</span>
              <span className="ml-2 font-medium text-white">{compressionInfo.originalSizeMB} MB</span>
            </div>
            <div>
              <span className="text-gray-400">Pages:</span>
              <span className="ml-2 font-medium text-white">Analyzing...</span>
            </div>
          </div>
          
          {/* Quality Selection */}
          <div>
            <Label className="text-white">Select Compression Level</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[1, 2, 3].map((quality) => (
                <button
                  key={quality}
                  onClick={() => setSelectedQuality(quality)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedQuality === quality
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  }`}
                >
                  <div className={`text-xs px-2 py-1 rounded-full mb-2 inline-block ${getQualityColor(quality)}`}>
                    {quality === 1 ? 'Extreme' : quality === 2 ? 'Recommended' : 'Minimal'}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {quality === 1 ? 'Extreme' : quality === 2 ? 'Recommended' : 'Minimal'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {quality === 1 ? 'High compression' : quality === 2 ? 'Balanced' : 'High quality'}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Estimated Results */}
            <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <h4 className="font-medium text-white mb-2">Estimated Results:</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-red-900/20 rounded border border-red-700">
                  <div className="font-medium text-red-300">Extreme</div>
                  <div className="text-red-400">~{compressionInfo.estimatedCompressedSize.extreme} MB</div>
                  <div className="text-red-500">~70% smaller</div>
                </div>
                <div className="text-center p-2 bg-blue-900/20 rounded border border-blue-700">
                  <div className="font-medium text-blue-300">Recommended</div>
                  <div className="text-blue-400">~{compressionInfo.estimatedCompressedSize.recommended} MB</div>
                  <div className="text-blue-500">~40% smaller</div>
                </div>
                <div className="text-center p-2 bg-green-900/20 rounded border border-green-700">
                  <div className="font-medium text-green-300">Minimal</div>
                  <div className="text-green-400">~{compressionInfo.estimatedCompressedSize.minimal} MB</div>
                  <div className="text-green-500">~15% smaller</div>
                </div>
              </div>
            </div>
            
            {/* Selected Quality Description */}
            {selectedQuality && (
              <div className={`p-3 rounded-lg border mt-3 ${getQualityColor(selectedQuality)}`}>
                <div className="font-medium text-white">
                  {getQualityDescription(selectedQuality)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Input */}
      <div>
        <Label htmlFor="password">Password (if PDF is encrypted)</Label>
        <Input
          id="password"
          type="password"
          placeholder="Leave empty if not encrypted"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Compress Button */}
      <Button
        onClick={handleCompress}
        disabled={!file || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Compressing...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Compress PDF
          </>
        )}
      </Button>

      {/* Tips */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h4 className="font-medium text-blue-300 mb-2">💡 Compression Tips</h4>
        <ul className="text-sm text-blue-400 space-y-1">
          <li>• <strong>Extreme:</strong> Best for sharing via email or storage optimization</li>
          <li>• <strong>Recommended:</strong> Good balance for most use cases</li>
          <li>• <strong>Minimal:</strong> Best for printing or when quality is critical</li>
        </ul>
      </div>
    </div>
  );
};
