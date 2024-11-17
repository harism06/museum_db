document.addEventListener("DOMContentLoaded", () => {
    // Fetch and display events
    fetchEvents();
    // Fetch and display exhibitions
    fetchExhibitions();
});

let baseURL = 'https://museum-db-2.onrender.com' || 'http://localhost:3000';

function fetchEvents() {
    fetch(`${baseURL}/api/events`)
        .then(response => response.json())
        .then(events => {
            const eventsContainer = document.getElementById('events-container');
            eventsContainer.innerHTML = '';
            events.forEach(event => {
                const eventCard = createEventCard(event);
                eventsContainer.appendChild(eventCard);
            });
        })
        .catch(error => console.error('Error fetching events:', error));
}

function fetchExhibitions() {
    fetch(`${baseURL}/api/exhibitions`)
        .then(response => response.json())
        .then(exhibitions => {
            const exhibitionsContainer = document.getElementById('exhibitions-container');
            exhibitionsContainer.innerHTML = '';
            exhibitions.forEach(exhibition => {
                const exhibitionCard = createExhibitionCard(exhibition);
                exhibitionsContainer.appendChild(exhibitionCard);
            });
        })
        .catch(error => console.error('Error fetching exhibitions:', error));
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg shadow-lg w-64 card flex-shrink-0 overflow-hidden transition-all duration-300';

    // Event Image Placeholder
    const eventImage = event.image || 'images/product_placeholder.jpg'; // Replace 'event-image.jpg' with a default or fetched image URL

    card.innerHTML = `
        <img src="${eventImage}" alt="${event.Name}" class="w-full h-36 object-cover" />
        <div class="p-4">
            <h3 class="text-lg font-bold text-white mb-1">${event.Name}</h3>
            <p class="text-sm text-gray-400 mb-2">${formatDate(event.Date, event.Time)}</p>
            <button class="btn btn-outline mt-4 text-sm w-full" onclick="openCardModal(this.closest('.card'), '${event.EventID}', '${event.description}')">View More</button>
        </div>
    `;

    return card;
}

function createExhibitionCard(exhibition) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg shadow-lg w-64 card flex-shrink-0 overflow-hidden transition-all duration-300';

    // Exhibition Image Placeholder
    const exhibitionImage = exhibition.image || 'images/product_placeholder.jpg'; // Replace 'exhibition-image.jpg' with a default or fetched image URL

    card.innerHTML = `
        <img src="${exhibitionImage}" alt="${exhibition.Name}" class="w-full h-36 object-cover" />
        <div class="p-4">
            <h3 class="text-lg font-bold text-white mb-1">${exhibition.Name}</h3>
            <p class="text-sm text-gray-400 mb-2">${formatDate(exhibition.StartDate)} - ${formatDate(exhibition.EndDate)}</p>
            <button class="btn btn-outline mt-4 text-sm w-full" onclick="openCardModal(this.closest('.card'), '${exhibition.ExhibitionID}', '${exhibition.Description}')">View More</button>
        </div>
    `;

    return card;
}


function formatDate(dateString, timeString = '') {
    try {
        // Parse the date string and format it with weekday
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString).toLocaleDateString(undefined, dateOptions);
        
        if (timeString) {
            // Parse and format the time if provided
            const time = new Date(`1970-01-01T${timeString}`).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
            });
            return `${date} at ${time}`;
        }

        return date;
    } catch (error) {
        console.error("Invalid date format:", error);
        return "Invalid Date";
    }
}

function openCardModal(cardElement, descriptionId, fullDescription) {
    // Create modal container for expanded card
    const modalContainer = document.createElement('div');
    modalContainer.classList.add('expanded-card-modal');

    // Add Name and Date
    const nameElement = document.createElement('div');
    nameElement.className = 'modal-name';
    nameElement.textContent = cardElement.querySelector('h3').textContent;

    const dateElement = document.createElement('div');
    dateElement.className = 'modal-date';
    dateElement.textContent = cardElement.querySelector('p').textContent;

    // Create Carousel (placeholder with arrows)
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    carousel.innerHTML = `
        <span class="carousel-arrow" onclick="alert('Previous image')">‹</span>
        <div class="carousel-placeholder">[Image Carousel]</div>
        <span class="carousel-arrow" onclick="alert('Next image')">›</span>
    `;

    // Create Description
    const description = document.createElement('div');
    description.className = 'modal-description';
    description.textContent = fullDescription;

    // Create Purchase Ticket button
    const purchaseButton = document.createElement('div');
    purchaseButton.className = 'purchase-button';
    purchaseButton.textContent = 'Purchase Ticket';
    purchaseButton.onclick = () => {
        alert('Redirecting to ticket purchase page...');
        // Optionally, redirect to a purchase page:
        // window.location.href = '/purchase-ticket-page';
    };

    // Append all elements to the modal container
    modalContainer.appendChild(nameElement);
    modalContainer.appendChild(dateElement);
    modalContainer.appendChild(carousel);
    modalContainer.appendChild(description);
    modalContainer.appendChild(purchaseButton);

    // Create and show the overlay
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = closeCardModal; // Close the modal when clicking outside
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';

    // Append the modal container to the body
    document.body.appendChild(modalContainer);

    // Display the modal
    modalContainer.style.display = 'block';
}

function closeCardModal() {
    // Remove the overlay
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    // Remove the modal container
    const expandedCard = document.querySelector('.expanded-card-modal');
    if (expandedCard) {
        expandedCard.remove();
    }
}
