document.addEventListener('DOMContentLoaded', () => {
    checkAccessAndLoadData();
});

let baseURL = 'https://museum-db-2.onrender.com';

async function checkAccessAndLoadData() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('You must be logged in to access this page.');
        window.location.href = "home.html";
        return;
    }

    try {
        // Fetch the profile information first to get the user's role
        const profileResponse = await fetch(`${baseURL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
            alert('Failed to retrieve profile information.');
            window.location.href = "home.html";
            return;
        }

        // Check if the user has the necessary role (e.g., 1 or higher)
        if (profileData.role < 1) { 
            window.location.href = "home.html";
            return;
        }

        // Fetch and display membership data if the user has the required role
        const response = await fetch(`${baseURL}/api/memberships`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            window.location.href = "home.html";
            return;
        }

        const data = await response.json();
        displayMemberships(data);
    } catch (error) {
        console.error('Error fetching membership data:', error);
        alert('An error occurred. Please try again later.');
    }
}

function displayMemberships(data) {
    const container = document.createElement('div');
    container.classList.add('container', 'mx-auto', 'p-6', 'bg-gray-800', 'text-gray-200', 'rounded-lg', 'shadow-lg');

    const title = document.createElement('h2');
    title.classList.add('text-3xl', 'font-bold', 'mb-4', 'text-center');
    title.textContent = 'Manage Member Information';
    container.appendChild(title);

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-gray-700', 'text-left', 'rounded-lg', 'overflow-hidden', 'shadow-md');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-gray-600">
            <th class="px-4 py-2 border-b">ID</th>
            <th class="px-4 py-2 border-b">Name</th>
            <th class="px-4 py-2 border-b">Birthdate</th>
            <th class="px-4 py-2 border-b">Email</th>
            <th class="px-4 py-2 border-b">Phone Number</th>
            <th class="px-4 py-2 border-b">Membership Start Date</th>
            <th class="px-4 py-2 border-b">Membership End Date</th>
            <th class="px-4 py-2 border-b">Actions</th>
        </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    data.forEach(visitor => {
        const birthdateFormatted = formatDate(visitor.BirthDate);
        const startDateFormatted = formatDate(visitor.membership_start_date);
        const endDateFormatted = formatDate(visitor.membership_end_date);

        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-600');

        row.innerHTML = `
            <td class="px-4 py-2 border-b">${visitor.VisitorID}</td>
            <td class="px-4 py-2 border-b">${visitor.Name}</td>
            <td class="px-4 py-2 border-b" id="birthdate-${visitor.VisitorID}">${birthdateFormatted || 'N/A'}</td>
            <td class="px-4 py-2 border-b">${visitor.Email}</td>
            <td class="px-4 py-2 border-b" id="phone-${visitor.VisitorID}">${visitor.PhoneNum}</td>
            <td class="px-4 py-2 border-b" id="start-date-${visitor.VisitorID}">${startDateFormatted || 'N/A'}</td>
            <td class="px-4 py-2 border-b" id="end-date-${visitor.VisitorID}">${endDateFormatted || 'N/A'}</td>
            <td class="px-4 py-2 border-b">
                <button class="btn btn-primary" onclick="editMembership(${visitor.VisitorID})">Edit</button>
                <button class="btn btn-success hidden" id="save-btn-${visitor.VisitorID}" onclick="saveMembership(${visitor.VisitorID})">Save</button>
            </td>`;

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    document.body.appendChild(container);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for date inputs
}

function editMembership(visitorId) {
    // Get the row elements for the given visitor ID
    const birthdateCell = document.getElementById(`birthdate-${visitorId}`);
    const phoneCell = document.getElementById(`phone-${visitorId}`);
    const startDateCell = document.getElementById(`start-date-${visitorId}`);
    const endDateCell = document.getElementById(`end-date-${visitorId}`);
    const saveButton = document.getElementById(`save-btn-${visitorId}`);
    const editButton = document.querySelector(`button[onclick="editMembership(${visitorId})"]`);

    // Check if the fields are currently editable
    const isEditing = saveButton.classList.contains('hidden') === false;

    if (isEditing) {
        // Revert to non-editable state
        birthdateCell.textContent = formatDate(birthdateCell.querySelector('input').value) || 'N/A';
        phoneCell.textContent = phoneCell.querySelector('input').value;
        startDateCell.textContent = formatDate(startDateCell.querySelector('input').value) || 'N/A';
        endDateCell.textContent = formatDate(endDateCell.querySelector('input').value) || 'N/A';

        // Hide the save button and change the edit button text back to "Edit"
        saveButton.classList.add('hidden');
        editButton.textContent = 'Edit';
    } else {
        // Create input fields for editing
        birthdateCell.innerHTML = `<input type="date" value="${birthdateCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;
        phoneCell.innerHTML = `<input type="tel" value="${phoneCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;
        startDateCell.innerHTML = `<input type="date" value="${startDateCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;
        endDateCell.innerHTML = `<input type="date" value="${endDateCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;

        // Show the save button and change the edit button text to "Cancel"
        saveButton.classList.remove('hidden');
        editButton.textContent = 'Cancel';
    }
}

async function saveMembership(visitorId) {
    const birthdateInput = document.querySelector(`#birthdate-${visitorId} input`).value;
    const phoneInput = document.querySelector(`#phone-${visitorId} input`).value;
    const startDateInput = document.querySelector(`#start-date-${visitorId} input`).value;
    const endDateInput = document.querySelector(`#end-date-${visitorId} input`).value;

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${baseURL}/api/update-visitor/${visitorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                birthdate: birthdateInput,
                phoneNumber: phoneInput, // Matching the expected field name in the backend
                membership_start_date: startDateInput,
                membership_end_date: endDateInput
            })
        });

        if (response.ok) {
            alert('Visitor information updated successfully.');
            location.reload(); // Reload the page or update the UI accordingly
        } else {
            alert('Failed to update visitor information.');
        }
    } catch (error) {
        console.error('Error updating visitor information:', error);
        alert('An error occurred. Please try again later.');
    }
}
