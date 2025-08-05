// Main Application Logic

// Global variables
let currentFiles = {
    split: [],
    merge: [],
    edit: [],
    convert: [],
    'pdf-to-images': [],
    compress: [],
    protect: []
};

let currentPage = 'split';

// Tab switching functionality
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    // Update current page
    currentPage = tabName;
    
    // Update conversion UI if needed
    if (tabName === 'convert') {
        updateConversionUI();
    }
}

// Drag and drop handling
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.target.closest('.drop-zone');
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.target.closest('.drop-zone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

function handleDrop(event, tab) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.target.closest('.drop-zone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files, tab);
    }
}

function handleFileSelect(event, tab) {
    const files = event.target.files;
    if (files.length > 0) {
        handleFiles(files, tab);
    }
}

function handleFiles(files, tab) {
    const fileArray = Array.from(files);
    
    // Filter files based on tab requirements
    let filteredFiles = fileArray;
    
    if (tab === 'split' || tab === 'merge' || tab === 'edit' || 
        tab === 'compress' || tab === 'protect' || tab === 'pdf-to-images') {
        filteredFiles = fileArray.filter(file => file.name.toLowerCase().endsWith('.pdf'));
        if (filteredFiles.length !== fileArray.length) {
            showAlert(`${fileArray.length - filteredFiles.length} non-PDF files were ignored.`, 'warning');
        }
    }
    
    if (tab === 'edit' && filteredFiles.length > 1) {
        showAlert('Please select only one PDF file for editing.', 'warning');
        filteredFiles = [filteredFiles[0]];
    }
    
    // Add files to currentFiles
    currentFiles[tab] = [...currentFiles[tab], ...filteredFiles];
    
    // Update file list display
    updateFileList(tab);
    
    // If editing tab, load the PDF for page editing
    if (tab === 'edit' && filteredFiles.length > 0) {
        loadPDFPages(filteredFiles[0]);
    }
}

function updateFileList(tab) {
    const fileListElement = document.getElementById(`${tab}FileList`);
    
    if (!fileListElement) return;
    
    if (currentFiles[tab].length === 0) {
        fileListElement.innerHTML = '<p class="text-center">No files selected</p>';
        return;
    }
    
    let fileListHTML = '';
    
    currentFiles[tab].forEach((file, index) => {
        const fileSize = formatFileSize(file.size);
        
        fileListHTML += `
            <div class="file-item" data-index="${index}" data-tab="${tab}">
                <div class="file-info">
                    <div class="file-icon">${getFileIcon(file.name)}</div>
                    <div class="file-details">
                        <h4>${escapeHtml(file.name)}</h4>
                        <p>${fileSize}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-danger btn-small" onclick="removeFile('${tab}', ${index})">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `;
    });
    
    fileListElement.innerHTML = fileListHTML;
}

function removeFile(tab, index) {
    currentFiles[tab].splice(index, 1);
    updateFileList(tab);
    
    // If editing tab and no files left, hide page editor
    if (tab === 'edit' && currentFiles[tab].length === 0) {
        document.getElementById('pageEditor').style.display = 'none';
    }
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    switch (ext) {
        case 'pdf':
            return '📄';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return '🖼️';
        case 'docx':
            return '📝';
        case 'txt':
            return '📄';
        default:
            return '📁';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"]/g, function(m) { return map[m]; });
}

// Conversion UI update
function updateConversionUI() {
    const conversionType = document.getElementById('conversionType').value;
    
    if (conversionType === 'to-pdf') {
        document.getElementById('toPdfConverter').style.display = 'block';
        document.getElementById('pdfToImagesConverter').style.display = 'none';
        
        // Update file input accept attribute
        document.getElementById('convertFiles').accept = '.jpg,.jpeg,.png,.gif,.docx,.txt';
    } else {
        document.getElementById('toPdfConverter').style.display = 'none';
        document.getElementById('pdfToImagesConverter').style.display = 'block';
        
        // Update file input accept attribute
        document.getElementById('pdfToImageFiles').accept = '.pdf';
    }
}

// Password field toggle
function togglePasswordFields() {
    const action = document.getElementById('protectAction').value;
    const currentPasswordGroup = document.getElementById('currentPasswordGroup');
    const newPasswordGroup = document.getElementById('newPasswordGroup');
    
    if (action === 'add') {
        currentPasswordGroup.style.display = 'none';
        newPasswordGroup.style.display = 'block';
    } else {
        currentPasswordGroup.style.display = 'block';
        newPasswordGroup.style.display = 'none';
    }
}

// Progress and alert functions
function showProgress() {
    document.getElementById('progressModal').classList.add('show');
}

function hideProgress() {
    document.getElementById('progressModal').classList.remove('show');
}

function updateProgress(percentage, text) {
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent = text;
}

function showAlert(message, type = 'info') {
    const alertModal = document.getElementById('alertModal');
    const alertContent = document.getElementById('alertContent');
    
    let alertClass = 'alert-info';
    switch (type) {
        case 'success':
            alertClass = 'alert-success';
            break;
        case 'error':
            alertClass = 'alert-error';
            break;
        case 'warning':
            alertClass = 'alert-warning';
            break;
    }
    
    alertContent.innerHTML = `
        <div class="alert ${alertClass}">
            ${escapeHtml(message)}
        </div>
    `;
    
    alertModal.classList.add('show');
}

function closeAlert() {
    document.getElementById('alertModal').classList.remove('show');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Set up initial password field visibility
    togglePasswordFields();
    
    // Set up quality slider
    const qualitySlider = document.getElementById('imageQuality');
    const qualityValue = document.getElementById('qualityValue');
    
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', function() {
            qualityValue.textContent = this.value;
        });
    }
});
