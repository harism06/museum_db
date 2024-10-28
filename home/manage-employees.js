document.addEventListener('DOMContentLoaded', () => {
    checkAccessAndLoadData();
});

async function checkAccessAndLoadData() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('You must be logged in to access this page.');
        window.location.href = "home.html";
        return;
    }

    try {
        // Fetch the profile information first to get the user's role
        const profileResponse = await fetch('http://localhost:3000/auth/profile', {
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

        // Fetch and display employee data if the user has the required role
        const response = await fetch('http://localhost:3000/api/employees', {
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
        displayEmployees(data);
    } catch (error) {
        console.error('Error fetching employee data:', error);
        alert('An error occurred. Please try again later.');
    }
}

function displayEmployees(data) {
    const container = document.createElement('div');
    container.classList.add('container', 'mx-auto', 'p-6', 'bg-gray-800', 'text-gray-200', 'rounded-lg', 'shadow-lg');

    const title = document.createElement('h2');
    title.classList.add('text-3xl', 'font-bold', 'mb-4', 'text-center');
    title.textContent = 'Manage Employees';
    container.appendChild(title);

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-gray-700', 'text-left', 'rounded-lg', 'overflow-hidden', 'shadow-md');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-gray-600">
            <th class="px-4 py-2 border-b">ID</th>
            <th class="px-4 py-2 border-b">Name</th>
            <th class="px-4 py-2 border-b">Email</th>
            <th class="px-4 py-2 border-b">Birthdate</th>
            <th class="px-4 py-2 border-b">Phone Number</th>
            <th class="px-4 py-2 border-b">Creation Date</th>
            <th class="px-4 py-2 border-b">Position</th>
            <th class="px-4 py-2 border-b">Actions</th>
        </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    data.forEach(employee => {
        const birthdateFormatted = formatDate(employee.BirthDate);
        const createdAtFormatted = formatDate(employee.created_at);
        const position = translateRoleCode(employee.role);

        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-600');

        row.innerHTML = `
            <td class="px-4 py-2 border-b">${employee.VisitorID}</td>
            <td class="px-4 py-2 border-b" id="name-${employee.VisitorID}">${employee.Name}</td>
            <td class="px-4 py-2 border-b" id="email-${employee.VisitorID}">${employee.Email}</td>
            <td class="px-4 py-2 border-b" id="birthdate-${employee.VisitorID}">${birthdateFormatted || 'N/A'}</td>
            <td class="px-4 py-2 border-b" id="phone-${employee.VisitorID}">${employee.PhoneNum}</td>
            <td class="px-4 py-2 border-b" id="created-at-${employee.VisitorID}">${createdAtFormatted}</td>
            <td class="px-4 py-2 border-b" id="position-${employee.VisitorID}">${position}</td>
            <td class="px-4 py-2 border-b">
                <button class="btn btn-primary" onclick="editEmployee(${employee.VisitorID})">Edit</button>
                <button class="btn btn-success hidden" id="save-btn-${employee.VisitorID}" onclick="saveEmployee(${employee.VisitorID})">Save</button>
            </td>`;

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    document.body.appendChild(container);
}

function editEmployee(visitorId) {
    // Get the row elements for the given visitor ID
    const nameCell = document.getElementById(`name-${visitorId}`);
    const emailCell = document.getElementById(`email-${visitorId}`);
    const birthdateCell = document.getElementById(`birthdate-${visitorId}`);
    const phoneCell = document.getElementById(`phone-${visitorId}`);
    const positionCell = document.getElementById(`position-${visitorId}`);
    const saveButton = document.getElementById(`save-btn-${visitorId}`);
    const editButton = document.querySelector(`button[onclick="editEmployee(${visitorId})"]`);

    // Check if the fields are currently editable
    const isEditing = saveButton.classList.contains('hidden') === false;

    if (isEditing) {
        // Revert to non-editable state
        nameCell.textContent = nameCell.querySelector('input').value;
        emailCell.textContent = emailCell.querySelector('input').value;
        birthdateCell.textContent = formatDate(birthdateCell.querySelector('input').value);
        phoneCell.textContent = phoneCell.querySelector('input').value;
        positionCell.textContent = translateRoleCode(positionCell.querySelector('select').value);

        // Hide the save button and show the edit button
        saveButton.classList.add('hidden');
        editButton.textContent = 'Edit';
    } else {
        // Replace the cell contents with input elements for editing
        nameCell.innerHTML = `<input type="text" value="${nameCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;
        emailCell.innerHTML = `<input type="email" value="${emailCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;
        birthdateCell.innerHTML = `<input type="date" value="${birthdateCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;
        phoneCell.innerHTML = `<input type="tel" value="${phoneCell.textContent}" class="input input-bordered bg-gray-600 text-white" />`;

        // Get the current role and create a dropdown for selecting the position (role)
        const currentRole = positionCell.textContent.trim();
        const roleDropdown = `
            <select class="input input-bordered bg-gray-600 text-white">
                <option value="1" ${currentRole === 'Employee' ? 'selected' : ''}>Employee</option>
                <option value="2" ${currentRole === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
                <option value="3" ${currentRole === 'Manager' ? 'selected' : ''}>Manager</option>
            </select>`;
        positionCell.innerHTML = roleDropdown;

        // Show the save button and change the edit button text to "Cancel"
        saveButton.classList.remove('hidden');
        editButton.textContent = 'Cancel';
    }
}

function translateRoleCode(roleCode) {
    switch (parseInt(roleCode)) {
        case 1: return 'Employee';
        case 2: return 'Supervisor';
        case 3: return 'Manager';
        default: return 'Unknown';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for date inputs
}

async function saveEmployee(visitorId) {
    const name = document.querySelector(`#name-${visitorId} input`).value;
    const email = document.querySelector(`#email-${visitorId} input`).value;
    const birthdate = document.querySelector(`#birthdate-${visitorId} input`).value;
    const phone = document.querySelector(`#phone-${visitorId} input`).value;
    const role = document.querySelector(`#position-${visitorId} select`).value;

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`http://localhost:3000/api/update-employee/${visitorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                email,
                birthdate,
                phone,
                role
            })
        });

        if (response.ok) {
            alert('Employee details updated successfully.');
            location.reload(); // Reload the page or update the UI accordingly
        } else {
            alert('Failed to update employee details.');
        }
    } catch (error) {
        console.error('Error updating employee details:', error);
        alert('An error occurred. Please try again later.');
    }
}

