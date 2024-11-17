document.addEventListener('DOMContentLoaded', async () => {
  await loadCategoriesAndProducts();
  filterCategory('all'); // Show all products by default
});

let baseURL = 'https://museum-db-2.onrender.com';

let expandedItemId, expandedItemName, expandedItemPrice;

// Function to load categories dynamically and populate the sidebar
async function loadCategoriesAndProducts() {
  try {
      const response = await fetch(`${baseURL}/api/storeitems`);
      const items = await response.json();

      // Create a Set to store unique categories (ignoring case)
      const categoriesSet = new Set();
      items.forEach(item => {
          const category = item.category ? item.category.toLowerCase() : 'uncategorized';
          categoriesSet.add(category.charAt(0).toUpperCase() + category.slice(1));
      });

      // Populate the sidebar with categories
      const sidebar = document.getElementById("category-container");
      sidebar.innerHTML = ''; // Clear existing items
      categoriesSet.forEach(category => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<a href="#" class="block text-gray-400 hover:text-white" onclick="filterCategory('${category.toLowerCase()}')">${category}</a>`;
          sidebar.appendChild(listItem);
      });

      // Add an "All" category at the top
      const allCategory = document.createElement('li');
      allCategory.innerHTML = `<a href="#" class="block text-gray-400 hover:text-white" onclick="filterCategory('all')">All</a>`;
      sidebar.prepend(allCategory);

      // Render products in the #product-container
      const productContainer = document.getElementById('product-container');
      productContainer.innerHTML = ''; // Clear existing items
      items.forEach(item => {
          const productCard = createProductCard(item);
          productContainer.appendChild(productCard);
      });

  } catch (error) {
      console.error('Error loading categories and products:', error);
  }
}

function createProductCard(item) {
  const productCard = document.createElement('div');
  productCard.className = 'bg-gray-800 rounded-lg shadow-lg p-6 text-center product-card';
  productCard.setAttribute('data-category', item.category ? item.category.toLowerCase() : 'uncategorized');

  productCard.innerHTML = `
      <img src="images/product_placeholder.jpg" alt="${item.name || 'Unnamed'}" class="w-full h-40 object-cover rounded-lg mb-4">
      <h3 class="text-xl font-semibold text-white mb-2">${item.name || 'Unnamed'}</h3>
      <span class="text-lg font-bold text-white mb-2">$${item.price || 'N/A'}</span>
      <p class="text-gray-400 mb-4">${item.description || 'No description available'}</p>
      <button class="btn btn-outline text-white border-white w-full" onclick='openExpandedCard(${JSON.stringify(item).replace(/'/g, "&apos;")})'>View More</button>
  `;
  return productCard;
}


// Function to filter products by category
function filterCategory(category) {
  const products = document.querySelectorAll('.product-card');

  // Step 1: Hide all products by removing 'show' class
  products.forEach(product => {
      product.classList.remove('show');
  });

  // Step 2: After hiding, update visibility for selected category
  setTimeout(() => {
      products.forEach(product => {
          if (category === 'all' || product.getAttribute('data-category') === category) {
              product.style.display = 'block'; // Ensure it's visible for the transition
              setTimeout(() => {
                  product.classList.add('show'); // Apply fade-in effect
              }, 10); // Short delay to ensure 'show' class adds after display is set to block
          } else {
              product.style.display = 'none'; // Hide product if it doesn't match
          }
      });
  }, 200); // Delay to match CSS transition time for a smooth effect
}

// Toggle description visibility
function toggleDescription(button) {
  const description = button.previousElementSibling;
  if (description.classList.contains('line-clamp-3')) {
      description.classList.remove('line-clamp-3');
      button.textContent = 'View Less';
  } else {
      description.classList.add('line-clamp-3');
      button.textContent = 'View More';
  }
}

// Function to open the expanded card modal and populate it with item data
function openExpandedCard(item) {
  console.log("Modal opened for item:", item);

  expandedItemId = item.id;
  expandedItemName = item.name;
  expandedItemPrice = item.price;

  document.getElementById('expanded-card-modal').classList.remove('hidden');
  document.getElementById('expanded-image').src = "images/product_placeholder.jpg"; // Replace with item image if available
  document.getElementById('expanded-name').textContent = item.name || 'Unnamed';
  document.getElementById('expanded-price').textContent = `$${item.price || 'N/A'}`;
  document.getElementById('expanded-description').textContent = item.description || 'No description available';
  document.getElementById('quantity').textContent = '1'; // Reset quantity to 1
}

// Function to close the expanded card modal
function closeExpandedCard() {
  document.getElementById('expanded-card-modal').classList.add('hidden');
}

// Functions to increase/decrease quantity
function increaseQuantity2() {
  const quantityElement = document.getElementById('quantity');
  let quantity = parseInt(quantityElement.textContent);
  quantityElement.textContent = ++quantity;
}

function decreaseQuantity2() {
  const quantityElement = document.getElementById('quantity');
  let quantity = parseInt(quantityElement.textContent);
  if (quantity > 1) quantityElement.textContent = --quantity;
}

function getQuantity() {
  return parseInt(document.getElementById("quantity").textContent);
}
