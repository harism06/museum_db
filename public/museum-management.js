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

        // Store the user's role for use in filtering employee data
        const userRole = profileData.role;

        // Check if the user has the necessary role (e.g., 1 or higher)
        if (userRole < 3) {
            window.location.href = "home.html";
            return;
        }

        // Fetch employee data if the user has the required role
        const response = await fetch(`${baseURL}/api/employees`, {
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

    } catch (error) {
        console.error('Error fetching employee data:', error);
        alert('An error occurred. Please try again later.');
    }
}


document.getElementById('view-button').addEventListener('click', async () => {
    const category = document.getElementById('category').value;
    
    // Make sure the user selected a category
    if (!category) {
        alert('Please select a category.');
        return;
    }

    // Check if the category selected is 'events'
    if (category === 'events') {
        // Call fetchEvents function to load events data
        fetchEvents();
    }

    else if (category === 'exhibitions') {
        fetchExhibitions();
    }

    else if (category === 'galleries') {
        fetchGallery();
    }

    else if(category === 'store') {
        fetchStoreItems();
    }
    
    else if(category === 'artists') {
        fetchArtists();
    }

    else if(category === 'artworks') {
        fetchArtworks();
    }
});

document.getElementById('add-button').addEventListener('click', () => {
    const category = document.getElementById('category').value;

    // Make sure the user selected a category
    if (!category) {
        alert('Please select a category.');
        return;
    }

    // Open the modal based on the selected category
    if (category === 'artworks') {
        openCardModalForNewItem('artwork');
    } else if (category === 'artists') {
        openCardModalForNewItem('artist');
    } else if (category === 'galleries') {
        openCardModalForNewItem('gallery');
    } else if (category === 'exhibitions') {
        openCardModalForNewItem('exhibition');
    } else if (category === 'events') {
        openCardModalForNewItem('event');
    } else if(category === 'store') {
        openCardModalForNewItem('storeitem');
    } else {
        alert('Invalid category selected.');
    }
});


function fetchArtworks() {
    fetch(`${baseURL}/api/artworks`)
        .then(response => response.json())
        .then(artworks => {
            const artworksContainer = document.getElementById('container');
            artworksContainer.innerHTML = ''; // Clear existing content
            artworks.forEach(artwork => {
                const artworkCard = createArtworkCard(artwork);
                artworksContainer.appendChild(artworkCard);
            });
        })
        .catch(error => console.error('Error fetching artworks:', error));
}


function fetchEvents() {
    fetch(`${baseURL}/api/events`)
        .then(response => response.json())
        .then(events => {
            const eventsContainer = document.getElementById('container');
            eventsContainer.innerHTML = '';
            events.forEach(event => {
                const eventCard = createEventCard(event);
                eventsContainer.appendChild(eventCard);
            });
        })
        .catch(error => console.error('Error fetching events:', error));
}

function fetchStoreItems() {
    fetch(`${baseURL}/api/storeitems`)
        .then(response => response.json())
        .then(storeItems => {
            const storeItemsContainer = document.getElementById('container');
            storeItemsContainer.innerHTML = '';
            storeItems.forEach(item => {
                const storeItemCard = createStoreItemCard(item);
                storeItemsContainer.appendChild(storeItemCard);
            });
        })
        .catch(error => console.error('Error fetching store items:', error));
}

function fetchArtists() {
    fetch(`${baseURL}/api/artists`)
        .then(response => response.json())
        .then(artists => {
            const artistsContainer = document.getElementById('container');
            artistsContainer.innerHTML = ''; // Clear existing content
            artists.forEach(artist => {
                const artistCard = createArtistCard(artist);
                artistsContainer.appendChild(artistCard);
            });
        })
        .catch(error => console.error('Error fetching artists:', error));
}

function fetchExhibitions() {
    fetch(`${baseURL}/api/exhibitions`)
        .then(response => response.json())
        .then(exhibitions => {
            const exhibitionsContainer = document.getElementById('container');
            exhibitionsContainer.innerHTML = '';
            exhibitions.forEach(exhibition => {
                const exhibitionCard = createExhibitionCard(exhibition);
                exhibitionsContainer.appendChild(exhibitionCard);
            });
        })
        .catch(error => console.error('Error fetching exhibitions:', error));
}

