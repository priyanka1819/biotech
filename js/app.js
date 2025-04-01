// Main application logic
document.addEventListener('DOMContentLoaded', function() {
  // Initialize app state
  let products = [];
  let searchTerm = '';
  let currentProductId = 1;
  let currentZoom = 1;
  let importPreviewData = [];
  
  // DOM elements
  const productsGrid = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-input');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-pane');
  const addProductForm = document.getElementById('add-product-form');
  const productImageInput = document.getElementById('product-image');
  const imagePreview = document.getElementById('image-preview');
  const imageModal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const closeModal = document.querySelector('.close-modal');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const downloadImgBtn = document.getElementById('download-img');
  const editModal = document.getElementById('edit-modal');
  const editProductForm = document.getElementById('edit-product-form');
  const closeEditModal = document.querySelector('.close-edit-modal');
  const cancelEditBtn = document.getElementById('cancel-edit');
  const changeImageBtn = document.getElementById('change-image-btn');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const editProductImage = document.getElementById('edit-product-image');
  const editImagePreview = document.getElementById('edit-image-preview');
  const pdfFileInput = document.getElementById('pdf-file');
  const pdfFileName = document.getElementById('pdf-file-name');
  const importPdfBtn = document.getElementById('import-pdf-btn');
  const excelFileInput = document.getElementById('excel-file');
  const excelFileName = document.getElementById('excel-file-name');
  const importExcelBtn = document.getElementById('import-excel-btn');
  const importPreview = document.getElementById('import-preview');
  const previewCount = document.getElementById('preview-count');
  const previewList = document.getElementById('preview-list');
  const confirmImportBtn = document.getElementById('confirm-import');
  const cancelImportBtn = document.getElementById('cancel-import');
  const exportDataBtn = document.getElementById('export-data-btn');
  const importDataFile = document.getElementById('import-data-file');
  const syncNowBtn = document.getElementById('sync-now-btn');

  // API base URL
  const API_URL = '/api';

  // Initialize app
  initApp();

  // Event listeners
  searchInput.addEventListener('input', handleSearch);
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  
  addProductForm.addEventListener('submit', handleAddProduct);
  productImageInput.addEventListener('change', handleImagePreview);
  
  closeModal.addEventListener('click', closeImageModal);
  zoomInBtn.addEventListener('click', () => zoomImage(0.1));
  zoomOutBtn.addEventListener('click', () => zoomImage(-0.1));
  downloadImgBtn.addEventListener('click', downloadImage);
  
  editProductForm.addEventListener('submit', handleEditProduct);
  closeEditModal.addEventListener('click', closeEditProductModal);
  cancelEditBtn.addEventListener('click', closeEditProductModal);
  changeImageBtn.addEventListener('click', () => editProductImage.click());
  removeImageBtn.addEventListener('click', removeProductImage);
  editProductImage.addEventListener('change', handleEditImagePreview);
  
  pdfFileInput.addEventListener('change', handlePdfFileSelect);
  importPdfBtn.addEventListener('click', handlePdfImport);
  excelFileInput.addEventListener('change', handleExcelFileSelect);
  importExcelBtn.addEventListener('click', handleExcelImport);
  confirmImportBtn.addEventListener('click', confirmImport);
  cancelImportBtn.addEventListener('click', cancelImport);
  
  // Data export/import event listeners
  exportDataBtn.addEventListener('click', handleExportData);
  importDataFile.addEventListener('change', handleImportData);
  syncNowBtn.addEventListener('click', handleManualSync);

  // API functions
  async function fetchProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to localStorage if the server is not available
      const savedProducts = localStorage.getItem('products');
      return savedProducts ? JSON.parse(savedProducts) : [];
    }
  }

  async function createProduct(product) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      // Return the product with a generated ID for fallback
      return { ...product, id: Date.now() };
    }
  }

  async function updateProduct(product) {
    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      // Return the product unchanged for fallback
      return product;
    }
  }

  async function deleteProductFromServer(productId) {
    try {
      await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE'
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false };
    }
  }

  async function bulkImportProducts(newProducts) {
    try {
      const response = await fetch(`${API_URL}/products/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProducts)
      });
      return await response.json();
    } catch (error) {
      console.error('Error bulk importing products:', error);
      // Generate IDs for all products
      return newProducts.map(product => ({ ...product, id: Date.now() + Math.random() }));
    }
  }

  // Functions
  async function initApp() {
    // Show loading state
    productsGrid.innerHTML = '<div class="loading">Loading products...</div>';
    
    try {
      // First, start auto-sync to get the latest data from cloud storage
      startAutoSync();
      
      // Try to load products from API server first
      products = await fetchProducts();
    } catch (error) {
      console.error('Error fetching from server:', error);
      // If API server fails, try to load from IndexedDB
      try {
        products = await getAllProducts();
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
        products = [];
      }
    }
    
    // Find the highest product ID to set currentProductId
    if (products.length > 0) {
      const highestId = Math.max(...products.map(p => parseInt(p.id)));
      currentProductId = highestId + 1;
    }
    
    renderProducts();
    
    // Also show sync status to user
    const syncStatus = document.createElement('div');
    syncStatus.className = 'sync-status';
    syncStatus.innerHTML = `
      <span>Auto-sync: <span class="sync-indicator active"></span></span>
      <span>Last sync: ${new Date(parseInt(localStorage.getItem(SYNC_KEY) || Date.now())).toLocaleTimeString()}</span>
    `;
    document.querySelector('.data-actions').appendChild(syncStatus);
    
    // Update sync status indicator periodically
    setInterval(() => {
      const indicator = document.querySelector('.sync-indicator');
      if (indicator) {
        const lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0');
        const timeSinceSync = Date.now() - lastSync;
        
        // Update indicator color based on time since last sync
        if (timeSinceSync < 5 * 60 * 1000) { // Less than 5 minutes
          indicator.className = 'sync-indicator active';
        } else if (timeSinceSync < 30 * 60 * 1000) { // Less than 30 minutes
          indicator.className = 'sync-indicator warning';
        } else { // More than 30 minutes
          indicator.className = 'sync-indicator inactive';
        }
        
        // Update last sync time
        const lastSyncSpan = document.querySelector('.sync-status span:last-child');
        if (lastSyncSpan) {
          lastSyncSpan.textContent = `Last sync: ${new Date(lastSync).toLocaleTimeString()}`;
        }
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Update saveProducts to use IndexedDB
  async function saveProducts() {
    try {
      // For each product, add or update in the database
      for (const product of products) {
        await updateProduct(product);
      }
    } catch (error) {
      console.error('Error saving products to IndexedDB:', error);
      // Fallback to localStorage
      localStorage.setItem('products', JSON.stringify(products));
    }
  }
  
  function renderProducts() {
    // Sort products by ID timestamp (newest first)
    const sortedProducts = [...products].sort((a, b) => {
      // If the ID is a timestamp or contains a timestamp, use that for sorting
      const idA = a.id.toString();
      const idB = b.id.toString();
      
      // Try to extract timestamp parts if IDs contain them
      const timestampA = idA.match(/\d{13,}/) ? parseInt(idA.match(/\d{13,}/)[0]) : 0;
      const timestampB = idB.match(/\d{13,}/) ? parseInt(idB.match(/\d{13,}/)[0]) : 0;
      
      // If both have timestamp parts, sort by them, otherwise sort by ID string
      if (timestampA && timestampB) {
        return timestampB - timestampA; // Newest first
      } else {
        // Simple ID comparison as fallback (may not be chronological)
        return idB.localeCompare(idA);
      }
    });
    
    // Filter sorted products based on search term
    const filteredProducts = sortedProducts.filter(product => {
      return product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             product.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Clear the grid
    productsGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
      productsGrid.innerHTML = `
        <div class="no-products">
          <p>No products found. Add some products to get started!</p>
        </div>
      `;
      return;
    }
    
    // Render each product
    filteredProducts.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.innerHTML = `
        <div class="product-image" data-id="${product.id}">
          ${product.image ? 
            `<img src="${product.image}" alt="${product.name}">` : 
            `<div class="no-image"><i class="fas fa-image"></i></div>`
          }
        </div>
        <div class="product-details">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
        </div>
        <div class="product-actions">
          <button class="product-action-btn edit" data-id="${product.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="product-action-btn delete" data-id="${product.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      
      productsGrid.appendChild(productCard);
      
      // Add event listeners to the new elements
      const productImage = productCard.querySelector('.product-image');
      if (product.image) {
        productImage.addEventListener('click', () => openImageModal(product.image, product.name));
      }
      
      const editBtn = productCard.querySelector('.edit');
      editBtn.addEventListener('click', () => openEditProductModal(product.id));
      
      const deleteBtn = productCard.querySelector('.delete');
      deleteBtn.addEventListener('click', () => deleteProduct(product.id));
    });
  }
  
  function handleSearch(e) {
    searchTerm = e.target.value;
    renderProducts();
  }
  
  function switchTab(tabId) {
    // Update active tab button
    tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabId);
    });
    
    // Update active tab content
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }
  
  async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const imagePreviewEl = imagePreview.querySelector('img');
    const image = imagePreviewEl ? imagePreviewEl.src : null;
    
    // Show loading state
    const addButton = document.querySelector('.product-form .btn-primary');
    addButton.disabled = true;
    addButton.textContent = 'Adding...';
    
    const productData = {
      name,
      description,
      image
    };
    
    try {
      // Use IndexedDB addProduct function
      const newProduct = await addProduct(productData);
      
      // Add to local products array
      products.push(newProduct);
      currentProductId = Math.max(...products.map(p => parseInt(p.id))) + 1;
      
      // Clear form
      addProductForm.reset();
      imagePreview.innerHTML = '';
      
      // Switch to products tab
      switchTab('products');
      
      // Re-render products
      renderProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      // Reset button
      addButton.disabled = false;
      addButton.textContent = 'Add Product';
    }
  }
  
  function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
  
  function openImageModal(imageSrc, alt) {
    modalImage.src = imageSrc;
    modalImage.alt = alt || 'Product image';
    currentZoom = 1;
    modalImage.style.transform = `scale(${currentZoom})`;
    imageModal.classList.add('active');
  }
  
  function closeImageModal() {
    imageModal.classList.remove('active');
  }
  
  function zoomImage(delta) {
    currentZoom += delta;
    currentZoom = Math.max(0.5, Math.min(3, currentZoom));
    modalImage.style.transform = `scale(${currentZoom})`;
  }
  
  function downloadImage() {
    const a = document.createElement('a');
    a.href = modalImage.src;
    a.download = 'product-image.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  function openEditProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Set form values
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-description').value = product.description;
    
    // Set image preview
    if (product.image) {
      editImagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
      removeImageBtn.style.display = 'block';
    } else {
      editImagePreview.innerHTML = '';
      removeImageBtn.style.display = 'none';
    }
    
    // Show modal
    editModal.classList.add('active');
  }
  
  function closeEditProductModal() {
    editModal.classList.remove('active');
    editProductForm.reset();
    editImagePreview.innerHTML = '';
  }
  
  async function handleEditProduct(e) {
    e.preventDefault();
    
    // Show loading state
    const saveButton = document.querySelector('#edit-product-form .btn-primary');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    const id = parseInt(document.getElementById('edit-product-id').value);
    const name = document.getElementById('edit-product-name').value;
    const description = document.getElementById('edit-product-description').value;
    
    // Find product index
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      // Reset button
      saveButton.disabled = false;
      saveButton.textContent = 'Save Changes';
      return;
    }
    
    // Update product
    const updatedProduct = {
      ...products[productIndex],
      name,
      description
    };
    
    // If image was changed
    const imagePreviewEl = editImagePreview.querySelector('img');
    if (imagePreviewEl) {
      updatedProduct.image = imagePreviewEl.src;
    } else {
      updatedProduct.image = null;
    }
    
    try {
      // Use IndexedDB updateProduct function
      await updateProduct(updatedProduct);
      
      // Update products array
      products[productIndex] = updatedProduct;
      
      // Close modal
      closeEditProductModal();
      
      // Re-render products
      renderProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      // Reset button
      saveButton.disabled = false;
      saveButton.textContent = 'Save Changes';
    }
  }
  
  function handleEditImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      editImagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      removeImageBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
  
  function removeProductImage() {
    editImagePreview.innerHTML = '';
    removeImageBtn.style.display = 'none';
  }
  
  async function deleteProduct(productId) {
    const confirmDelete = confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;
    
    try {
      // Delete from IndexedDB
      await deleteProductFromServer(productId);
      
      // Remove product from array
      products = products.filter(p => p.id !== productId);
      
      // Also update localStorage as backup
      saveProducts();
      
      // Re-render products
      renderProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  }
  
  function handlePdfFileSelect(e) {
    const file = e.target.files[0];
    if (!file) {
      pdfFileName.textContent = 'No file selected';
      importPdfBtn.disabled = true;
      return;
    }
    
    pdfFileName.textContent = file.name;
    importPdfBtn.disabled = false;
  }
  
  function handlePdfImport() {
    const file = pdfFileInput.files[0];
    if (!file) return;
    
    // Show loading state
    importPdfBtn.textContent = 'Processing...';
    importPdfBtn.disabled = true;
    
    // Extract products from PDF
    extractProductsFromPdf(file).then(extractedProducts => {
      importPreviewData = extractedProducts;
      showImportPreview();
      
      // Reset button
      importPdfBtn.textContent = 'Import from PDF';
      importPdfBtn.disabled = false;
    }).catch(error => {
      console.error('Error extracting products from PDF:', error);
      alert('Failed to extract products from PDF. Please check the file format.');
      
      // Reset button
      importPdfBtn.textContent = 'Import from PDF';
      importPdfBtn.disabled = false;
    });
  }
  
  function handleExcelFileSelect(e) {
    const file = e.target.files[0];
    if (!file) {
      excelFileName.textContent = 'No file selected';
      importExcelBtn.disabled = true;
      return;
    }
    
    excelFileName.textContent = file.name;
    importExcelBtn.disabled = false;
  }
  
  function handleExcelImport() {
    const file = excelFileInput.files[0];
    if (!file) return;
    
    // Show loading state
    importExcelBtn.textContent = 'Processing...';
    importExcelBtn.disabled = true;
    
    // Extract products from Excel
    processExcelFile(file).then(extractedProducts => {
      importPreviewData = extractedProducts;
      showImportPreview();
      
      // Reset button
      importExcelBtn.textContent = 'Import from Excel';
      importExcelBtn.disabled = false;
    }).catch(error => {
      console.error('Error extracting products from Excel:', error);
      alert('Failed to extract products from Excel. Please check the file format.');
      
      // Reset button
      importExcelBtn.textContent = 'Import from Excel';
      importExcelBtn.disabled = false;
    });
  }
  
  function showImportPreview() {
    // Update count
    previewCount.textContent = importPreviewData.length;
    
    // Clear preview list
    previewList.innerHTML = '';
    
    // Populate preview list
    importPreviewData.forEach((product, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.innerHTML = `
        <div class="preview-image">
          ${product.image ? 
            `<img src="${product.image}" alt="${product.name}">` : 
            `<i class="fas fa-image"></i>`
          }
        </div>
        <div class="preview-details">
          <div class="preview-name">${product.name || `Product ${index + 1}`}</div>
          <div class="preview-description">${product.description || 'No description'}</div>
        </div>
      `;
      
      previewList.appendChild(previewItem);
    });
    
    // Show import preview
    importPreview.classList.remove('hidden');
  }
  
  async function confirmImport() {
    try {
      // Show loading state
      confirmImportBtn.textContent = 'Importing...';
      confirmImportBtn.disabled = true;
      
      // Use bulk import to IndexedDB
      const importedProducts = await bulkImportProducts(importPreviewData);
      
      // Add to products array
      products = [...products, ...importedProducts];
      
      // Update currentProductId
      if (products.length > 0) {
        const highestId = Math.max(...products.map(p => parseInt(p.id)));
        currentProductId = highestId + 1;
      }
      
      // Clear import data
      importPreviewData = [];
      importPreview.classList.add('hidden');
      pdfFileInput.value = '';
      pdfFileName.textContent = 'No file selected';
      importPdfBtn.disabled = true;
      excelFileInput.value = '';
      excelFileName.textContent = 'No file selected';
      importExcelBtn.disabled = true;
      
      // Switch to products tab
      switchTab('products');
      
      // Re-render products
      renderProducts();
      
      // Show success message
      alert(`Successfully imported ${importedProducts.length} products!`);
    } catch (error) {
      console.error('Error during import:', error);
      alert('Failed to import products. Please try again.');
    } finally {
      // Reset button
      confirmImportBtn.textContent = 'Confirm Import';
      confirmImportBtn.disabled = false;
    }
  }
  
  function cancelImport() {
    importPreviewData = [];
    importPreview.classList.add('hidden');
  }
  
  // Data export/import handlers
  async function handleManualSync() {
    // Show loading state
    syncNowBtn.disabled = true;
    syncNowBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Syncing...';
    
    try {
      // Perform sync
      const result = await syncWithCloud();
      
      // Update status
      const lastSyncSpan = document.querySelector('.sync-status span:last-child');
      if (lastSyncSpan) {
        lastSyncSpan.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
      }
      
      // Update indicator
      const indicator = document.querySelector('.sync-indicator');
      if (indicator) {
        indicator.className = 'sync-indicator active';
      }
      
      // Reload products from database after sync
      products = await getAllProducts();
      renderProducts();
      
      // Show success message
      alert(result.success ? 'Sync completed successfully!' : `Sync issue: ${result.message}`);
    } catch (error) {
      console.error('Error during manual sync:', error);
      alert('Sync failed. Please try again later.');
    } finally {
      // Reset button
      syncNowBtn.disabled = false;
      syncNowBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sync Now';
    }
  }

  async function handleExportData() {
    try {
      await exportProductsToJson();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  }
  
  async function handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Show loading state
      exportDataBtn.textContent = 'Importing...';
      exportDataBtn.disabled = true;
      
      // Import products
      const importedProducts = await importProductsFromJson(file);
      
      // Update products array with imported products
      products = [...products, ...importedProducts];
      
      // Find the highest product ID to set currentProductId
      if (products.length > 0) {
        const highestId = Math.max(...products.map(p => parseInt(p.id)));
        currentProductId = highestId + 1;
      }
      
      // Update localStorage
      saveProducts();
      
      // Re-render products
      renderProducts();
      
      // Show success message
      alert(`Successfully imported ${importedProducts.length} products!`);
      
      // Reset file input
      importDataFile.value = '';
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      // Reset button
      exportDataBtn.textContent = 'Export';
      exportDataBtn.disabled = false;
    }
  }
});