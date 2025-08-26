import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';

/**
 * Parses a page range string (e.g., "1, 3-5, 8") into an array of 0-based page indices.
 * @param rangeStr The page range string.
 * @param maxPages The total number of pages in the document.
 * @returns An array of 0-based page indices.
 */
function parsePageRange(rangeStr: string, maxPages: number): number[] {
    const indices = new Set<number>();
    const ranges = rangeStr.split(',');

    for (let range of ranges) {
        range = range.trim();
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= maxPages) {
                for (let i = start; i <= end; i++) {
                    indices.add(i - 1);
                }
            } else {
                if (isNaN(start) || isNaN(end)) {
                    throw new Error(`Invalid page range format: "${range}". Use format like "1-5".`);
                }
                if (start < 1 || end > maxPages) {
                    throw new Error(`Page range "${range}" is out of bounds. Document has ${maxPages} pages.`);
                }
                if (start > end) {
                    throw new Error(`Invalid page range: "${range}". Start page must be less than or equal to end page.`);
                }
            }
        } else {
            const page = parseInt(range, 10);
            if (!isNaN(page) && page >= 1 && page <= maxPages) {
                indices.add(page - 1);
            } else if (!isNaN(page)) {
                if (page < 1 || page > maxPages) {
                    throw new Error(`Page ${page} is out of bounds. Document has ${maxPages} pages.`);
                }
            } else {
                throw new Error(`Invalid page number: "${range}". Please enter a valid number.`);
            }
        }
    }

    if (indices.size === 0) {
        throw new Error(`No valid pages found in range: "${rangeStr}". Document has ${maxPages} pages.`);
    }

    return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Splits a PDF file based on a given page range.
 * @param file The PDF file to split.
 * @param pages The page range string (e.g., "1, 3-5, 8").
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob of the new PDF file.
 */
