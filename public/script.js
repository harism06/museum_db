document.addEventListener('DOMContentLoaded', async function () {
    checkProfileStatus();
});

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
            body: JSON.stringify({ name, age, birthdate, phoneNumber, email, password })
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
