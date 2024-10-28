document.addEventListener('DOMContentLoaded', async function () {
    checkProfileStatus();
});

// Function to check login status
// Function to check login status
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

            // Check user role and display Add Membership button accordingly
            if (result.role !== undefined) {
                console.log(`User role: ${result.role}`);
                if (result.role >= 1) { // Assuming 1 or higher is an employee role
                    document.getElementById('add-membership-btn').classList.remove('hidden');
                    console.log('Add Membership button is now visible.');
                    if(result.role >= 2) {
                        document.getElementById('edit-employee-btn').classList.remove('hidden');
                        console.log('Edit Employee button is now visible.');
                    } else {
                        console.log("User is not high enough role to see Edit Employee Button");
                    }
                } else {
                    console.log('User does not have a high enough role to see the Add Membership button.');
                }
            } else {
                console.log('User role is not defined in the response.');
            }
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


// Function to open the modal
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

    // Reset the form visibility
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.classList.remove('hidden');
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.classList.add('hidden');
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

// Close modal when clicking outside of it
window.onclick = function (event) {
    const modal = document.getElementById('login-modal');
    const overlay = document.getElementById('overlay');
    const profileMenu = document.getElementById('profile-menu');

    // Check if the click is outside the login modal
    if (event.target === modal) {
        closeModal();
    }

    // Check if the click is outside the profile menu overlay
    if (event.target === overlay && profileMenu && !profileMenu.classList.contains('translate-x-full')) {
        closeModal();
    }
}

let visitorID; // Declare a global variable to hold the visitor ID

// Toggle Profile Menu and Fetch User Data
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

document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
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
document.getElementById('register-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const birthdate = document.getElementById('birthdate').value;
    const phoneNumber = document.getElementById('phone').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, age, birthdate, phoneNumber, email, password})
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

// Sign Out Function
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
