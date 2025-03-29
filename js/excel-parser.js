// Excel Parser using SheetJS
async function processExcelFile(file) {
  // Load SheetJS if not already loaded
  if (!window.XLSX) {
    console.error('SheetJS library not loaded');
    throw new Error('SheetJS not loaded');
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract products from the data
        const products = extractProductsFromExcel(json);
        
        resolve(products);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function extractProductsFromExcel(data) {
  // This function extracts product data from Excel sheets
  // Strategy: Look for column headers and use them to map data
  
  const products = [];
  
  if (!data || data.length < 2) {
    return products; // Not enough data
  }
  
  // First row is assumed to be headers
  const headers = data[0].map(header => {
    if (typeof header === 'string') {
      return header.toLowerCase().trim();
    }
    return '';
  });
  
  // Find column indices
  const nameIndex = headers.findIndex(h => 
    h.includes('product') || h.includes('name') || h.includes('title')
  );
  
  const descriptionIndex = headers.findIndex(h => 
    h.includes('description') || h.includes('desc') || h.includes('details')
  );
  
  const imageIndex = headers.findIndex(h => 
    h.includes('image') || h.includes('img') || h.includes('picture') || h.includes('url')
  );
  
  // If we can't find the name column, try a simpler approach
  if (nameIndex === -1) {
    // Fallback: assume first column is name, second is description
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length > 0 && row[0]) {
        products.push({
          name: String(row[0] || '').trim(),
          description: row.length > 1 ? String(row[1] || '').trim() : 'No description available',
          image: null
        });
      }
    }
    return products;
  }
  
  // Process data rows using identified columns
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || (nameIndex >= 0 && !row[nameIndex])) {
      continue;
    }
    
    const product = {
      name: nameIndex >= 0 && row[nameIndex] ? String(row[nameIndex]).trim() : `Product ${i}`,
      description: descriptionIndex >= 0 && row[descriptionIndex] ? 
        String(row[descriptionIndex]).trim() : 'No description available',
      image: imageIndex >= 0 && row[imageIndex] ? String(row[imageIndex]).trim() : null
    };
    
    products.push(product);
  }
  
  return products;
}