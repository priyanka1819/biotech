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

  // Functions
  function initApp() {
    // Load products from localStorage
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      products = JSON.parse(savedProducts);
      
      // Find the highest product ID to set currentProductId
      if (products.length > 0) {
        const highestId = Math.max(...products.map(p => parseInt(p.id)));
        currentProductId = highestId + 1;
      }
    }
    
    renderProducts();
  }
  
  function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
  }
  
  function renderProducts() {
    // Filter products based on search term
    const filteredProducts = products.filter(product => {
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
  
  function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const imagePreviewEl = imagePreview.querySelector('img');
    const image = imagePreviewEl ? imagePreviewEl.src : null;
    
    const newProduct = {
      id: currentProductId++,
      name,
      description,
      image
    };
    
    // Add to products array
    products.push(newProduct);
    
    // Save to localStorage
    saveProducts();
    
    // Clear form
    addProductForm.reset();
    imagePreview.innerHTML = '';
    
    // Switch to products tab
    switchTab('products');
    
    // Re-render products
    renderProducts();
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
  
  function handleEditProduct(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-product-id').value);
    const name = document.getElementById('edit-product-name').value;
    const description = document.getElementById('edit-product-description').value;
    
    // Find product index
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return;
    
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
    
    // Update products array
    products[productIndex] = updatedProduct;
    
    // Save to localStorage
    saveProducts();
    
    // Close modal
    closeEditProductModal();
    
    // Re-render products
    renderProducts();
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
  
  function deleteProduct(productId) {
    const confirmDelete = confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;
    
    // Remove product from array
    products = products.filter(p => p.id !== productId);
    
    // Save to localStorage
    saveProducts();
    
    // Re-render products
    renderProducts();
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
  
  function confirmImport() {
    // Add unique IDs to imported products
    const productsToImport = importPreviewData.map(product => ({
      ...product,
      id: currentProductId++
    }));
    
    // Add to products array
    products = [...products, ...productsToImport];
    
    // Save to localStorage
    saveProducts();
    
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
    alert(`Successfully imported ${productsToImport.length} products!`);
  }
  
  function cancelImport() {
    importPreviewData = [];
    importPreview.classList.add('hidden');
  }
});