function fetchGallery() {
    fetch(`${baseURL}/api/galleries`)
        .then(response => response.json())
        .then(events => {
            const eventsContainer = document.getElementById('container');
            eventsContainer.innerHTML = '';
            events.forEach(event => {
                const eventCard = createGalleryCard(event);
                eventsContainer.appendChild(eventCard);
            });
        })
        .catch(error => console.error('Error fetching galleries:', error));
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'my-7 bg-gray-800 rounded-lg shadow-lg w-64 h-80 card flex-shrink-0 overflow-hidden transition-all duration-300 min-h-80';

    // Event Image Placeholder
    const eventImage = 'images/product_placeholder.jpg'; // Replace 'event-image.jpg' with a default or fetched image URL

    card.innerHTML = `
        <img src="${eventImage}" alt="${event.Name}" class="w-full h-36 object-cover" />
        <div class="p-2 flex flex-col justify-start h-full">
            <h3 class="text-lg font-bold text-white mb-1">${event.Name}</h3>
            <p class="text-sm text-gray-400 mb-2">${formatDate(event.Date, event.Time)}</p>
            <div class="flex justify-between mt-auto">
                <button class="btn btn-outline text-sm w-full" onclick="openCardModal([${event.EventID}, '${event.Name}', '${event.Date}', '${event.Time}', '${event.description}'], 'event')">View Details</button>
            </div>
        </div>
    `;

    return card;
}

function createArtworkCard(artwork) {
    const card = document.createElement('div');
    card.className = 'my-7 bg-gray-800 rounded-lg shadow-lg w-64 h-96 card flex-shrink-0 overflow-hidden transition-all duration-300 min-h-96';

    // Artwork Image Placeholder (You can modify this to load a real image if you have one)
    const artworkImage = 'images/product_placeholder.jpg'; // Placeholder for artwork image

    card.innerHTML = `
        <img src="${artworkImage}" alt="${artwork.Title}" class="w-full h-36 object-cover" />
        <div class="p-2 flex flex-col justify-start h-full">
            <h3 class="text-lg font-bold text-white mb-1">${artwork.Title}</h3>
            <p class="text-sm text-gray-400 mb-2">Artist: ${artwork.ArtistName}</p>
            <p class="text-sm text-gray-400 mb-2">Year Created: ${artwork.YearCreated}</p>
            <p class="text-sm text-gray-400 mb-2">Value: $${artwork.Value}</p>
            <p class="text-sm text-gray-400 mb-2">Dimensions: ${artwork.Dimensions}</p>
            <div class="flex justify-between mt-auto">
                <button class="btn btn-outline text-sm w-full" onclick="openCardModal([${artwork.ArtworkID}, '${artwork.Title}', '${artwork.YearCreated}', '${artwork.ArtistName}', '${artwork.Value}', '${artwork.Dimensions}'], 'artwork')">View Details</button>
            </div>
        </div>
    `;

    return card;
}


function createArtistCard(artist) {
    const card = document.createElement('div');
    card.className = 'my-7 bg-gray-800 rounded-lg shadow-lg w-64 h-80 card flex-shrink-0 overflow-hidden transition-all duration-300 min-h-80';

    // Artist Image Placeholder (You can modify this to load a real image if you have one)
    const artistImage = 'images/product_placeholder.jpg'; // Placeholder for artist image

    card.innerHTML = `
        <img src="${artistImage}" alt="${artist.Name}" class="w-full h-36 object-cover" />
        <div class="p-2 flex flex-col justify-start h-full">
            <h3 class="text-lg font-bold text-white mb-1">${artist.Name}</h3>
            <p class="text-sm text-gray-400 mb-2">Born: ${artist.BirthYear}</p>
            <p class="text-sm text-gray-400 mb-2">Country: ${artist.Country}</p>
            <div class="flex justify-between mt-auto">
                <button class="btn btn-outline text-sm w-full" onclick="openCardModal([${artist.ArtistID}, '${artist.Name}', '${artist.BirthYear}', '${artist.Country}'], 'artist')">View Details</button>
            </div>
        </div>
    `;

    return card;
}

