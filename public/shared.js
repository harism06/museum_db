// Declare a global variable to hold the visitor ID
let visitorID;

// Function to check profile status (to be called on DOM load in each page)
document.addEventListener('DOMContentLoaded', async function() {
    checkProfileStatus();
    initializeCart();
    loadCartItems();
    updateCartIconCount();
});
let baseUrl = 'https://museum-db-2.onrender.com' || 'http://localhost:3000';

// Function to check login status and toggle profile button visibility
async function checkProfileStatus() {
    const token = localStorage.getItem('authToken');
    const cartIcon = document.getElementById('cart-icon'); // Get cart icon element

    if (!token) {
        console.log('No token found in localStorage');
        document.getElementById('login-link').classList.remove('hidden');
        document.getElementById('profile-btn').classList.add('hidden');
        document.getElementById('add-membership-btn').classList.add('hidden');
        document.getElementById('edit-employee-btn').classList.add('hidden');
        document.getElementById('notification-bell').classList.add('hidden'); // Hide notification bell
        cartIcon.classList.add('hidden'); // Hide cart icon
        console.log('Login link is now visible, and profile button, cart, and notification bell are hidden.');
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/auth/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Attach token in Authorization header
            }
        });

        const result = await response.json();
        console.log('Profile Fetch Response:', result);

        if (response.ok) {
            console.log('User is logged in, displaying profile button.');
            document.getElementById('profile-btn').classList.remove('hidden');
            document.getElementById('login-link').classList.add('hidden');
            document.getElementById('notification-bell').classList.remove('hidden'); // Show notification bell
            cartIcon.classList.remove('hidden'); // Show cart icon
            console.log('Profile button, cart, and notification bell are now visible, and login link is hidden.');

            // Check user role and display Add Membership and Edit Employee buttons accordingly
            if (result.role !== undefined) {
                console.log(`User role: ${result.role}`);
                if (result.role >= 1) { // Display "Manage Members" for roles 1 or higher
                    document.getElementById('add-membership-btn').classList.remove('hidden');
                    console.log('Add Membership button is now visible.');

                    if (result.role >= 2) { // Display "Manage Employees" for roles 2 or higher
                        document.getElementById('edit-employee-btn').classList.remove('hidden');
                        console.log('Edit Employee button is now visible.');

                        if (result.role >= 3) {
                            document.getElementById('edit-museum-btn').classList.remove('hidden');
                            document.getElementById('view-reports-btn').classList.remove('hidden');
                            console.log('Museum Editing is now enabled for the manager.');
                        }
                    } else {
                        document.getElementById('edit-employee-btn').classList.add('hidden');
                        console.log('User does not have a high enough role to see the Edit Employee Button');
                    }
                } else {
                    document.getElementById('add-membership-btn').classList.add('hidden');
                    console.log('User does not have a high enough role to see the Add Membership button.');
                }
            } else {
                console.log('User role is not defined in the response.');
            }

            // Set visitor ID globally
            visitorID = result.visitorID;

        } else {
            console.log('User not logged in or token invalid.');
            document.getElementById('login-link').classList.remove('hidden');
            document.getElementById('profile-btn').classList.add('hidden');
            document.getElementById('add-membership-btn').classList.add('hidden');
            document.getElementById('edit-employee-btn').classList.add('hidden');
            document.getElementById('notification-bell').classList.add('hidden'); // Hide notification bell
            cartIcon.classList.add('hidden'); // Hide cart icon
            console.log('Login link is now visible, and profile button, cart, and notification bell are hidden.');
        }
    } catch (error) {
        console.error('Error verifying login status:', error);
        document.getElementById('login-link').classList.remove('hidden');
        document.getElementById('profile-btn').classList.add('hidden');
        document.getElementById('add-membership-btn').classList.add('hidden');
        document.getElementById('edit-employee-btn').classList.add('hidden');
        document.getElementById('notification-bell').classList.add('hidden'); // Hide notification bell
        cartIcon.classList.add('hidden'); // Hide cart icon
        console.log('Login link is now visible, and profile button, cart, and notification bell are hidden due to error.');
    }
}

