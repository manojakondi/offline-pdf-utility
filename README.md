# PDF Toolkit

An **AI-coded**, completely offline PDF toolkit offering comprehensive PDF operations including splitting, merging, converting, editing, compressing, and password protection—all in your browser with full privacy.

## Setup

No complex setup required! Choose any of these simple methods to get started:

### Quick Start (Recommended)
1. Download the latest release or clone the repository
2. Open `index.html` directly in your browser

### Local Server Method (For Development)
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/offline-pdf-utility.git`
3. Navigate to the project directory
4. Start a local server:
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server`
5. Open `http://localhost:8000` in your browser

### Project Structure
The application follows a modular architecture for better organization:
- `index.html` - Main application file
- `assets/css/` - Dedicated CSS files for styling
- `assets/js/` - JavaScript modules for functionality
- `assets/images/` - Image assets and icons
- `README.md` - This documentation file

## Technologies

- HTML5
- CSS3 (Modular structure with dedicated component styles)
- JavaScript (ES6+ with modular architecture)
- PDF-Lib.js (PDF manipulation)
- Mammoth.js (Word document processing)
- PDF.js (PDF rendering)
- Claude Sonnet 4 (LLM for AI-assisted development)

## Features

- **Completely Offline** – Full privacy ensured with zero server-side processing
- **Split PDF** – Extract specific pages or page ranges with precise control
- **Merge PDFs** – Combine multiple PDFs into one seamless document
- **Edit Pages** – Rotate, reorder (full drag-and-drop), and delete specific pages
- **Convert Files** – Images to PDF, PDF to images, Word docs to PDF, text files to PDF
- **Compress PDF** – Reduce file size while maintaining quality
- **Password Tools** – Add or remove password protection with AES-256 encryption
- **Modern UI** – Clean, responsive design with intuitive drag-and-drop functionality and elegant theme
- **Enhanced User Experience** – Smooth animations, visual feedback, and consistent interface design

## App Interface

![PDF Toolkit Interface](assets/images/screenshot.png)

*Updated interface with enhanced drag-and-drop page reordering, improved tab visibility, and elegant color scheme*

## Limitations

- Large PDF files may require significant processing time and memory
- Browser compatibility limited to modern browsers supporting HTML5 and ES6+
- File size limitations based on browser memory constraints
- No cloud storage integration (by design for privacy)
- Advanced PDF features (annotations, forms) not yet supported

## Contribution Guidelines

We welcome contributions! Here's how you can help:

1. **Report Issues** - Found a bug or have a feature idea? Open an issue with a clear description.
2. **Code Contributions** - Fork the repo, make your changes, and submit a pull request.
3. **Feature Requests** - Suggest new features, especially those you've seen in popular online PDF tools or some new ones which those tools don't support.

Before submitting a PR, please:
- Create an issue to discuss significant changes
- Ensure your code follows the existing style
- Test your changes thoroughly

## Contact

Reach out via [GitHub Issues](../../issues) or on X ([@code_chaios](https://x.com/code_chaios)).