function createStoreItemCard(storeItem) {
    const card = document.createElement('div');
    card.className = 'my-7 bg-gray-800 rounded-lg shadow-lg w-64 h-96 card flex-shrink-0 overflow-hidden transition-all duration-300 min-h-96';

    // Store Item Image Placeholder
    const storeItemImage = 'images/product_placeholder.jpg'; // Replace with a real image or placeholder

    card.innerHTML = `
        <img src="${storeItemImage}" alt="${storeItem.name}" class="w-full h-36 object-cover" />
        <div class="p-4 flex flex-col h-full">
            <h3 class="text-lg font-bold text-white mb-2">${storeItem.name}</h3>
            <p class="text-sm text-gray-400 mb-2">${storeItem.description}</p>
            <p class="text-sm text-gray-400 mb-2">Price: $${storeItem.price}</p>
            <p class="text-sm text-gray-400 mb-2">Category: ${storeItem.category}</p>
            <div class="flex justify-between mt-auto">
                <button class="btn btn-outline text-sm w-full" onclick="openCardModal([${storeItem.id}, '${storeItem.name}', '${storeItem.description}', ${storeItem.price}, '${storeItem.category}'], 'storeitem')">View Details</button>
            </div>
        </div>
    `;

    return card;
}



function createExhibitionCard(exhibition) {
    const card = document.createElement('div');
    card.className = 'my-7 bg-gray-800 rounded-lg shadow-lg w-64 h-96 card flex-shrink-0 overflow-hidden transition-all duration-300 min-h-96';

    // Exhibition Image Placeholder
    const exhibitionImage = exhibition.image || 'images/product_placeholder.jpg'; // Replace 'exhibition-image.jpg' with a default or fetched image URL

    card.innerHTML = `
        <img src="${exhibitionImage}" alt="${exhibition.Name}" class="w-full h-36 object-cover" />
        <div class="p-2 flex flex-col justify-between h-full">
            <h3 class="text-lg font-bold text-white mb-1">${exhibition.Name}</h3>
            <p class="text-sm text-gray-400 mb-2">${formatDate(exhibition.StartDate)} - ${formatDate(exhibition.EndDate)}</p>
            <div class="flex justify-between mt-auto">
                <button class="btn btn-outline text-sm w-full" onclick="openCardModal([${exhibition.ExhibitionID}, '${exhibition.Name}', '${exhibition.StartDate}', '${exhibition.EndDate}', '${exhibition.Description}'], 'exhibition')">View Details</button>
            </div>
        </div>
    `;

    return card;
}


function createGalleryCard(gallery) {
    const card = document.createElement('div');
    card.className = 'my-7 bg-gray-800 rounded-lg shadow-lg w-64 h-96 card flex-shrink-0 overflow-hidden transition-all duration-300 min-h-96';

    const galleryImage = 'images/product_placeholder.jpg';

    card.innerHTML = `
        <img src="${galleryImage}" alt="${gallery.Name}" class="w-full h-36 object-cover" />
        <div class="p-2 flex flex-col justify-between h-full">
            <h3 class="text-lg font-bold text-white mb-1">${gallery.Name}</h3>
            <p class="text-sm text-gray-400 mb-2">Floor: ${gallery.FloorNumber}, Capacity: ${gallery.Capacity}</p>
            <div class="flex justify-between mt-auto">
                <button class="btn btn-outline text-sm w-full" onclick="openCardModal([${gallery.GalleryID}, '${gallery.Name}', ${gallery.FloorNumber}, ${gallery.Capacity}], 'gallery')">View Details</button>
            </div>
        </div>
    `;

    return card;
}



function formatDate(dateString, timeString) {
    // Format date
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString).toLocaleDateString(undefined, options);

    // Format time
    const time = new Date(`1970-01-01T${timeString}`).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });

    return `${date} at ${time}`;
}

