// Page Editor Functions

class PDFPageEditor {
    constructor() {
        this.pages = [];
        this.selectedPages = new Set();
        this.deletedPages = new Set();
        this.rotations = {}; // page index -> rotation (0, 90, 180, 270)
        this.draggedPage = null;
    }
    
    // Load PDF and create page thumbnails
    async loadPDF(file) {
        try {
            showProgress();
            updateProgress(0, 'Loading PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            this.originalPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer); // Keep original
            
            const totalPages = this.pdfDoc.getPageCount();
            this.pages = [];
            this.selectedPages.clear();
            this.deletedPages.clear();
            this.rotations = {};
            
            // Initialize rotations to 0 for all pages
            for (let i = 0; i < totalPages; i++) {
                this.rotations[i] = 0;
            }
            
            // Create page thumbnails (in a real implementation, you'd render actual page previews)
            for (let i = 0; i < totalPages; i++) {
                updateProgress((i / totalPages) * 100, `Loading page ${i + 1} of ${totalPages}...`);
                
                // Create a placeholder thumbnail
                this.pages.push({
                    index: i,
                    number: i + 1,
                    thumbnail: this.createPlaceholderThumbnail(i + 1)
                });
            }
            
            hideProgress();
            this.renderPageGrid();
            document.getElementById('pageEditor').style.display = 'block';
            
        } catch (error) {
            hideProgress();
            showAlert(`Error loading PDF: ${error.message}`, 'error');
        }
    }
    
    // Create a placeholder thumbnail
    createPlaceholderThumbnail(pageNumber) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 150;
        canvas.height = 200;
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Light gray border
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        
        // Page number
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Page ${pageNumber}`, canvas.width/2, canvas.height/2);
        
        // Document icon
        ctx.fillStyle = '#667eea';
        ctx.font = '40px Arial';
        ctx.fillText('📄', canvas.width/2, canvas.height/2 - 40);
        
        return canvas.toDataURL();
    }
    
    // Render the page grid
    renderPageGrid() {
        const pageGrid = document.getElementById('pageGrid');
        pageGrid.innerHTML = '';
        
        this.pages.forEach(page => {
            const isDeleted = this.deletedPages.has(page.index);
            const isSelected = this.selectedPages.has(page.index);
            const rotation = this.rotations[page.index] || 0;
            
            const pageElement = document.createElement('div');
            pageElement.className = `page-thumbnail ${isSelected ? 'selected' : ''} ${isDeleted ? 'deleted' : ''}`;
            pageElement.dataset.index = page.index;
            pageElement.draggable = true;
            
            pageElement.innerHTML = `
                <img src="${page.thumbnail}" class="page-preview" style="transform: rotate(${rotation}deg);" alt="Page ${page.number}">
                <div class="page-info">
                    <div class="page-number">Page ${page.number}</div>
                    <div class="page-controls">
                        <button class="page-control-btn rotate-btn" onclick="pageEditor.rotatePage(${page.index})" title="Rotate page">
                            ↻
                        </button>
                        <button class="page-control-btn delete-btn" onclick="pageEditor.togglePageSelection(${page.index})" title="Select/Delete page">
                            ${isSelected ? '✓' : '✗'}
                        </button>
                    </div>
                </div>
            `;
            
            pageElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('page-control-btn')) {
                    this.togglePageSelection(page.index);
                }
            });
            
            // Add drag and drop event listeners
            pageElement.addEventListener('dragstart', (e) => this.handleDragStart(e, page.index));
            pageElement.addEventListener('dragover', (e) => this.handleDragOver(e));
            pageElement.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            pageElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            pageElement.addEventListener('drop', (e) => this.handleDrop(e, page.index));
            pageElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            pageGrid.appendChild(pageElement);
        });
    }
    
    // Toggle page selection
    togglePageSelection(pageIndex) {
        if (this.selectedPages.has(pageIndex)) {
            this.selectedPages.delete(pageIndex);
        } else {
            this.selectedPages.add(pageIndex);
        }
        
        this.renderPageGrid();
    }
    
    // Select all pages
    selectAllPages() {
        for (let i = 0; i < this.pages.length; i++) {
            if (!this.deletedPages.has(i)) {
                this.selectedPages.add(i);
            }
        }
        this.renderPageGrid();
    }
    
    // Deselect all pages
    deselectAllPages() {
        this.selectedPages.clear();
        this.renderPageGrid();
    }
    
    // Rotate a page
    rotatePage(pageIndex) {
        const currentRotation = this.rotations[pageIndex] || 0;
        this.rotations[pageIndex] = (currentRotation + 90) % 360;
        this.renderPageGrid();
    }
    
    // Delete selected pages
    deleteSelectedPages() {
        if (this.selectedPages.size === 0) {
            showAlert('Please select pages to delete.', 'warning');
            return;
        }
        
        this.selectedPages.forEach(pageIndex => {
            this.deletedPages.add(pageIndex);
        });
        
        this.selectedPages.clear();
        this.renderPageGrid();
        
        showAlert(`${this.deletedPages.size} page(s) marked for deletion. Save to apply changes.`, 'info');
    }
    
    // Save edited PDF
    async saveEditedPDF() {
        if (!this.pdfDoc) {
            showAlert('No PDF loaded.', 'error');
            return;
        }
        
        showProgress();
        
        try {
            // Create a new PDF with only the pages we want to keep
            const newPdfDoc = await PDFLib.PDFDocument.create();
            
            const totalPages = this.originalPdfDoc.getPageCount();
            const pagesToKeep = [];
            
            // Determine which pages to keep (not deleted)
            for (let i = 0; i < totalPages; i++) {
                if (!this.deletedPages.has(i)) {
                    pagesToKeep.push(i);
                }
            }
            
            if (pagesToKeep.length === 0) {
                hideProgress();
                showAlert('All pages have been deleted. Cannot save an empty PDF.', 'error');
                return;
            }
            
            updateProgress(20, 'Copying pages...');
            
            // Copy pages to new document
            const copiedPages = await newPdfDoc.copyPages(this.originalPdfDoc, pagesToKeep);
            copiedPages.forEach(page => {
                newPdfDoc.addPage(page);
            });
            
            updateProgress(60, 'Applying rotations...');
            
            // Apply rotations (simplified - in a real implementation you'd need to rotate the actual content)
            const pages = newPdfDoc.getPages();
            for (let i = 0; i < pagesToKeep.length; i++) {
                const originalIndex = pagesToKeep[i];
                const rotation = this.rotations[originalIndex];
                
                if (rotation !== 0) {
                    // Note: In a real implementation, you would apply actual rotation
                    // This is a simplified version for demonstration
                    console.log(`Would rotate page ${i} by ${rotation} degrees`);
                }
            }
            
            updateProgress(80, 'Saving PDF...');
            
            // Save the new PDF
            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Get the original filename
            const originalFile = currentFiles.edit[0];
            const filename = originalFile.name.replace('.pdf', `_edited_${generateTimestamp()}.pdf`);
            
            downloadFile(blob, filename);
            
            updateProgress(100, 'Complete!');
            setTimeout(hideProgress, 1000);
            
            showAlert('Edited PDF saved successfully!', 'success');
            
        } catch (error) {
            hideProgress();
            showAlert(`Error saving edited PDF: ${error.message}`, 'error');
        }
    }
    
    // Handle drag start
    handleDragStart(event, pageIndex) {
        this.draggedPage = pageIndex;
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
    }
    
    // Handle drag over
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    // Handle drag enter
    handleDragEnter(event) {
        event.target.closest('.page-thumbnail').classList.add('drag-over');
    }
    
    // Handle drag leave
    handleDragLeave(event) {
        event.target.closest('.page-thumbnail').classList.remove('drag-over');
    }
    
    // Handle drop
    handleDrop(event, targetPageIndex) {
        event.preventDefault();
        event.stopPropagation();
        
        const targetElement = event.target.closest('.page-thumbnail');
        targetElement.classList.remove('drag-over');
        
        if (this.draggedPage !== null && this.draggedPage !== targetPageIndex) {
            this.reorderPages(this.draggedPage, targetPageIndex);
        }
        
        return false;
    }
    
    // Handle drag end
    handleDragEnd(event) {
        event.target.classList.remove('dragging');
        this.draggedPage = null;
        
        // Remove drag-over class from all elements
        document.querySelectorAll('.page-thumbnail').forEach(el => {
            el.classList.remove('drag-over');
        });
    }
    
    // Reorder pages
    reorderPages(fromIndex, toIndex) {
        // Create a new array with reordered pages
        const newPages = [...this.pages];
        
        // Remove the dragged page
        const [movedPage] = newPages.splice(fromIndex, 1);
        
        // Insert at the new position
        newPages.splice(toIndex, 0, movedPage);
        
        // Update the pages array
        this.pages = newPages;
        
        // Update rotations mapping to match new indices
        const newRotations = {};
        newPages.forEach((page, newIndex) => {
            const oldIndex = page.index;
            newRotations[newIndex] = this.rotations[oldIndex];
            page.index = newIndex;
            page.number = newIndex + 1;
        });
        this.rotations = newRotations;
        
        // Re-render the page grid
        this.renderPageGrid();
        
        showAlert(`Page ${fromIndex + 1} moved to position ${toIndex + 1}`, 'success');
    }
}

// Initialize the page editor
const pageEditor = new PDFPageEditor();

// Global functions for UI interaction
function loadPDFPages(file) {
    pageEditor.loadPDF(file);
}

function selectAllPages() {
    pageEditor.selectAllPages();
}

function deselectAllPages() {
    pageEditor.deselectAllPages();
}

function deleteSelectedPages() {
    pageEditor.deleteSelectedPages();
}

function saveEditedPDF() {
    pageEditor.saveEditedPDF();
}
