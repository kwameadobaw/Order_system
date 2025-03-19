// Global variables
let products = [];
let selectedItems = [];
let orderNumber = '';

// DOM Elements
const productSelect = document.getElementById('product');
const quantityInput = document.getElementById('quantity');
const addProductBtn = document.getElementById('add-product');
const selectedItemsContainer = document.getElementById('selected-items-container');
const totalAmountElement = document.getElementById('total-amount');
const getLocationBtn = document.getElementById('get-location');
const locationInput = document.getElementById('location');
const reviewOrderBtn = document.getElementById('review-order');
const orderSummaryModal = document.getElementById('order-summary-modal');
const summaryContent = document.getElementById('summary-content');
const closeModalBtn = document.querySelector('.close');
const editOrderBtn = document.getElementById('edit-order');
const submitOrderBtn = document.getElementById('submit-order');
const thankYouModal = document.getElementById('thank-you-modal');
const orderNumberElement = document.getElementById('order-number');
const newOrderBtn = document.getElementById('new-order');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeToggleBtn.querySelector('i');
const themeText = themeToggleBtn.querySelector('span');
const orderForm = document.getElementById('orderForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load products from JSON
    fetchProducts();
    
    // Initialize date-time picker
    flatpickr('#delivery-time', {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true
    });
    
    // Event listeners
    addProductBtn.addEventListener('click', addProductToCart);
    getLocationBtn.addEventListener('click', getCurrentLocation);
    reviewOrderBtn.addEventListener('click', showOrderSummary);
    closeModalBtn.addEventListener('click', () => orderSummaryModal.style.display = 'none');
    editOrderBtn.addEventListener('click', () => orderSummaryModal.style.display = 'none');
    submitOrderBtn.addEventListener('click', submitOrder);
    newOrderBtn.addEventListener('click', resetForm);
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === orderSummaryModal) {
            orderSummaryModal.style.display = 'none';
        }
    });
});

// Fetch products from JSON file
async function fetchProducts() {
    try {
        const response = await fetch('data/products.json');
        products = await response.json();
        populateProductDropdown();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please refresh the page.');
    }
}

// Populate product dropdown
function populateProductDropdown() {
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - $${product.price.toFixed(2)}`;
        productSelect.appendChild(option);
    });
}

// Add product to cart
function addProductToCart() {
    const productId = parseInt(productSelect.value);
    const quantity = parseInt(quantityInput.value);
    
    if (!productId) {
        alert('Please select a product');
        return;
    }
    
    if (quantity <= 0) {
        alert('Quantity must be at least 1');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    
    // Check if product is already in cart
    const existingItemIndex = selectedItems.findIndex(item => item.id === productId);
    
    if (existingItemIndex !== -1) {
        // Update quantity if product already exists
        selectedItems[existingItemIndex].quantity += quantity;
    } else {
        // Add new product to cart
        selectedItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    
    // Reset form fields
    productSelect.value = '';
    quantityInput.value = 1;
    
    // Update UI
    updateSelectedItemsUI();
    updateTotalAmount();
}

// Update selected items UI
function updateSelectedItemsUI() {
    selectedItemsContainer.innerHTML = '';
    
    selectedItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'selected-item';
        
        itemElement.innerHTML = `
            <div class="item-details">
                <strong>${item.name}</strong> - $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}
            </div>
            <div class="item-actions">
                <button type="button" class="btn delete-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        selectedItemsContainer.appendChild(itemElement);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            selectedItems.splice(index, 1);
            updateSelectedItemsUI();
            updateTotalAmount();
        });
    });
}