async function openCardModal(cardObject, cardType) {
    const modalContainer = document.createElement('div');
    modalContainer.classList.add('expanded-card-modal');

    // Define fields to be passed depending on the card type
    let fields = [];

    // Common field for all cards: Name
    const objectID = cardObject[0];
    const nameElement = createInputField('Name', 'modal-name-input', cardObject[1]);
    fields.push(nameElement);

    let galleriesData = [];


    const galleryResponse = await fetch(`${baseURL}/api/galleries`);
    if (galleryResponse.ok) {
        galleriesData =  await galleryResponse.json();
        console.log(galleriesData);  // Add this to see if the data is correct
    }
    // Determine fields based on cardType
    if (cardType === 'gallery') {
        const floorNumberElement = createInputField('Floor Number', 'modal-floor-number-input', cardObject[2]);
        const capacityElement = createInputField('Capacity', 'modal-capacity-input', cardObject[3]);
        fields.push(floorNumberElement, capacityElement);
    }

    if (cardType === 'exhibition') {
        fields.push(
            createInputField('Start Date', 'StartDate', formatDateforInput(cardObject[2])),
            createInputField('End Date', 'endDate', formatDateforInput(cardObject[3])),
            createDropdownField('Gallery', 'galleryID', galleriesData, 'GalleryID', 'Name'),
            createTextAreaField('Exhibition Description', 'description', cardObject[4])
        );
    }
    

    if (cardType === 'event') {
        fields.push(
            createInputField('Date', 'modal-date-input', formatDateforInput(cardObject[2])),
            createInputField('Time', 'modal-time-input', formatTime(cardObject[3])),
            createTextAreaField('Event Description', 'modal-description-input', cardObject[4]),
            createDropdownField('Gallery', 'galleryID', galleriesData, 'GalleryID', 'Name'),
        );
    }

    if (cardType === 'storeitem') {
        const descriptionElement = createTextAreaField('Description', 'modal-description-input', cardObject[2]);
        const priceElement = createInputField('Price', 'modal-price-input', cardObject[3]);
        const categoryElement = createInputField('Category', 'modal-category-input', cardObject[4]);
        fields.push(descriptionElement, priceElement, categoryElement);
    }

    if (cardType === 'artist') {
        const nameElement = createInputField('Name', 'modal-artist-name-input', cardObject[1]);
        const birthYearElement = createInputField('Birth Year', 'modal-artist-birthyear-input', cardObject[2]);
        const countryElement = createInputField('Country', 'modal-artist-country-input', cardObject[3]);
        fields.push(nameElement, birthYearElement, countryElement);
    }

    if (cardType === 'artwork') {
        const titleElement = createInputField('Title', 'modal-artwork-title-input', cardObject[1]);
        const yearCreatedElement = createInputField('Year Created', 'modal-artwork-yearcreated-input', cardObject[2]);
        const artistElement = createInputField('Artist Name', 'modal-artwork-artist-input', cardObject[3]);
        const valueElement = createInputField('Value ($)', 'modal-artwork-value-input', cardObject[4]);
        const dimensionsElement = createInputField('Dimensions', 'modal-artwork-dimensions-input', cardObject[5]);
    
        fields.push(titleElement, yearCreatedElement, artistElement, valueElement, dimensionsElement);
    }
    

    // Add Save Changes button and Remove button
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container flex justify-between mt-4';


    const removeButton = document.createElement('div');
    removeButton.innerHTML = `
        <button class="btn bg-red-500 text-white w-full hover:bg-red-700">Remove</button>
    `;
    removeButton.onclick = async () => {
        // Check if the event type is 'gallery' and make the DELETE request to remove the gallery
        if (cardType === 'gallery') {
            const galleryId = cardObject[0]; // Assuming the first element in the cardObject is the GalleryID
    
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${baseURL}/api/galleries/${galleryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });
    
                if (response.status === 200) {
                    alert('Gallery removed successfully!');
                    closeCardModal();
                    location.reload();
                    // Optionally, you can also refresh the gallery data or remove the gallery from the displayed list
                } else if (response.status === 403) {
                    alert('You do not have permission to delete this gallery.');
                } else {
                    alert('Failed to delete gallery. Please try again later.');
                }
            } catch (error) {
                console.error('Error removing gallery:', error);
                alert('An error occurred while deleting the gallery.');
            }
        }     else if (cardType === 'event') {
            const eventID = cardObject[0]; // Assuming the first element in the cardObject is the EventID
    
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${baseURL}/api/events/${eventID}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });
    
                if (response.status === 200) {
                    alert('Event removed successfully!');
                    closeCardModal();
                    location.reload(); // Refresh the page to reflect the deletion
                } else if (response.status === 403) {
                    alert('You do not have permission to delete this event.');
                } else {
                    alert('Failed to delete event. Please try again later.');
                }
            } catch (error) {
                console.error('Error removing event:', error);
                alert('An error occurred while deleting the event.');
            }
        } else if (cardType === 'artist') {
            const artistID = cardObject[0]; // Assuming the first element in the cardObject is the ArtistID
    
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${baseURL}/api/artists/${artistID}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });
    
                if (response.status === 200) {
                    alert('Artist removed successfully!');
                    closeCardModal();
                    location.reload(); // Refresh the page to reflect the deletion
                } else if (response.status === 403) {
                    alert('You do not have permission to delete this artist.');
                } else {
                    alert('Failed to delete artist. Please try again later.');
                }
            } catch (error) {
                console.error('Error removing artist:', error);
                alert('An error occurred while deleting the artist.');
            }
        } else if (cardType === 'artwork') {
            const artworkID = cardObject[0]; // Assuming the first element in the cardObject is the ArtworkID
    
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${baseURL}/api/artworks/${artworkID}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });
    
                if (response.status === 200) {
                    alert('Artwork removed successfully!');
                    closeCardModal();
                    location.reload(); // Refresh the page to reflect the deletion
                } else if (response.status === 403) {
                    alert('You do not have permission to delete this artwork.');
                } else {
                    alert('Failed to delete artwork. Please try again later.');
                }
            } catch (error) {
                console.error('Error removing artwork:', error);
                alert('An error occurred while deleting the artwork.');
            }
        }
    };
    

    buttonsContainer.appendChild(removeButton);

    // Append fields and the buttons container to the modal
    fields.forEach(field => modalContainer.appendChild(field));
    modalContainer.appendChild(buttonsContainer);

    // Create overlay and show modal
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = closeCardModal;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';

    document.body.appendChild(modalContainer);
    modalContainer.style.display = 'block';
}



function closeCardModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    const expandedCard = document.querySelector('.expanded-card-modal');
    if (expandedCard) {
        expandedCard.remove();
    }
}

function createInputField(label, id, value) {
    const container = document.createElement('div');
    container.className = 'modal-input mb-4';  // Add margin bottom
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;  // Ensure the name attribute is set
    input.value = value;
    input.className = 'input input-bordered w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'; // Tailwind styling for input

    container.innerHTML = `
        <label for="${id}" class="block text-sm font-medium text-gray-300">${label}</label>  <!-- Label styling -->
    `;
    container.appendChild(input);
    return container;
}


function formatDateforInput(dateString) {
    // Assuming dateString is in the format "YYYY-MM-DD" or any recognizable format
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);  // months are 0-based
    const day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`; // Adjust as per your desired format
}

function createTextAreaField(label, id, value) {
    const container = document.createElement('div');
    container.className = 'modal-textarea mb-4';  // Add margin bottom
    container.innerHTML = `
        <label for="${id}" class="block text-sm font-medium">${label}</label>
        <textarea id="${id}" name="${id}" class="textarea textarea-bordered w-full bg-gray-700 text-white" rows="4">${value}</textarea>
    `;
    return container;
}


function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date(1970, 0, 1, hours, minutes);  // Use a dummy date (Jan 1, 1970) to format the time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });  // Format to HH:mm
}

async function addStoreItem(storeItemData) {
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${baseURL}/api/storeitems`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(storeItemData) // Send store item data
        });

        const result = await response.json();

        if (response.status === 201) {
            alert('Store item added successfully!');
            closeCardModal(); // Close modal upon success
            location.reload(); // Optionally reload to reflect the new store item
        } else {
            alert(result.message || 'Failed to add store item. Please try again.');
        }
    } catch (error) {
        console.error('Error adding store item:', error);
        alert('An error occurred while adding the store item.');
    }
}

