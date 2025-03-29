// PDF Parser using PDF.js
async function extractProductsFromPdf(file) {
  // Load PDF.js if not already loaded
  if (!window.pdfjsLib) {
    console.error('PDF.js library not loaded');
    throw new Error('PDF.js not loaded');
  }
  
  // Set PDF.js worker URL
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async function() {
      try {
        const typedArray = new Uint8Array(this.result);
        
        // Load the PDF document
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        const numPages = pdf.numPages;
        const extractedProducts = [];
        
        // Process each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const textItems = textContent.items;
          
          // Extract text content from the page
          let pageText = '';
          for (const item of textItems) {
            pageText += item.str + ' ';
          }
          
          // Parse the text to identify products
          // This is a simple implementation - adapt based on your PDF format
          const productBlocks = parsePageForProducts(pageText);
          
          // Add extracted products to the list
          extractedProducts.push(...productBlocks);
        }
        
        resolve(extractedProducts);
        
      } catch (error) {
        console.error('Error parsing PDF:', error);
        reject(error);
      }
    };
    
    fileReader.onerror = function() {
      reject(new Error('Failed to read the file'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
}

function parsePageForProducts(pageText) {
  // Simple implementation to extract products from text
  // This is a basic example - you should adapt it to your specific PDF format
  
  // Strategy: Look for patterns like "Product Name: <name>\nDescription: <description>"
  const products = [];
  const regex = /Product(?:\s+Name)?:?\s+([^\n]+)\s+Description:?\s+([^\n]+)/gi;
  
  let match;
  while ((match = regex.exec(pageText)) !== null) {
    const name = match[1].trim();
    const description = match[2].trim();
    
    if (name) {
      products.push({
        name: name,
        description: description || 'No description available',
        image: null // PDFs don't typically provide images directly
      });
    }
  }
  
  // If no structured data found but there's text, create a fallback product
  if (products.length === 0 && pageText.trim().length > 0) {
    // Split the text into chunks and use them as products
    const lines = pageText.split(/\n+/).filter(line => line.trim().length > 0);
    
    for (let i = 0; i < lines.length; i += 2) {
      const name = lines[i].trim();
      const description = lines[i + 1] ? lines[i + 1].trim() : 'No description available';
      
      if (name) {
        products.push({
          name: name,
          description: description,
          image: null
        });
      }
    }
  }
  
  return products;
}