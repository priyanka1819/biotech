// Database configuration
const DB_NAME = 'StaunchBiotechDB';
const DB_VERSION = 1;
const PRODUCTS_STORE = 'products';
const SYNC_KEY = 'STAUNCH_SYNC_TIMESTAMP';
const API_ENDPOINTS = {
  products: '/api/products',
  bulkImport: '/api/products/bulk',
  sharedData: '/shared-data/products.json'
};

// Auto-sync configuration
let autoSyncEnabled = true;
let syncInterval = 5 * 60 * 1000; // 5 minutes
let lastSyncTime = localStorage.getItem(SYNC_KEY) || 0;
let syncTimer = null;

// Start automatic sync
function startAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
  }
  
  // Initial sync
  if (autoSyncEnabled) {
    syncWithCloud();
    
    // Set up periodic sync
    syncTimer = setInterval(() => {
      if (autoSyncEnabled) {
        syncWithCloud();
      }
    }, syncInterval);
  }
}

// Sync data with cloud storage
async function syncWithCloud() {
  try {
    // Get local timestamp
    const localTimestamp = parseInt(localStorage.getItem(SYNC_KEY) || '0');
    
    // First, try to get data from cloud
    const cloudData = await fetchFromCloud(localTimestamp);
    
    // If there's newer data in the cloud, import it
    if (cloudData && cloudData.products && cloudData.products.length > 0) {
      await importProductsFromCloud(cloudData.products);
    }
    
    // Then, send our data to the cloud
    const localProducts = await getAllProducts();
    await sendToCloud(localProducts, Date.now());
    
    // Update last sync time
    lastSyncTime = Date.now();
    localStorage.setItem(SYNC_KEY, lastSyncTime.toString());
    
    return { success: true, message: "Sync completed successfully" };
  } catch (error) {
    console.error('Cloud sync error:', error);
    return { success: false, message: error.message };
  }
}

// Get data from server
async function fetchFromCloud(localTimestamp) {
  try {
    // First try the API endpoint
    try {
      const response = await fetch(API_ENDPOINTS.products);
      if (response.ok) {
        const products = await response.json();
        if (Array.isArray(products) && products.length > 0) {
          console.log('Found data from API endpoint');
          return { products, timestamp: Date.now() };
        }
      }
    } catch (apiError) {
      console.error('API endpoint error, trying shared data folder:', apiError);
    }
    
    // Try the shared data folder as fallback
    const response = await fetch(API_ENDPOINTS.sharedData);
    
    if (!response.ok) {
      console.log('No shared data found or unable to access shared data folder');
      return null;
    }
    
    // Parse the response data
    const cloudData = await response.json();
    
    // Check if cloud data is newer than our local data
    if (cloudData.timestamp > localTimestamp) {
      console.log('Found newer data in shared folder');
      return cloudData;
    }
    
    console.log('Local data is up-to-date');
    return null;
  } catch (error) {
    console.error('Error fetching from server:', error);
    
    // Fallback to localStorage as a temporary backup sync method
    try {
      const cloudDataStr = localStorage.getItem('CLOUD_PRODUCTS');
      if (!cloudDataStr) return null;
      
      const cloudData = JSON.parse(cloudDataStr);
      
      // Check if cloud data is newer than our local data
      if (cloudData.timestamp > localTimestamp) {
        console.log('Found newer data in localStorage backup');
        return cloudData;
      }
    } catch (e) {
      console.error('Fallback sync failed too:', e);
    }
    
    return null;
  }
}

// Send data to server
async function sendToCloud(products, timestamp) {
  try {
    // First try to use the bulk import API
    try {
      const bulkResponse = await fetch(API_ENDPOINTS.bulkImport, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(products)
      });
      
      if (bulkResponse.ok) {
        console.log('Products successfully saved to server via API');
        return true;
      }
    } catch (apiError) {
      console.error('API endpoint error, trying shared data folder:', apiError);
    }
    
    // Fallback to shared data folder
    const cloudData = {
      products: products,
      timestamp: timestamp
    };
    
    const response = await fetch(API_ENDPOINTS.sharedData, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cloudData)
    });
    
    if (response.ok) {
      console.log('Data successfully saved to shared folder');
      return true;
    }
    
    // If the server endpoint fails, fall back to localStorage as temporary backup
    console.log('Unable to save to server, using localStorage as backup');
    localStorage.setItem('CLOUD_PRODUCTS', JSON.stringify(cloudData));
    
    return true;
  } catch (error) {
    console.error('Error sending to server:', error);
    
    // Fallback to localStorage if the server endpoint fails
    try {
      const cloudData = {
        products: products,
        timestamp: timestamp
      };
      
      localStorage.setItem('CLOUD_PRODUCTS', JSON.stringify(cloudData));
      console.log('Data saved to localStorage backup');
      return true;
    } catch (e) {
      console.error('Failed to save to backup storage too:', e);
      return false;
    }
  }
}