async function addExhibition(exhibitionData) {
    const token = localStorage.getItem('authToken');
    console.log(exhibitionData);
    try {
        const response = await fetch(`${baseURL}/api/exhibitions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(exhibitionData) // Send exhibition data
        });

        const result = await response.json();

        if (response.status === 201) {
            alert('Exhibition added successfully!');
            closeCardModal(); // Close modal upon success
            location.reload(); // Optionally reload to reflect the new exhibition
        } else {
            alert(result.message || 'Failed to add exhibition. Please try again.');
        }
    } catch (error) {
        console.error('Error adding exhibition:', error);
        alert('An error occurred while adding the exhibition.');
    }
}


async function addArtist(artistData) {

    console.log(artistData);
    const token = localStorage.getItem('authToken');
    
    console.log(artistData);
    try {
        const response = await fetch(`${baseURL}/api/artists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(artistData) // New artist data
        });

        const result = await response.json();

        if (response.status === 201) {
            alert('Artist added successfully!');
            // Optionally, you can also redirect or update the page to show the new artist.
        } else {
            alert(result.message || 'Failed to add artist.');
        }
    } catch (error) {
        console.error('Error adding artist:', error);
        alert('An error occurred while adding the artist.');
    }
}

async function addArtwork(artworkData) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${baseURL}/api/artworks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(artworkData) // New artwork data
        });

        const result = await response.json();

        if (response.status === 201) {
            alert('Artwork added successfully!');
            // Optionally, you can also redirect or update the page to show the new artwork.
        } else {
            alert(result.message || 'Failed to add artwork.');
        }
    } catch (error) {
        console.error('Error adding artwork:', error);
        alert('An error occurred while adding the artwork.');
    }
}


async function openCardModalForNewItem(cardType) {
    const modalContainer = document.createElement('div');
    modalContainer.classList.add('expanded-card-modal');

    let fields = [];

    // Fetch the foreign key data for dropdowns
    let artistsData = [];
    let galleriesData = [];

    try {
        const artistResponse = await fetch(`${baseURL}/api/artists`);
        if (artistResponse.ok) {
            artistsData = await artistResponse.json();
            console.log(artistsData);
        }

        const galleryResponse = await fetch(`${baseURL}/api/galleries`);
        if (galleryResponse.ok) {
            galleriesData = await galleryResponse.json();
            console.log(galleriesData);  // Add this to see if the data is correct
        }
    } catch (error) {
        console.error('Error fetching foreign key data:', error);
        alert('An error occurred while fetching required data.');
    }

    if (cardType === 'artwork') {
        fields.push(
            createInputField('Title', 'title', ''),
            createInputField('Year Created', 'yearCreated', ''),
            createDropdownField('Artist', 'artistID', artistsData, 'ArtistID', 'Name'),
            createDropdownField('Gallery', 'galleryID', galleriesData, 'GalleryID', 'Name'),
            createInputField('Value ($)', 'value', ''),
            createInputField('Dimensions', 'dimensions', ''),
            createInputField('Medium', 'medium', '')            
        );
    }
    
    if (cardType === 'artist') {
        fields.push(
            createInputField('Name', 'name', ''),
            createInputField('Birth Year', 'birthYear', ''),
            createInputField('Country', 'country', '')
        );
    }
    
    if (cardType === 'gallery') {
        fields.push(
            createInputField('Gallery Name', 'name', ''),
            createInputField('Floor Number', 'floorNumber', ''),
            createInputField('Capacity', 'capacity', '')
        );
    }
    
    if (cardType === 'exhibition') {
        fields.push(
            createInputField('Exhibition Name', 'name', ''),
            createDateInputField('Start Date', 'startDate', ''),
            createDateInputField('End Date', 'endDate', ''),
            createDropdownField('Gallery', 'galleryID', galleriesData, 'GalleryID', 'Name'),
            createTextAreaField('Description', 'description', '')
        );
    }
    
    if (cardType === 'event') {
        fields.push(
            createInputField('Event Name', 'name', ''),
            createDateInputField('Date', 'date', ''),
            createInputField('Time', 'time', ''),
            createDropdownField('Gallery', 'galleryID', galleriesData, 'GalleryID', 'Name'),
            createTextAreaField('Description', 'description', '')
        );
    }
    
    // Store Item
    if (cardType === 'storeitem') {
        fields.push(
            createInputField('Store Item Name', 'name', ''),
            createInputField('Price ($)', 'price', ''),
            createInputField('Category', 'category', ''),
            createTextAreaField('Description', 'description', '')
        );
    }

    // Add Save Changes button for new item creation
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container flex justify-between mt-4';

    const saveButton = document.createElement('div');
    saveButton.className = 'save-button';
    saveButton.innerHTML = `
        <button class="btn btn-primary w-full">Save New ${cardType.charAt(0).toUpperCase() + cardType.slice(1)}</button>
    `;
    saveButton.onclick = async () => {
        const data = {};
        fields.forEach(field => {
            const input = field.querySelector('input, select, textarea');
            data[input.name] = input.value;
        });
        console.log(data);

        // Check if the artist data needs to be sent to the addArtist function
        if (cardType === 'artist') {
            await addArtist(data);  // Use the addArtist function for saving artist
        } else if (cardType === 'artwork') {
            await addArtwork(data);
        } else if (cardType === 'exhibition') {
            await addExhibition(data);
        } else if (cardType === 'gallery') {
            await addGallery(data);
        } else if (cardType === 'storeitem') {
            await addStoreItem(data);
        } else if (cardType === 'event') {
            await addEvent(data);
        } else {
            alert("Please Choose A Valid Category");
        }
    };


    // Close button logic
    const removeButton = document.createElement('div');
    removeButton.innerHTML = `
        <button class="btn bg-red-500 text-white w-full hover:bg-red-700">Cancel</button>
    `;
    removeButton.onclick = closeCardModal;

    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(removeButton);

    // Append fields and the buttons container to the modal
    fields.forEach(field => modalContainer.appendChild(field));
    modalContainer.appendChild(buttonsContainer);

    // Create overlay and show modal
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = closeCardModal;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';

    document.body.appendChild(modalContainer);
    modalContainer.style.display = 'block';
}