function initializeCart() {
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}


// Function to toggle the profile menu
async function toggleProfileMenu() {

    const profileMenu = document.getElementById('profile-menu');
    const overlay = document.getElementById('overlay');

    if (profileMenu.classList.contains('translate-x-full')) {
        // Open the profile menu
        profileMenu.classList.remove('translate-x-full');
        profileMenu.classList.remove('hidden');
        overlay.classList.remove('hidden');

        // Fetch and populate user data
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${baseUrl}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Attach token in Authorization header
                }
            });

            if (response.ok) {
                const userData = await response.json();

                // Store visitor ID globally
                visitorID = userData.visitorID;

                // Populate profile information
                document.getElementById('visitor-id').value = userData.visitorID || '';
                document.getElementById('created-at').value = userData.createdAt || '';
                document.getElementById('profile-name').value = userData.name || '';
                document.getElementById('profile-age').value = userData.age || '';

                // Format birthdate to 'YYYY-MM-DD' for the date input field
                const birthdate = userData.birthdate ? new Date(userData.birthdate).toISOString().split('T')[0] : '';
                document.getElementById('profile-birthdate').value = birthdate;

                document.getElementById('profile-email').value = userData.email || '';
                document.getElementById('profile-phone').value = userData.phoneNumber || '';
            } else {
                console.error('Failed to fetch profile information.');
            }
        } catch (error) {
            console.error('Error fetching profile information:', error);
        }
    } else {
        // Close the profile menu
        profileMenu.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

// Function to save profile changes
async function saveProfileChanges() {

    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('You are not logged in. Please log in and try again.');
        return;
    }

    // Get updated values from the profile form
    const name = document.getElementById('profile-name').value;
    const age = document.getElementById('profile-age').value;
    const birthdate = document.getElementById('profile-birthdate').value;
    const email = document.getElementById('profile-email').value;
    const phoneNumber = document.getElementById('profile-phone').value;

    // Check if all fields are filled (optional but useful validation)
    if (!name || !age || !birthdate || !email || !phoneNumber) {
        alert('Please fill out all fields.');
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Attach token in Authorization header
            },
            body: JSON.stringify({
                name,
                age,
                birthdate,
                email,
                phoneNumber,
                visitorID
            }) // Send all fields
        });

        const result = await response.json();

        if (response.ok) {
            // Check if the API call was successful
            alert('Profile updated successfully.');
            location.reload(); // Refresh the page after a successful update
        } else if (response.status === 409) {
            // Handle the case when the email already exists
            alert(`Failed to update profile: ${result.message}`);
        } else {
            // Handle other potential issues
            alert(`Failed to update profile: ${result.message}`);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred. Please try again.');
    }
}

