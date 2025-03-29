# Staunch Biotech - Lightweight Product Catalog

A lightweight (<3MB) version of the Staunch Biotech Product Catalog application designed for efficient product discovery and management. This version is built with vanilla HTML, CSS, and JavaScript for easy deployment on free hosting platforms like Vercel.

## Features

- **Offline Functionality**: All data is stored in your browser's localStorage
- **Responsive Design**: Works on all devices (mobile, tablet, desktop)
- **Product Management**: Add, edit, and delete products with ease
- **Search Capability**: Quickly find products by name or description
- **Import from PDF/Excel**: Bulk import products from PDF or Excel files
- **Image Handling**: View, zoom, and download product images

## Deployment Instructions

### Deploy to Vercel

1. Push this code to a GitHub repository
2. Log in to Vercel and import the repository
3. Deploy with default settings (no build commands needed)

### Deploy to GitHub Pages

1. Push this code to a GitHub repository
2. Go to repository settings > Pages
3. Set source to main branch and folder to `/` (root)
4. Save and wait for deployment

## File Structure

```
lightweight-version/
├── css/
│   └── style.css          # All application styles
├── js/
│   ├── app.js             # Main application logic
│   ├── pdf-parser.js      # PDF import functionality
│   └── excel-parser.js    # Excel import functionality
├── index.html             # Main HTML structure
└── README.md              # This documentation
```

## Usage

1. **Browse Products**: View all products in a responsive grid layout
2. **Search**: Filter products by typing in the search box
3. **Add Products**: Click the "Add Product" tab to create new products
4. **Import**: Use the "Import" tab to bulk import from PDF or Excel files
5. **Edit/Delete**: Use icons on each product card to modify or remove products
6. **View Images**: Click on product images to open them in a modal with zoom controls

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses localStorage for offline data persistence
- Total size under 3MB for fast loading and easy hosting
- External dependencies loaded via CDN:
  - Font Awesome (for icons)
  - PDF.js (for PDF parsing)
  - SheetJS (for Excel parsing)

## License

Copyright © 2023 Staunch Biotech. All rights reserved.