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
        const response = await fetch('http://localhost:3000/api/memberships', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            alert('You do not have permission to access this page.');
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
    title.textContent = 'Manage Visitor Memberships';
    container.appendChild(title);

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-gray-700', 'text-left', 'rounded-lg', 'overflow-hidden', 'shadow-md');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-gray-600">
            <th class="px-4 py-2 border-b">Visitor ID</th>
            <th class="px-4 py-2 border-b">Name</th>
            <th class="px-4 py-2 border-b">Email</th>
            <th class="px-4 py-2 border-b">Membership Start Date</th>
            <th class="px-4 py-2 border-b">Membership End Date</th>
            <th class="px-4 py-2 border-b">Actions</th>
        </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    data.forEach(visitor => {
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-600');
        
        const startDateFormatted = formatDate(visitor.membership_start_date);
        const endDateFormatted = formatDate(visitor.membership_end_date);

        row.innerHTML = `
            <td class="px-4 py-2 border-b">${visitor.VisitorID}</td>
            <td class="px-4 py-2 border-b">${visitor.Name}</td>
            <td class="px-4 py-2 border-b">${visitor.Email}</td>
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
    return date.toLocaleDateString('en-US'); // Format the date as MM/DD/YYYY
}

function editMembership(visitorId) {
    const startDateCell = document.getElementById(`start-date-${visitorId}`);
    const endDateCell = document.getElementById(`end-date-${visitorId}`);
    const saveButton = document.getElementById(`save-btn-${visitorId}`);

    // Store the current values
    const currentStartDate = startDateCell.textContent;
    const currentEndDate = endDateCell.textContent;

    // Create input fields for editing
    startDateCell.innerHTML = `<input type="date" value="${currentStartDate === 'N/A' ? '' : currentStartDate}" class="input input-bordered bg-gray-600 text-white" />`;
    endDateCell.innerHTML = `<input type="date" value="${currentEndDate === 'N/A' ? '' : currentEndDate}" class="input input-bordered bg-gray-600 text-white" />`;

    // Show the save button
    saveButton.classList.remove('hidden');
}

async function saveMembership(visitorId) {
    const startDateInput = document.querySelector(`#start-date-${visitorId} input`).value;
    const endDateInput = document.querySelector(`#end-date-${visitorId} input`).value;

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`http://localhost:3000/api/update-membership/${visitorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                membership_start_date: startDateInput,
                membership_end_date: endDateInput
            })
        });

        if (response.ok) {
            alert('Membership updated successfully.');
            // Reload the page or update the UI accordingly
            location.reload();
        } else {
            alert('Failed to update membership.');
        }
    } catch (error) {
        console.error('Error updating membership:', error);
        alert('An error occurred. Please try again later.');
    }
}
