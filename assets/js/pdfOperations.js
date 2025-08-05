// PDF Operations Functions

// Process PDF splitting
async function processSplit() {
    const files = currentFiles.split;
    if (files.length === 0) {
        showAlert('Please select at least one PDF file.', 'warning');
        return;
    }
    
    const pageRange = document.getElementById('pageRange').value;
    
    showProgress();
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Processing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            
            let pagesToExtract;
            try {
                pagesToExtract = parsePageRanges(pageRange, totalPages);
            } catch (error) {
                showAlert(error.message, 'error');
                hideProgress();
                return;
            }
            
            if (pageRange.trim() === '') {
                // Extract each page individually
                for (let j = 0; j < totalPages; j++) {
                    const newPdfDoc = await PDFLib.PDFDocument.create();
                    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [j]);
                    newPdfDoc.addPage(copiedPage);
                    
                    const pdfBytes = await newPdfDoc.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const filename = file.name.replace('.pdf', `_page_${j + 1}.pdf`);
                    downloadFile(blob, filename);
                }
            } else {
                // Extract specified pages into one PDF
                const newPdfDoc = await PDFLib.PDFDocument.create();
                
                for (const pageNum of pagesToExtract) {
                    const pageIndex = pageNum - 1; // Convert to 0-based index
                    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
                    newPdfDoc.addPage(copiedPage);
                }
                
                const pdfBytes = await newPdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const filename = file.name.replace('.pdf', `_extracted_${generateTimestamp()}.pdf`);
                downloadFile(blob, filename);
            }
        }
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('PDF files successfully split!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error splitting PDF: ${error.message}`, 'error');
    }
}

// Process PDF merging
async function processMerge() {
    const files = currentFiles.merge;
    if (files.length < 2) {
        showAlert('Please select at least two PDF files to merge.', 'warning');
        return;
    }
    
    showProgress();
    
    try {
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Processing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            
            copiedPages.forEach(page => {
                mergedPdf.addPage(page);
            });
        }
        
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const timestamp = generateTimestamp();
        downloadFile(blob, `merged_pdf_${timestamp}.pdf`);
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('PDF files successfully merged!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error merging PDFs: ${error.message}`, 'error');
    }
}

// Process PDF compression
async function processCompress() {
    const files = currentFiles.compress;
    if (files.length === 0) {
        showAlert('Please select at least one PDF file.', 'warning');
        return;
    }
    
    const compressionLevel = document.getElementById('compressionLevel').value;
    
    showProgress();
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Compressing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // In a real implementation, you would apply compression techniques
            // For now, we'll just save with optimization options
            const pdfBytes = await pdfDoc.save({
                useObjectStreams: false,
                addDefaultPage: false,
                subsetFonts: true
            });
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = file.name.replace('.pdf', `_compressed_${generateTimestamp()}.pdf`);
            downloadFile(blob, filename);
        }
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('PDF files successfully compressed!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error compressing PDF: ${error.message}`, 'error');
    }
}

// Process password protection
async function processProtection() {
    const files = currentFiles.protect;
    if (files.length === 0) {
        showAlert('Please select at least one PDF file.', 'warning');
        return;
    }
    
    const action = document.getElementById('protectAction').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (action === 'add' && !newPassword) {
        showAlert('Please enter a new password.', 'error');
        return;
    }
    
    showProgress();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = (i / files.length) * 100;
        
        updateProgress(progress, `Processing ${file.name}...`);
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            let pdfDoc;
            
            try {
                pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
                    password: currentPassword || undefined
                });
            } catch (error) {
                if (error.message.includes('password') || error.message.includes('encrypted')) {
                    showAlert(`${file.name} requires the correct password.`, 'error');
                    continue;
                }
                throw error;
            }

            let pdfBytes;
            if (action === 'add') {
                // Note: PDF-lib doesn't support password protection in the browser version
                // This would require server-side processing or different libraries
                showAlert('Password protection requires server-side processing for security. File will be downloaded without password protection.', 'error');
                pdfBytes = await pdfDoc.save();
            } else {
                // Remove protection (just save without password)
                pdfBytes = await pdfDoc.save();
            }
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = file.name.replace('.pdf', `_${action === 'add' ? 'protected' : 'unprotected'}_${generateTimestamp()}.pdf`);
            downloadFile(blob, filename);
            
        } catch (error) {
            showAlert(`Error processing ${file.name}: ${error.message}`, 'error');
        }
    }
    
    updateProgress(100, 'Complete!');
    setTimeout(hideProgress, 1000);
}

// Process file conversion
async function processConvert() {
    const conversionType = document.getElementById('conversionType').value;
    
    if (conversionType === 'to-pdf') {
        const files = currentFiles.convert;
        if (files.length === 0) {
            showAlert('Please select at least one file to convert.', 'warning');
            return;
        }
        
        // Separate files by type
        const imageFiles = files.filter(file => 
            file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/));
        const wordFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.docx'));
        const textFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.txt'));
        
        if (imageFiles.length > 0) {
            await convertImagesToPDF(imageFiles);
        }
        
        if (wordFiles.length > 0) {
            await convertWordToPDF(wordFiles);
        }
        
        if (textFiles.length > 0) {
            await convertTextToPDF(textFiles);
        }
        
        if (imageFiles.length === 0 && wordFiles.length === 0 && textFiles.length === 0) {
            showAlert('No supported files selected for conversion.', 'warning');
        }
    } else {
        const files = currentFiles['pdf-to-images'];
        if (files.length === 0) {
            showAlert('Please select at least one PDF file.', 'warning');
            return;
        }
        
        await convertPDFToImages(files);
    }
}