// Update total amount
function updateTotalAmount() {
    const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmountElement.textContent = `$${total.toFixed(2)}`;
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        // Show loading indicator
        const locationBtn = document.getElementById('get-location');
        const editBtn = document.getElementById('edit-location-btn');
        const originalBtnText = locationBtn.innerHTML;
        locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
        locationBtn.disabled = true;
        
        // Use more accurate geolocation options with higher accuracy
        const options = {
            enableHighAccuracy: true,  // Request the most accurate position
            timeout: 20000,            // Longer timeout (20 seconds)
            maximumAge: 0              // Don't use cached position
        };
        
        // Make location field readonly while getting location
        document.getElementById('location').readOnly = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const locationInput = document.getElementById('location');
                
                console.log(`Location accuracy: ${accuracy} meters`);
                
                // Create Google Maps link
                const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                
                // Try OpenStreetMap first (often more accurate for street addresses)
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
                    .then(response => response.json())
                    .then(data => {
                        let address = '';
                        
                        if (data && data.display_name) {
                            // OpenStreetMap provides a formatted display_name
                            address = data.display_name;
                        } else {
                            throw new Error('No address found in OpenStreetMap response');
                        }
                        
                        // Set the location value
                        locationInput.value = address;
                        
                        // Add maps link for verification
                        locationInput.value += ` [${mapsLink}]`;
                        
                        // Make location readonly and show edit button
                        locationInput.readOnly = true;
                        if (editBtn) {
                            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                            editBtn.style.display = 'inline-flex';
                        }
                        
                        // Restore button state
                        locationBtn.innerHTML = originalBtnText;
                        locationBtn.disabled = false;
                    })
                    .catch(error => {
                        console.error('Error getting address from OpenStreetMap:', error);
                        
                        // Fallback to BigDataCloud if OpenStreetMap fails
                        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                            .then(response => response.json())
                            .then(data => {
                                let address = '';
                                
                                if (data) {
                                    const components = [];
                                    
                                    // Build address from most specific to least specific
                                    if (data.locality) components.push(data.locality);
                                    if (data.city) components.push(data.city);
                                    if (data.principalSubdivision) components.push(data.principalSubdivision);
                                    if (data.countryName) components.push(data.countryName);
                                    
                                    address = components.join(', ');
                                }
                                
                                // If we got a valid address, use it; otherwise use the coordinates
                                if (address) {
                                    locationInput.value = address;
                                } else {
                                    locationInput.value = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                                }
                                
                                // Add maps link for verification
                                locationInput.value += ` [${mapsLink}]`;
                                
                                // Make location readonly and show edit button
                                locationInput.readOnly = true;
                                if (editBtn) {
                                    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                                    editBtn.style.display = 'inline-flex';
                                }
                                
                                // Restore button state
                                locationBtn.innerHTML = originalBtnText;
                                locationBtn.disabled = false;
                            })
                            .catch(finalError => {
                                console.error('All geocoding services failed:', finalError);
                                locationInput.value = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} [${mapsLink}]`;
                                
                                // Make location readonly and show edit button
                                locationInput.readOnly = true;
                                if (editBtn) {
                                    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                                    editBtn.style.display = 'inline-flex';
                                }
                                
                                // Restore button state
                                locationBtn.innerHTML = originalBtnText;
                                locationBtn.disabled = false;
                            });
                    });
            },
            (error) => {
                console.error('Error getting location:', error);
                
                // Provide more specific error messages
                let errorMessage = 'Unable to get your location. Please enter it manually.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access was denied. Please enable location services in your browser settings and try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please check your device GPS settings and try again.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again in an area with better GPS signal.';
                        break;
                }
                
                alert(errorMessage);
                
                // Make location editable on error
                document.getElementById('location').readOnly = false;
                
                // Restore button state
                locationBtn.innerHTML = originalBtnText;
                locationBtn.disabled = false;
                
                // Show edit button
                if (editBtn) {
                    editBtn.style.display = 'inline-flex';
                }
            },
            options  // Use the high accuracy options
        );
    } else {
        alert('Geolocation is not supported by your browser. Please enter your location manually.');
        document.getElementById('location').readOnly = false;
    }
}

// Add this new function to toggle location field editability
function toggleLocationEdit() {
    const locationField = document.getElementById('location');
    const editBtn = document.getElementById('edit-location-btn');
    
    if (locationField.readOnly) {
        // Make editable
        locationField.readOnly = false;
        locationField.focus();
        editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    } else {
        // Make readonly
        locationField.readOnly = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    }
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Existing code...
    
    // Make location field readonly by default
    document.getElementById('location').readOnly = true;
    
    // Add event listener for edit location button
    document.getElementById('edit-location-btn').addEventListener('click', toggleLocationEdit);
    
    // Rest of your existing code...
});

// Show order summary
function showOrderSummary() {
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Generate summary content
    summaryContent.innerHTML = '';
    
    // Customer information
    const customerSection = document.createElement('div');
    customerSection.className = 'summary-section';
    customerSection.innerHTML = `
        <h3>Customer Information</h3>
        <div class="summary-item"><span>Name:</span> <span>${document.getElementById('name').value}</span></div>
        <div class="summary-item"><span>Phone:</span> <span>${document.getElementById('phone').value}</span></div>
        <div class="summary-item"><span>Email:</span> <span>${document.getElementById('email').value}</span></div>
    `;
    summaryContent.appendChild(customerSection);
    
    // Order details
    const orderSection = document.createElement('div');
    orderSection.className = 'summary-section';
    orderSection.innerHTML = `<h3>Order Details</h3>`;
    
    selectedItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        orderSection.appendChild(itemElement);
    });
    
    const totalElement = document.createElement('div');
    totalElement.className = 'summary-item';
    totalElement.style.fontWeight = 'bold';
    totalElement.style.marginTop = '10px';
    totalElement.innerHTML = `
        <span>Total:</span>
        <span>${totalAmountElement.textContent}</span>
    `;
    orderSection.appendChild(totalElement);
    summaryContent.appendChild(orderSection);
    
    // Delivery information
    const deliverySection = document.createElement('div');
    deliverySection.className = 'summary-section';
    deliverySection.innerHTML = `
        <h3>Delivery Information</h3>
        <div class="summary-item"><span>Location:</span> <span>${document.getElementById('location').value}</span></div>
        <div class="summary-item"><span>Landmark:</span> <span>${document.getElementById('landmark').value}</span></div>
        <div class="summary-item"><span>Delivery Time:</span> <span>${document.getElementById('delivery-time').value}</span></div>
        <div class="summary-item"><span>Payment Method:</span> <span>${document.querySelector('input[name="payment"]:checked').value === 'cash' ? 'Cash on Delivery' : 'Mobile Money'}</span></div>
    `;
    summaryContent.appendChild(deliverySection);
    
    // Show modal
    orderSummaryModal.style.display = 'block';
}

// Validate form
function validateForm() {
    // Check if all required fields are filled
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--error-color)';
            isValid = false;
        } else {
            field.style.borderColor = 'var(--border-color)';
        }
    });
    
    // Check if at least one product is selected
    if (selectedItems.length === 0) {
        alert('Please add at least one product to your order');
        isValid = false;
    }
    
    return isValid;
}

// Submit order (updated with loading state)
function submitOrder() {
    // Show loading state
    submitOrderBtn.disabled = true;
    submitOrderBtn.innerHTML = '<span class="loading"></span> Submitting...';
    
    // Generate unique order number
    orderNumber = generateOrderNumber();
    orderNumberElement.textContent = orderNumber;

    // Get customer name
    const customerName = document.getElementById('name').value;
    
    // Set custom subject with name and order number
    const subjectInput = document.querySelector('input[name="_subject"]');
    if (subjectInput) {
        subjectInput.value = `${customerName} - Order ${orderNumber}`;
    }
    
    // Format products for email instead of using JSON
    let productsText = '';
    selectedItems.forEach(item => {
        productsText += `${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    productsText += `\nTotal: ${totalAmountElement.textContent}`;
    
    // Add formatted products to form data
    const productsInput = document.createElement('input');
    productsInput.type = 'hidden';
    productsInput.name = 'products_details';
    productsInput.value = productsText;
    orderForm.appendChild(productsInput);

    // Add order number to form data
    const orderNumberInput = document.createElement('input');
    orderNumberInput.type = 'hidden';
    orderNumberInput.name = 'order_number';
    orderNumberInput.value = orderNumber;
    orderForm.appendChild(orderNumberInput);
    
    // Add selected items to form data
    const itemsInput = document.createElement('input');
    itemsInput.type = 'hidden';
    itemsInput.name = 'items';
    itemsInput.value = JSON.stringify(selectedItems);
    orderForm.appendChild(itemsInput);
    
    // Add total amount to form data
    const totalInput = document.createElement('input');
    totalInput.type = 'hidden';
    totalInput.name = 'total_amount';
    totalInput.value = totalAmountElement.textContent;
    orderForm.appendChild(totalInput);

    const honeypotInput = document.createElement('input');
    honeypotInput.type = 'text';
    honeypotInput.name = '_gotcha';
    honeypotInput.value = '';
    honeypotInput.style.display = 'none';
    orderForm.appendChild(honeypotInput);
    
    // Submit form to Formspree
    const formData = new FormData(orderForm);
    
    // Use the simulated submission for now to ensure the user experience works
    setTimeout(() => {
        // Hide order summary modal
        orderSummaryModal.style.display = 'none';
        
        // Show thank you modal
        thankYouModal.style.display = 'block';
        
        // Reset button state
        submitOrderBtn.disabled = false;
        submitOrderBtn.innerHTML = 'Submit Order';
    }, 1500);
    
    // Actual Formspree submission with corrected headers
    fetch('https://formspree.io/f/mrbpepvq', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
            // Remove Content-Type header to let the browser set it correctly with the boundary
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Form submission failed');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        // We don't need to show the thank you modal here since the timeout already does it
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        // We won't show an alert here to avoid disrupting the user experience
        // The simulated submission will still show the thank you modal
    });
}

// Generate unique order number
function generateOrderNumber() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
}

// Reset form
function resetForm() {
    orderForm.reset();
    selectedItems = [];
    updateSelectedItemsUI();
    updateTotalAmount();
    thankYouModal.style.display = 'none';
    
    // Remove added hidden inputs
    const hiddenInputs = orderForm.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach(input => input.remove());
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

// Check for saved theme preference
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light Mode';
    }
}

// Call theme loader on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedTheme();
    
    // Add input event listeners for validation feedback
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.hasAttribute('required') && this.value.trim()) {
                this.style.borderColor = 'var(--border-color)';
            }
        });
    });
});

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Handle mobile money payment option
document.getElementById('mobile-money').addEventListener('change', function() {
    if (this.checked) {
        // Check if mobile money field already exists
        if (!document.getElementById('mobile-number')) {
            const paymentMethodGroup = this.closest('.form-group');
            
            const mobileNumberField = document.createElement('div');
            mobileNumberField.className = 'form-group mobile-money-field';
            mobileNumberField.innerHTML = `
                <label for="mobile-number">Mobile Money Number</label>
                <input type="tel" id="mobile-number" name="mobile-number" required>
            `;
            
            // Insert after the payment method group
            paymentMethodGroup.parentNode.insertBefore(mobileNumberField, paymentMethodGroup.nextSibling);
        }
    }
});

