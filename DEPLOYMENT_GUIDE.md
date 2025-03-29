# Lightweight Staunch Biotech Deployment Guide

This guide provides instructions for deploying the lightweight version of Staunch Biotech Product Catalog to various platforms.

## Size and Compatibility

- Total package size: **Under 3MB**
- Compatible with all free hosting tiers (Vercel, Netlify, GitHub Pages)
- No build step required (pure HTML/CSS/JavaScript)
- Works with any static web server

## Deployment Options

### Option 1: Deploy to Vercel (Recommended)

#### Direct Upload with Vercel CLI
1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to the lightweight-version folder: `cd lightweight-version`
3. Run: `vercel`
4. Follow the prompts to complete deployment

#### Deploy from GitHub
1. Push the lightweight-version folder to a GitHub repository
2. Log into [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Set the root directory to `/lightweight-version`
6. Deploy with default settings

### Option 2: Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Upload the contents of the lightweight-version folder
3. Go to repository Settings > Pages
4. Select your main branch as the source
5. Your site will be published at `https://[username].github.io/[repository]`

### Option 3: Deploy to Netlify

#### Drag and Drop Deployment
1. Go to [Netlify](https://app.netlify.com/)
2. Drag and drop the entire lightweight-version folder onto the Netlify dashboard
3. Your site will be live in seconds with a Netlify subdomain

#### Deploy from GitHub
1. Push the lightweight-version folder to GitHub
2. Log into Netlify and click "New site from Git"
3. Connect your GitHub repository
4. Set the build command to blank and publish directory to `/` if using the repository root, or specify the path to lightweight-version
5. Click "Deploy site"

### Option 4: Any Static Web Host

Since this is a pure HTML/CSS/JavaScript application, you can deploy it to:
- InfinityFree
- 000webhost
- Amazon S3
- Google Cloud Storage
- Microsoft Azure Blob Storage
- Or any web server that can serve static files

Simply upload the contents of the lightweight-version folder to your web host's public directory.

## Testing Your Deployment

After deploying, verify that:

1. The application loads correctly
2. You can add and view products
3. Product data persists when you reload the page (LocalStorage is working)
4. The PDF and Excel import functions work
5. The application is responsive on different device sizes

## Troubleshooting

- **Application can't save data**: Make sure your browser allows LocalStorage for the domain
- **PDF/Excel imports not working**: Check if the CDN libraries are loading correctly
- **Images not displaying**: Verify that your browser supports data URLs

## Need Help?

If you encounter any issues with deployment, please reach out to support for assistance.

---

Good luck with your deployment! The lightweight Staunch Biotech Product Catalog is designed to be extremely portable and compatible with virtually any web hosting solution.