// Function to sign out the user
async function signOut() {
    try {
        localStorage.removeItem('authToken'); // Remove the token from localStorage
        alert('Logout successful');

        // Reload the page after a successful logout
        location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

function toggleNotificationBox() {
    const notificationBox = document.getElementById('notification-box');
    const isHidden = notificationBox.classList.contains('hidden');

    if (isHidden) {
        // If the box is hidden, fetch notifications and show the box
        fetchNotifications();
        notificationBox.classList.remove('hidden');
    } else {
        // If the box is visible, hide it
        notificationBox.classList.add('hidden');
    }
}

// Attach the event listener to the notification bell
document.getElementById('notification-bell').addEventListener('click', toggleNotificationBox);

// Fetches notifications and displays them
async function fetchNotifications() {

    console.log('Fetching notifications...');
    const notificationBox = document.getElementById('notification-box');
    const notificationList = document.getElementById('notification-list');
    const token = localStorage.getItem('authToken');
    notificationList.innerHTML = '';

    if (!token || !visitorID) {
        console.log('No token or visitorID found');
        notificationList.innerHTML = `<div class="text-center p-2 text-gray-300">No new notifications</div>`;
        return;
    }

    try {
        // Make API call to fetch notifications
        console.log(`Fetching notifications for visitorID: ${visitorID}`);
        const response = await fetch(`${baseUrl}/api/notifications?visitorID=${visitorID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const notifications = await response.json();
        console.log('Notifications fetched:', notifications);

        if (response.ok && notifications.length > 0) {
            notifications.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.classList.add('notification-item', 'p-2', 'border-b', 'border-gray-700', 'flex', 'justify-between', 'items-center');

                // Create the content and the "X" button
                notificationItem.innerHTML = `
                    <div>
                        <p>${notification.NotificationText}</p>
                        <span class="text-sm text-gray-400">${new Date(notification.NotificationTime).toLocaleString()}</span>
                    </div>
                    <button class="mark-checked-btn text-red-600" data-id="${notification.NotificationId}">X</button>
                `;

                // Attach the click event to the "X" button
                notificationItem.querySelector('.mark-checked-btn').addEventListener('click', async (event) => {
                    const notificationId = event.target.getAttribute('data-id');
                    console.log(`Marking notification as checked: ${notificationId}`);
                    await markNotificationAsChecked(notificationId);
                    // Optionally, remove or update the notification item
                    notificationItem.classList.add('hidden'); // Hides the item after marking as checked
                });

                notificationList.appendChild(notificationItem);
            });
        } else {
            // Display a message if no notifications are found
            console.log('No new notifications found');
            notificationList.innerHTML = `<div class="text-center p-2 text-gray-300">No new notifications</div>`;
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        notificationList.innerHTML = `<div class="text-center p-2 text-gray-300">Error fetching notifications</div>`;
    }
}


// Close modal or profile menu when clicking outside of it
window.onclick = function(event) {
    const overlay = document.getElementById('overlay');
    const profileMenu = document.getElementById('profile-menu');

    // Check if the click is outside the profile menu overlay
    if (event.target === overlay && profileMenu && !profileMenu.classList.contains('translate-x-full')) {
        profileMenu.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
};

// Close notification box when clicking outside of it
document.addEventListener('click', function(event) {
    const notificationBox = document.getElementById('notification-box');
    const notificationBell = document.getElementById('notification-bell');

    if (notificationBox && !notificationBox.classList.contains('hidden')) {
        // Check if the click is outside the notification box and notification bell
        if (
            !notificationBox.contains(event.target) &&
            !notificationBell.contains(event.target)
        ) {
            notificationBox.classList.add('hidden');
        }
    }
});

async function markNotificationAsChecked(notificationId) {

    console.log('Marking notification as checked:', notificationId);
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('You are not logged in. Please log in and try again.');
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/api/notifications/check/${notificationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to mark notification as checked:', response.status, response.statusText);
        } else {
            console.log('Notification successfully marked as checked');
        }
    } catch (error) {
        console.error('Error marking notification as checked:', error);
    }
}

function openModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('login-modal');
    const profileMenu = document.getElementById('profile-menu');
    const overlay = document.getElementById('overlay');

    // Hide the login modal if it's open
    if (modal) {
        modal.classList.add('hidden');
    }

    // Hide the profile menu if it's open
    if (profileMenu && !profileMenu.classList.contains('translate-x-full')) {
        profileMenu.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }

    // Reset the form visibility and modal title to the login state
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm && registerForm) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');

        // Reset modal title to 'Login'
        document.getElementById('modal-title').textContent = 'Login';

        // Show register button and hide login button in case they were toggled
        document.getElementById('toggle-register-button').classList.remove('hidden');
        document.getElementById('toggle-login-button').classList.add('hidden');
    }
}


// Function to show the register form
function showRegisterForm() {
    console.log('Register button clicked, showing register form'); // Debugging message

    // Show the registration form and hide the login form
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (registerForm && loginForm) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');

        // Update button visibility and modal title
        document.getElementById('toggle-register-button').classList.add('hidden');
        document.getElementById('toggle-login-button').classList.remove('hidden');
        document.getElementById('modal-title').textContent = 'Register';

        // Make the modal visible if it's not already
        document.getElementById('login-modal').classList.remove('hidden');
    } else {
        console.error('Register or Login form not found in HTML'); // Error message
    }
}

// Function to show the login form
function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('toggle-register-button').classList.remove('hidden');
    document.getElementById('toggle-login-button').classList.add('hidden');
    document.getElementById('modal-title').textContent = 'Login';
    document.getElementById('form-divider').classList.remove('hidden');
    document.getElementById('register-login-divider').classList.add('hidden');
}

document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Login Response:", result);
            alert(result.message);

            // Store the token in localStorage
            localStorage.setItem('authToken', result.token);
            console.log("Token stored in localStorage:", result.token); // Debugging message

            // Close the modal and update the DOM
            closeModal();

            // Call the function to verify login status and show profile button
            checkProfileStatus();
        } else {
            console.log("Login Error:", result);
            alert(result.message);
        }
    } catch (error) {
        console.error('Error during login process:', error);
        alert('An error occurred. Please try again.');
    }
});

// Handle Register Form Submission
document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const birthdate = document.getElementById('birthdate').value;
    const phoneNumber = document.getElementById('phone').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                age,
                birthdate,
                phoneNumber,
                email,
                password
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            showLoginForm();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

// Function to toggle the cart box
function toggleCartBox() {
    const cartBox = document.getElementById('cart-box');
    const isHidden = cartBox.classList.contains('hidden');

    if (isHidden) {
        // If the cart box is hidden, show it

        cartBox.classList.remove('hidden');
    } else {
        // If the cart box is visible, hide it
        cartBox.classList.add('hidden');
    }
}

// Close the cart box when clicking outside of it
document.addEventListener('click', function(event) {
    const cartBox = document.getElementById('cart-box');
    const cartIcon = document.getElementById('cart-icon'); // Assuming you have a cart icon button

    if (cartBox && !cartBox.classList.contains('hidden')) {
        // Check if the click is outside the cart box and cart icon
        if (
            !cartBox.contains(event.target) &&
            !cartIcon.contains(event.target)
        ) {
            cartBox.classList.add('hidden');
        }
    }
});

function addToCart(id, name, price, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === id);

    if (existingItemIndex > -1) {
        // Update quantity if item already exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        cart.push({
            id,
            name,
            price,
            quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${name} has been added to your cart.`);
    updateCartIconCount(); // Update the cart icon count to reflect the added item
    location.reload();
}


function loadCartItems() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    // Check if cart elements exist before proceeding
    if (!cartList || !cartTotal || !emptyCartMessage) {
        console.error("One or more cart elements are missing from the DOM.");
        return;
    }

    // Clear previous items
    cartList.innerHTML = '';

    if (cartItems.length === 0) {
        // Show empty message if cart is empty
        emptyCartMessage.style.display = 'block';
        cartTotal.textContent = '$0.00';
    } else {
        // Hide empty message if there are items in the cart
        emptyCartMessage.style.display = 'none';
        let total = 0;

        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('flex', 'justify-between', 'items-center', 'p-2', 'border-b', 'border-gray-700');

            // Add item structure with quantity controls
            itemElement.innerHTML = `
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <div class="flex items-center space-x-2">
                        <span>Qty:</span>
                        <button onclick="decreaseQuantity(${item.id})" class="btn btn-xs btn-outline">-</button>
                        <span class="text-center">${item.quantity}</span>
                        <button onclick="increaseQuantity(${item.id})" class="btn btn-xs btn-outline">+</button>
                    </div>
                </div>
                <span class="text-lg font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
            `;

            cartList.appendChild(itemElement);
            total += item.price * item.quantity;
        });

        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

function updateCartIconCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartCountElement.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.classList.toggle('hidden', cart.length === 0);
    } else {
        console.error('Cart count element not found');
    }
}

// Call this on page load to initialize the count

function increaseQuantity(itemId) {
    modifyCartQuantity(itemId, 1);
}

function decreaseQuantity(itemId) {
    modifyCartQuantity(itemId, -1);
}

function modifyCartQuantity(itemId, change) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;

        // Remove item if quantity becomes 0 or less
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }

        // Update local storage and reload cart items
        localStorage.setItem('cart', JSON.stringify(cart));

        // Only reload the items inside the cart box without closing it
        loadCartItems();
        updateCartIconCount(); // Update icon count
        location.reload();
    }
}