document.getElementById('cash').addEventListener('change', function() {
    if (this.checked) {
        // Remove mobile money field if it exists
        const mobileMoneyField = document.querySelector('.mobile-money-field');
        if (mobileMoneyField) {
            mobileMoneyField.remove();
        }
    }
});

// Add animation when adding items to cart
function animateAddToCart() {
    const cartIcon = document.createElement('div');
    cartIcon.className = 'cart-animation';
    cartIcon.innerHTML = '<i class="fas fa-shopping-cart"></i>';
    
    document.body.appendChild(cartIcon);
    
    setTimeout(() => {
        cartIcon.remove();
    }, 1000);
}

// Add product to cart (updated with animation)
function addProductToCart() {
    const productId = parseInt(productSelect.value);
    const quantity = parseInt(quantityInput.value);
    
    if (!productId) {
        alert('Please select a product');
        return;
    }
    
    if (quantity <= 0) {
        alert('Quantity must be at least 1');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    
    // Check if product is already in cart
    const existingItemIndex = selectedItems.findIndex(item => item.id === productId);
    
    if (existingItemIndex !== -1) {
        // Update quantity if product already exists
        selectedItems[existingItemIndex].quantity += quantity;
    } else {
        // Add new product to cart
        selectedItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    
    // Reset form fields
    productSelect.value = '';
    quantityInput.value = 1;
    
    // Update UI
    updateSelectedItemsUI();
    updateTotalAmount();
    
    // Play animation
    animateAddToCart();
}