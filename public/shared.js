// Declare a global variable to hold the visitor ID
let visitorID;
let baseURL = 'https://museum-db-2.onrender.com' || 'http://localhost:3000';
// Function to check profile status (to be called on DOM load in each page)
document.addEventListener('DOMContentLoaded', async function () {
    checkProfileStatus();
});

// Function to check login status and toggle profile button visibility
async function checkProfileStatus() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.log('No token found in localStorage');
        document.getElementById('login-link').classList.remove('hidden');
        document.getElementById('profile-btn').classList.add('hidden');
        document.getElementById('add-membership-btn').classList.add('hidden');
        document.getElementById('edit-employee-btn').classList.add('hidden');
        document.getElementById('notification-bell').classList.add('hidden'); // Hide notification bell
        console.log('Login link is now visible, and profile button and notification bell are hidden.');
        return;
    }

    try {
        const response = await fetch(`${baseURL}/auth/profile`, {
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
            console.log('Profile button and notification bell are now visible, and login link is hidden.');

            // Check user role and display Add Membership and Edit Employee buttons accordingly
            if (result.role !== undefined) {
                console.log(`User role: ${result.role}`);
                if (result.role >= 1) { // Display "Manage Members" for roles 1 or higher
                    document.getElementById('add-membership-btn').classList.remove('hidden');
                    console.log('Add Membership button is now visible.');

                    if (result.role >= 2) { // Display "Manage Employees" for roles 2 or higher
                        document.getElementById('edit-employee-btn').classList.remove('hidden');
                        console.log('Edit Employee button is now visible.');
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
            console.log('Login link is now visible, and profile button and notification bell are hidden.');
        }
    } catch (error) {
        console.error('Error verifying login status:', error);
        document.getElementById('login-link').classList.remove('hidden');
        document.getElementById('profile-btn').classList.add('hidden');
        document.getElementById('add-membership-btn').classList.add('hidden');
        document.getElementById('edit-employee-btn').classList.add('hidden');
        document.getElementById('notification-bell').classList.add('hidden'); // Hide notification bell
        console.log('Login link is now visible, and profile button and notification bell are hidden due to error.');
    }
}

// Function to toggle the profile menu
async function toggleProfileMenu() {
    const profileMenu = document.getElementById('profile-menu');
    const overlay = document.getElementById('overlay');

    if (profileMenu.classList.contains('translate-x-full')) {
        // Open the profile menu
        profileMenu.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');

        // Fetch and populate user data
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${baseURL}/auth/profile`, {
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
        const response = await fetch(`${baseURL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Attach token in Authorization header
            },
            body: JSON.stringify({ name, age, birthdate, email, phoneNumber, visitorID }) // Send all fields
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
        const response = await fetch(`${baseURL}/api/notifications?visitorID=${visitorID}`, {
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
window.onclick = function (event) {
    const overlay = document.getElementById('overlay');
    const profileMenu = document.getElementById('profile-menu');

    // Check if the click is outside the profile menu overlay
    if (event.target === overlay && profileMenu && !profileMenu.classList.contains('translate-x-full')) {
        profileMenu.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
};

// Close notification box when clicking outside of it
document.addEventListener('click', function (event) {
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
        const response = await fetch(`${baseURL}/api/notifications/check/${notificationId}`, {
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