function createDropdownField(label, id, data, valueField, textField) {
    const container = document.createElement('div');
    container.className = 'modal-input mb-4';  // Add margin bottom
    
    const dropdown = document.createElement('select');
    dropdown.id = id;
    dropdown.name = id;

    // Placeholder option for the dropdown
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `Select ${label}`;
    dropdown.appendChild(placeholder);

    // Loop through the data and create options dynamically
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];  // Set the value as the GalleryID
        option.textContent = item[textField];  // Display the Name (Gallery Name)
        dropdown.appendChild(option);
    });

    container.appendChild(dropdown);
    return container;
}

function createDateInputField(label, id, value) {
    const container = document.createElement('div');
    container.className = 'modal-input mb-4';
    
    const input = document.createElement('input');
    input.type = 'date';
    input.id = id;
    input.name = id;
    input.value = value;
    
    container.innerHTML = `
        <label for="${id}" class="block text-sm font-medium">${label}</label>
    `;
    container.appendChild(input);
    return container;
}

async function addEvent(eventData) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${baseURL}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData) // Send event data
        });

        const result = await response.json();

        if (response.status === 201) {
            alert('Event added successfully!');
            closeCardModal(); // Close modal upon success
            location.reload(); // Optionally reload to reflect the new event
        } else {
            alert(result.message || 'Failed to add event. Please try again.');
        }
    } catch (error) {
        console.error('Error adding event:', error);
        alert('An error occurred while adding the event.');
    }
}

async function addGallery(galleryData) {
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${baseURL}/api/galleries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(galleryData) // Send gallery data
        });

        const result = await response.json();

        if (response.status === 201) {
            alert('Gallery added successfully!');
            closeCardModal(); // Close modal upon success
            location.reload(); // Optionally reload to reflect the new gallery
        } else {
            alert(result.message || 'Failed to add gallery. Please try again.');
        }
    } catch (error) {
        console.error('Error adding gallery:', error);
        alert('An error occurred while adding the gallery.');
    }
}

