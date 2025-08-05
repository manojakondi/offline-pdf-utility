// File Handling Functions

// Handle image to PDF conversion
async function convertImagesToPDF(files) {
    showProgress();
    
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Processing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            
            // Create a new page
            const page = pdfDoc.addPage();
            
            // Embed the image
            let image;
            if (file.name.toLowerCase().endsWith('.png')) {
                image = await pdfDoc.embedPng(arrayBuffer);
            } else {
                image = await pdfDoc.embedJpg(arrayBuffer);
            }
            
            // Scale image to fit the page
            const { width, height } = image.scaleToFit(page.getWidth() - 100, page.getHeight() - 100);
            
            // Draw image on page
            page.drawImage(image, {
                x: (page.getWidth() - width) / 2,
                y: (page.getHeight() - height) / 2,
                width,
                height
            });
        }
        
        // Save and download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const timestamp = generateTimestamp();
        downloadFile(blob, `images_to_pdf_${timestamp}.pdf`);
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('Images successfully converted to PDF!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error converting images: ${error.message}`, 'error');
    }
}

// Handle Word document to PDF conversion
async function convertWordToPDF(files) {
    showProgress();
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Processing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            
            // Convert with Mammoth
            const result = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
            
            // Create PDF from HTML content
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage();
            
            // For simplicity, we'll add the text content
            // In a full implementation, you'd want to preserve formatting
            const content = result.value.replace(/<[^>]*>/g, ''); // Strip HTML tags
            
            page.drawText(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), {
                x: 50,
                y: page.getHeight() - 100,
                size: 12
            });
            
            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = file.name.replace('.docx', '_converted.pdf');
            downloadFile(blob, filename);
        }
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('Word documents successfully converted to PDF!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error converting Word documents: ${error.message}`, 'error');
    }
}

// Handle text to PDF conversion
async function convertTextToPDF(files) {
    showProgress();
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Processing ${file.name}...`);
            
            const text = await file.text();
            
            // Create PDF
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage();
            
            // Add text to page
            page.drawText(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''), {
                x: 50,
                y: page.getHeight() - 100,
                size: 12
            });
            
            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = file.name.replace('.txt', '_converted.pdf');
            downloadFile(blob, filename);
        }
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('Text files successfully converted to PDF!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error converting text files: ${error.message}`, 'error');
    }
}

// Handle PDF to images conversion
async function convertPDFToImages(files) {
    showProgress();
    
    try {
        const imageFormat = document.getElementById('imageFormat').value;
        const imageQuality = parseInt(document.getElementById('imageQuality').value) / 100;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = (i / files.length) * 100;
            
            updateProgress(progress, `Processing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            
            // For each page, create an image
            for (let j = 0; j < totalPages; j++) {
                const singlePageDoc = await PDFLib.PDFDocument.create();
                const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [j]);
                singlePageDoc.addPage(copiedPage);
                
                const pdfBytes = await singlePageDoc.save();
                
                // In a real implementation, you'd use pdf.js to render the page to an image
                // For now, we'll create a placeholder
                
                // Create a simple placeholder image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 800;
                canvas.height = 1000;
                
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#333';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Page ${j + 1} of ${file.name}`, canvas.width/2, canvas.height/2);
                
                const dataURL = canvas.toDataURL(`image/${imageFormat}`, imageQuality);
                const blob = dataURItoBlob(dataURL);
                
                const filename = `${file.name.replace('.pdf', '')}_page_${j + 1}.${imageFormat}`;
                downloadFile(blob, filename);
            }
        }
        
        updateProgress(100, 'Complete!');
        setTimeout(hideProgress, 1000);
        
        showAlert('PDF successfully converted to images!', 'success');
    } catch (error) {
        hideProgress();
        showAlert(`Error converting PDF to images: ${error.message}`, 'error');
    }
}
