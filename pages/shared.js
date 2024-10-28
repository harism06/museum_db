// Declare a global variable to hold the visitor ID
let visitorID;

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
        console.log('Login link is now visible and profile button is hidden.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/profile', {
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
            console.log('Profile button is now visible and login link is hidden.');
        } else {
            console.log('User not logged in or token invalid.');
            document.getElementById('login-link').classList.remove('hidden');
            document.getElementById('profile-btn').classList.add('hidden');
            console.log('Login link is now visible and profile button is hidden.');
        }
    } catch (error) {
        console.error('Error verifying login status:', error);
        document.getElementById('login-link').classList.remove('hidden');
        document.getElementById('profile-btn').classList.add('hidden');
        console.log('Login link is now visible and profile button is hidden due to error.');
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
            const response = await fetch('http://localhost:3000/auth/profile', {
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
        const response = await fetch(`http://localhost:3000/auth/profile`, {
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

// Close modal when clicking outside of it
window.onclick = function (event) {
    const overlay = document.getElementById('overlay');
    const profileMenu = document.getElementById('profile-menu');

    // Check if the click is outside the profile menu overlay
    if (event.target === overlay && profileMenu && !profileMenu.classList.contains('translate-x-full')) {
        profileMenu.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
};