// Import products from cloud data
async function importProductsFromCloud(cloudProducts) {
  // Get current products to avoid duplicates
  const currentProducts = await getAllProducts();
  const currentProductIds = new Set(currentProducts.map(p => p.id));
  
  // Filter out products we already have (by ID)
  const newProducts = cloudProducts.filter(p => !currentProductIds.has(p.id));
  
  // If we have new products, add them
  if (newProducts.length > 0) {
    await bulkImportProducts(newProducts);
    return newProducts;
  }
  
  return [];
}

// Export all products to a JSON file (manual backup option)
async function exportProductsToJson() {
  const products = await getAllProducts();
  const dataStr = JSON.stringify(products, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'staunch-biotech-products.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Import products from a JSON file (manual restore option)
function importProductsFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const products = JSON.parse(event.target.result);
        if (!Array.isArray(products)) {
          reject(new Error('Invalid file format: data is not an array'));
          return;
        }
        
        // Import products into database
        const importedProducts = await bulkImportProducts(
          products.map(product => {
            // Keep IDs to maintain data consistency across devices
            return product;
          })
        );
        
        // Update cloud with our latest data
        await sendToCloud(await getAllProducts(), Date.now());
        localStorage.setItem(SYNC_KEY, Date.now().toString());
        
        resolve(importedProducts);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

// Initialize the database
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // Create object stores when needed
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create products store with auto-incrementing id
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const store = db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('description', 'description', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get all products from database
async function getAllProducts() {
  try {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCTS_STORE, 'readonly');
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error fetching products:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to localStorage if IndexedDB fails
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  }
}

// Add a new product to the database
async function addProduct(product) {
  try {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.add(product);
      
      request.onsuccess = (event) => {
        // Get the generated ID
        const id = event.target.result;
        // Return the product with the generated ID
        resolve({ ...product, id });
      };
      
      request.onerror = (event) => {
        console.error('Error adding product:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to localStorage if IndexedDB fails
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const id = Date.now();
    const newProduct = { ...product, id };
    savedProducts.push(newProduct);
    localStorage.setItem('products', JSON.stringify(savedProducts));
    return newProduct;
  }
}

// Update an existing product
async function updateProduct(product) {
  try {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.put(product);
      
      request.onsuccess = () => {
        resolve(product);
      };
      
      request.onerror = (event) => {
        console.error('Error updating product:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to localStorage if IndexedDB fails
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const index = savedProducts.findIndex(p => p.id === product.id);
    if (index !== -1) {
      savedProducts[index] = product;
      localStorage.setItem('products', JSON.stringify(savedProducts));
    }
    return product;
  }
}

// Delete a product
async function deleteProduct(productId) {
  try {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.delete(productId);
      
      request.onsuccess = () => {
        resolve({ success: true });
      };
      
      request.onerror = (event) => {
        console.error('Error deleting product:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to localStorage if IndexedDB fails
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = savedProducts.filter(p => p.id !== productId);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    return { success: true };
  }
}

// Bulk import products
async function bulkImportProducts(productsToImport) {
  try {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
      const store = transaction.objectStore(PRODUCTS_STORE);
      const importedProducts = [];
      
      // Process each product one by one to get their IDs
      let completed = 0;
      productsToImport.forEach(product => {
        const request = store.add(product);
        
        request.onsuccess = (event) => {
          const id = event.target.result;
          importedProducts.push({ ...product, id });
          completed++;
          
          // If all products have been processed, resolve the promise
          if (completed === productsToImport.length) {
            resolve(importedProducts);
          }
        };
        
        request.onerror = (event) => {
          console.error('Error importing product:', event.target.error);
          completed++;
          
          // Continue with the remaining products
          if (completed === productsToImport.length) {
            resolve(importedProducts);
          }
        };
      });
      
      transaction.oncomplete = () => {
        db.close();
      };
      
      // If there are no products to import, resolve immediately
      if (productsToImport.length === 0) {
        resolve([]);
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to localStorage if IndexedDB fails
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const importedProducts = productsToImport.map(product => {
      const id = Date.now() + Math.random();
      return { ...product, id };
    });
    localStorage.setItem('products', JSON.stringify([...savedProducts, ...importedProducts]));
    return importedProducts;
  }
}