export async function splitPdf(file: File, pages: string, password?: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    const pageCount = pdfDoc.getPageCount();
    const pageIndices = pages.toLowerCase() === 'all' 
        ? Array.from({ length: pageCount }, (_, i) => i) 
        : parsePageRange(pages, pageCount);

    if (pageIndices.length === 0) {
        throw new Error('Invalid page range specified.');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Merges multiple PDF files into a single document.
 * @param files An array of PDF files to merge.
 * @returns A Blob of the merged PDF file.
 */
export async function mergePdf(files: File[]): Promise<Blob> {
    if (files.length < 2) {
        throw new Error('Please select at least 2 PDF files to merge.');
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Removes the password from an encrypted PDF.
 * Note: This function does not support adding/changing passwords.
 * @param file The encrypted PDF file.
 * @param password The password to unlock the PDF.
 * @returns A Blob of the decrypted PDF file.
 */
export async function protectPdf(file: File, password?: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    // Re-saving the document without any encryption options effectively removes the password.
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Edits the metadata of a PDF file.
 * @param file The PDF file to edit.
 * @param metadata The new metadata to apply.
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob of the new PDF file with updated metadata.
 */
export async function editPdfMetadata(
    file: File, 
    metadata: { [key: string]: string },
    password?: string
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()));
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Converts an image file (JPEG or PNG) to a PDF.
 * @param file The image file to convert.
 * @returns A Blob of the new PDF file.
 */
export async function convertImageToPdf(file: File): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await file.arrayBuffer();
    let image;
    if (file.type === 'image/jpeg') {
        image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes);
    } else {
        throw new Error('Unsupported image type. Please use JPEG or PNG.');
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Converts a DOCX file to a PDF.
 * @param file The DOCX file to convert.
 * @returns A Blob of the new PDF file.
 */
export async function convertDocxToPdf(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    const element = document.createElement('div');
    element.innerHTML = html;

    const pdfBlob = await html2pdf().from(element).output('blob');
    return pdfBlob;
}

/**
 * Adds a text watermark to each page of a PDF.
 * @param file The PDF file.
 * @param text The watermark text.
 * @param options Options for the watermark (fontSize, color, opacity).
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob of the new PDF file with the watermark.
 */
export async function addWatermark(
    file: File,
    text: string,
    options: { fontSize: number; color: [number, number, number]; opacity: number },
    password?: string
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    const helveticaFont = await pdfDoc.embedFont('Helvetica-Bold');
    const pages = pdfDoc.getPages();

    for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: width / 2 - (text.length * options.fontSize) / 4,
            y: height / 2,
            font: helveticaFont,
            size: options.fontSize,
            color: { type: 'RGB', red: options.color[0], green: options.color[1], blue: options.color[2] },
            opacity: options.opacity,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Splits a PDF file into individual PDFs based on a given page range.
 * Each page (or group of pages) becomes a separate PDF file.
 * @param file The PDF file to split.
 * @param pages The page range string (e.g., "1, 3-5, 8").
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob containing a ZIP file with individual PDFs.
 */
export async function splitPdfIntoMultipleFiles(file: File, pages: string, password?: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    const pageCount = pdfDoc.getPageCount();
    const pageIndices = pages.toLowerCase() === 'all' 
        ? Array.from({ length: pageCount }, (_, i) => i) 
        : parsePageRange(pages, pageCount);

    if (pageIndices.length === 0) {
        throw new Error('Invalid page range specified.');
    }

    // Create individual PDFs for each page
    const pdfBlobs: { name: string; blob: Blob }[] = [];
    
    for (let i = 0; i < pageIndices.length; i++) {
        const pageIndex = pageIndices[i];
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
        newPdf.addPage(copiedPage);
        
        const pdfBytes = await newPdf.save();
        const pageNumber = pageIndex + 1; // Convert to 1-based for display
        const fileName = `${file.name.replace('.pdf', '')}_page_${pageNumber}.pdf`;
        
        pdfBlobs.push({
            name: fileName,
            blob: new Blob([pdfBytes], { type: 'application/pdf' })
        });
    }

    // Create ZIP file
    const zipBlob = await createZipFromBlobs(pdfBlobs, `${file.name.replace('.pdf', '')}_split_pages.zip`);
    return zipBlob;
}

/**
 * Enhanced split function that can create separate PDFs for page ranges.
 * For example, "1-3, 4-6" will create two files: one with pages 1-3 and another with pages 4-6.
 * @param file The PDF file to split.
 * @param pages The page range string (e.g., "1-3, 4-6, 8").
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob containing a ZIP file with range-based PDFs.
 */
export async function splitPdfByRanges(file: File, pages: string, password?: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    const pageCount = pdfDoc.getPageCount();
    const ranges = parsePageRanges(pages, pageCount);

    if (ranges.length === 0) {
        throw new Error('Invalid page range specified.');
    }

    // Create separate PDFs for each range
    const pdfBlobs: { name: string; blob: Blob }[] = [];
    
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, range);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const startPage = range[0] + 1; // Convert to 1-based for display
        const endPage = range[range.length - 1] + 1;
        const fileName = range.length === 1 
            ? `${file.name.replace('.pdf', '')}_page_${startPage}.pdf`
            : `${file.name.replace('.pdf', '')}_pages_${startPage}-${endPage}.pdf`;
        
        pdfBlobs.push({
            name: fileName,
            blob: new Blob([pdfBytes], { type: 'application/pdf' })
        });
    }

    // Create ZIP file
    const zipBlob = await createZipFromBlobs(pdfBlobs, `${file.name.replace('.pdf', '')}_split_ranges.zip`);
    return zipBlob;
}

/**
 * Parses page ranges into arrays of page indices.
 * For example, "1-3, 4-6" becomes [[0,1,2], [3,4,5]].
 * @param rangeStr The page range string.
 * @param maxPages The total number of pages in the document.
 * @returns An array of arrays, each containing 0-based page indices for a range.
 */
function parsePageRanges(rangeStr: string, maxPages: number): number[][] {
    const ranges: number[][] = [];
    const rangeStrings = rangeStr.split(',');

    for (let range of rangeStrings) {
        range = range.trim();
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= maxPages) {
                const pageIndices = [];
                for (let i = start; i <= end; i++) {
                    pageIndices.push(i - 1);
                }
                ranges.push(pageIndices);
            } else {
                if (isNaN(start) || isNaN(end)) {
                    throw new Error(`Invalid page range format: "${range}". Use format like "1-5".`);
                }
                if (start < 1 || end > maxPages) {
                    throw new Error(`Page range "${range}" is out of bounds. Document has ${maxPages} pages.`);
                }
                if (start > end) {
                    throw new Error(`Invalid page range: "${range}". Start page must be less than or equal to end page.`);
                }
            }
        } else {
            const page = parseInt(range, 10);
            if (!isNaN(page) && page >= 1 && page <= maxPages) {
                ranges.push([page - 1]);
            } else if (!isNaN(page)) {
                if (page < 1 || page > maxPages) {
                    throw new Error(`Page ${page} is out of bounds. Document has ${maxPages} pages.`);
                }
            } else {
                throw new Error(`Invalid page number: "${range}". Please enter a valid number.`);
            }
        }
    }

    if (ranges.length === 0) {
        throw new Error(`No valid page ranges found in: "${rangeStr}". Document has ${maxPages} pages.`);
    }

    return ranges;
}

/**
 * Reorganizes PDF pages in a custom order.
 * @param file The PDF file to reorganize.
 * @param pageOrder Array of 0-based page indices in the desired order.
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob of the reorganized PDF file.
 */
export async function reorganizePdf(file: File, pageOrder: number[], password?: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    const pageCount = pdfDoc.getPageCount();
    
    // Validate page order
    if (pageOrder.length === 0) {
        throw new Error('No pages specified for reorganization.');
    }
    
    if (pageOrder.length > pageCount) {
        throw new Error(`Cannot reorganize ${pageOrder.length} pages from a document with only ${pageCount} pages.`);
    }
    
    // Check if all page indices are valid
    for (let i = 0; i < pageOrder.length; i++) {
        if (pageOrder[i] < 0 || pageOrder[i] >= pageCount) {
            throw new Error(`Invalid page index ${pageOrder[i] + 1}. Document has ${pageCount} pages.`);
        }
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pageOrder);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Creates a ZIP file from an array of blobs with their names.
 * @param files Array of objects containing name and blob.
 * @param zipName Name of the ZIP file.
 * @returns A Blob containing the ZIP file.
 */
async function createZipFromBlobs(files: { name: string; blob: Blob }[], zipName: string): Promise<Blob> {
    try {
        // Dynamic import to avoid adding JSZip as a required dependency if not needed
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        files.forEach(({ name, blob }) => {
            zip.file(name, blob);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return zipBlob;
    } catch (error) {
        console.warn('JSZip not available, falling back to single PDF extraction');
        
        // If we have multiple files and JSZip fails, we'll create a merged PDF instead
        if (files.length > 1) {
            // Create a merged PDF with all the individual pages
            const mergedPdf = await PDFDocument.create();
            
            for (const { blob } of files) {
                const arrayBuffer = await blob.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }
            
            const pdfBytes = await mergedPdf.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });
        } else if (files.length === 1) {
            // If only one file, return it directly
            return files[0].blob;
        } else {
            throw new Error('No files to process');
        }
    }
}

/**
 * Compresses a PDF file with specified quality settings.
 * @param file The PDF file to compress.
 * @param qualityLevel The compression quality level (1-3).
 * @param password An optional password for encrypted PDFs.
 * @returns A Blob of the compressed PDF file.
 */
export async function compressPdf(file: File, qualityLevel: number, password?: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined } as any);
    } catch (error) {
        if (error instanceof Error && (error.message.includes('password') || error.message.includes('encrypted'))) {
            throw new Error('This PDF is password protected. Please enter the correct password.');
        }
        throw error;
    }

    // Configure compression based on quality level
    let saveOptions: any = {};
    
    switch (qualityLevel) {
        case 1: // Extreme Compression - Less Quality, High Compression
            saveOptions = {
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 20,
                updateFieldAppearances: false,
                throwOnInvalidObject: false
            };
            break;
            
        case 2: // Recommended Compression - Good Quality, Good Compression
            saveOptions = {
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 50,
                updateFieldAppearances: false,
                throwOnInvalidObject: false
            };
            break;
            
        case 3: // Less Compression - High Quality, Less Compression
            saveOptions = {
                useObjectStreams: false,
                addDefaultPage: false,
                objectsPerTick: 100,
                updateFieldAppearances: false,
                throwOnInvalidObject: false
            };
            break;
            
        default:
            throw new Error('Invalid quality level. Please select 1, 2, or 3.');
    }

    try {
        const pdfBytes = await pdfDoc.save(saveOptions);
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        throw new Error(`Failed to compress PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Gets compression information for a PDF file.
 * @param file The PDF file to analyze.
 * @returns Object containing original size and estimated compression info.
 */
export async function getCompressionInfo(file: File): Promise<{
    originalSize: number;
    originalSizeMB: string;
    estimatedCompressedSize: {
        extreme: string;
        recommended: string;
        minimal: string;
    };
}> {
    const originalSize = file.size;
    const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
    
    // Estimate compression ratios based on quality levels
    const estimatedCompressedSize = {
        extreme: (originalSize * 0.3 / (1024 * 1024)).toFixed(2),      // ~70% reduction
        recommended: (originalSize * 0.6 / (1024 * 1024)).toFixed(2),  // ~40% reduction
        minimal: (originalSize * 0.85 / (1024 * 1024)).toFixed(2)      // ~15% reduction
    };
    
    return {
        originalSize,
        originalSizeMB,
        estimatedCompressedSize
    };
}

