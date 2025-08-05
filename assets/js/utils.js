// Utility Functions

// Download a file
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Parse page ranges (e.g., "1-3, 5, 7-10")
function parsePageRanges(rangeString, totalPages) {
    if (!rangeString || rangeString.trim() === '') {
        // Return all pages if no range specified
        return Array.from({length: totalPages}, (_, i) => i + 1);
    }
    
    const ranges = rangeString.split(',').map(r => r.trim());
    const pages = new Set();
    
    for (const range of ranges) {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                throw new Error(`Invalid page range: ${range}`);
            }
            for (let i = start; i <= end; i++) {
                pages.add(i);
            }
        } else {
            const page = Number(range);
            if (isNaN(page) || page < 1 || page > totalPages) {
                throw new Error(`Invalid page number: ${page}`);
            }
            pages.add(page);
        }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
}

// Convert data URI to Blob
function dataURItoBlob(dataURI) {
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = unescape(dataURI.split(',')[1]);
    }
    
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ia = new Uint8Array(byteString.length);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ia], {type: mimeString});
}

// Convert image to data URL
function canvasToDataURL(canvas, format = 'image/png', quality = 0.9) {
    return canvas.toDataURL(format, quality);
}

// Get file extension
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Generate timestamp
function generateTimestamp() {
    const now = new Date();
    return now.getFullYear() + 
           String(now.getMonth() + 1).padStart(2, '0') + 
           String(now.getDate()).padStart(2, '0') + '_' +
           String(now.getHours()).padStart(2, '0') + 
           String(now.getMinutes()).padStart(2, '0') + 
           String(now.getSeconds()).padStart(2, '0');
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate random ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Smooth scroll to element
function smoothScrollTo(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate URL
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}
