document.addEventListener('DOMContentLoaded', async function () {
  checkAccess(3);
});

async function checkAccess(requiredRole = 0, redirectURL = "home.html") {
  const token = localStorage.getItem('authToken');

  if (!token) {
      alert('You must be logged in to access this page.');
      window.location.href = redirectURL;
      return false; // Ensure further code execution stops
  }

  try {
      // Fetch the profile information to get the user's role
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
          window.location.href = redirectURL;
          return false;
      }

      // Check if the user's role meets the required role level
      if (profileData.role < requiredRole) {
          alert('You do not have access to this page.');
          window.location.href = redirectURL;
          return false;
      }

      // Return true if access is granted
      return true;
  } catch (error) {
      console.error('Error checking access:', error);
      alert('An error occurred. Please try again later.');
      window.location.href = redirectURL;
      return false;
  }
}

const baseURL = "https://museum-db-2.onrender.com"; // Update to your server's base URL


// Function to load the transactions report
async function loadTransactionsReport() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    const visitorID = document.getElementById("visitor-id-2").value;
    console.log(visitorID);
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const itemName = document.getElementById("item-name").value;
    const sortBy = document.getElementById("sort-by").value;
    const order = document.getElementById("order").value;
    const limit = document.getElementById("limit").value;
    const offset = document.getElementById("offset").value;

    const queryParams = new URLSearchParams({
      ...(visitorID && { visitorID }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(itemName && { itemName }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
      ...(limit && { limit }),
      ...(offset && { offset }),
    }).toString();

    console.log("Visitor ID being sent:", visitorID);

    const response = await fetch(`${baseURL}/reports/transactions?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch the report:", response);
      alert("Could not fetch the transactions report.");
      return;
    }

    const data = await response.json();
    console.log("Report Data:", data);

    populateReportData(data.data || []);
  } catch (error) {
    console.error("Error loading transactions report:", error);
    alert("An error occurred while loading the report.");
  }
}

function populateReportData(reportData) {
  const reportContainer = document.getElementById("report-columns");
  reportContainer.innerHTML = ""; // Clear existing data

  if (reportData.length === 0) {
    reportContainer.innerHTML = "<p class='text-gray-400'>No data available.</p>";
    return;
  }

  // Create a header row
  const headerRow = `
    <div class="col-span-3 grid grid-cols-6 gap-2 font-semibold bg-gray-600 p-2 rounded">
      <span>Visitor Name</span>
      <span>Visitor ID</span>
      <span>Item Name</span>
      <span>Price</span>
      <span>Quantity</span>
      <span>Date</span>
    </div>`;
  reportContainer.innerHTML += headerRow;

  // Format the date
  const formatDate = (isoDate) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(new Date(isoDate));
  };

  // Initialize summary variables
  let totalPrice = 0;
  let totalQuantity = 0;
  let uniqueVisitors = new Set();
  let dateRange = { earliest: null, latest: null };

  // Populate data rows
  reportData.forEach((row) => {
    const formattedDate = formatDate(row.transaction_date);

    totalPrice += row.item_price * row.item_quantity; // Calculate total revenue
    totalQuantity += row.item_quantity; // Calculate total quantity
    uniqueVisitors.add(row.visitor_id); // Add to unique visitor set

    const transactionDate = new Date(row.transaction_date);
    if (!dateRange.earliest || transactionDate < dateRange.earliest) {
      dateRange.earliest = transactionDate;
    }
    if (!dateRange.latest || transactionDate > dateRange.latest) {
      dateRange.latest = transactionDate;
    }

    const dataRow = `
      <div class="col-span-3 grid grid-cols-6 gap-2 bg-gray-700 p-2 rounded hover:bg-gray-600">
        <span>${row.visitor_name}</span>
        <span>${row.visitor_id}</span>
        <span>${row.item_name}</span>
        <span>$${row.item_price.toFixed(2)}</span>
        <span>${row.item_quantity}</span>
        <span>${formattedDate}</span>
      </div>`;
    reportContainer.innerHTML += dataRow;
  });

  // Add a summary row
  const formattedEarliestDate = dateRange.earliest
    ? formatDate(dateRange.earliest.toISOString())
    : "N/A";
  const formattedLatestDate = dateRange.latest
    ? formatDate(dateRange.latest.toISOString())
    : "N/A";

  const summaryRow = `
    <div class="col-span-3 grid grid-cols-6 gap-2 font-semibold bg-gray-600 p-2 rounded mt-4">
      <span>Total Unique Visitors: ${uniqueVisitors.size}</span>
      <span>Total Rows: ${reportData.length}</span>
      <span>Total Items: ${totalQuantity}</span>
      <span>Total Revenue: $${totalPrice.toFixed(2)}</span>
      <span></span>
      <span>Date Range: ${formattedEarliestDate} - ${formattedLatestDate}</span>
    </div>`;
  reportContainer.innerHTML += summaryRow;
}

async function loadMuseumItemsReport() {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("You are not logged in.");
            return;
        }

        // Collect filter values
        const yearCreated = document.getElementById("year-created").value;
        const medium = document.getElementById("medium").value;
        const artistName = document.getElementById("artist-name")?.value; // Optional
        const galleryID = document.getElementById("gallery-id")?.value; // Optional
        const minValue = document.getElementById("min-value")?.value; // Optional
        const maxValue = document.getElementById("max-value")?.value; // Optional
        const sortBy = document.getElementById("museum-sort-by")?.value; // Sorting column
        const order = document.getElementById("museum-order")?.value; // Sort order

        // Build query parameters
        const queryParams = new URLSearchParams({
            ...(yearCreated && { yearCreated }),
            ...(medium && { medium }),
            ...(artistName && { artistName }),
            ...(galleryID && { galleryID }),
            ...(minValue && { minValue }),
            ...(maxValue && { maxValue }),
            ...(sortBy && { sortBy }),
            ...(order && { order }),
        }).toString();

        const response = await fetch(`${baseURL}/reports/museumItems?${queryParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch the museum items report:", response);
            alert("Could not fetch the museum items report.");
            return;
        }

        const data = await response.json();
        console.log("Museum Items Report Data:", data);

        populateMuseumItemsData(data.data || []);
    } catch (error) {
        console.error("Error loading museum items report:", error);
        alert("An error occurred while loading the report.");
    }
}

function populateMuseumItemsData(reportData) {
    const reportContainer = document.getElementById("report-columns");
    reportContainer.innerHTML = ""; // Clear existing data

    if (reportData.length === 0) {
        reportContainer.innerHTML = "<p class='text-gray-400'>No data available.</p>";
        return;
    }

    // Create a header row
    const headerRow = `
        <div class="col-span-3 grid grid-cols-8 gap-2 font-semibold bg-gray-600 p-2 rounded">
            <span>Artist Name</span>
            <span>Title</span>
            <span>Year Created</span>
            <span>Artist ID</span>
            <span>Gallery ID</span>
            <span>Value</span>
            <span>Medium</span>
            <span>Dimensions</span>
        </div>`;
    reportContainer.innerHTML += headerRow;

    // Initialize summary variables
    let totalArtworks = 0;
    let totalValue = 0;
    let uniqueArtists = new Set();
    let earliestYear = null;
    let latestYear = null;

    // Populate data rows
    reportData.forEach((row) => {
        totalArtworks++;
        totalValue += row.artwork_value; // Sum of artwork values
        uniqueArtists.add(row.artist_name); // Count unique artists

        // Track earliest and latest creation years
        const yearCreated = parseInt(row.year_created, 10);
        if (!earliestYear || yearCreated < earliestYear) earliestYear = yearCreated;
        if (!latestYear || yearCreated > latestYear) latestYear = yearCreated;

        const dataRow = `
            <div class="col-span-3 grid grid-cols-8 gap-2 bg-gray-700 p-2 rounded hover:bg-gray-600">
                <span>${row.artist_name}</span>
                <span>${row.artwork_title}</span>
                <span>${row.year_created}</span>
                <span>${row.artist_id}</span>
                <span>${row.gallery_id}</span>
                <span>$${row.artwork_value.toFixed(2)}</span>
                <span>${row.artwork_medium}</span>
                <span>${row.artwork_dimensions}</span>
            </div>`;
        reportContainer.innerHTML += dataRow;
    });

    // Add a summary row
    const summaryRow = `
        <div class="col-span-3 grid grid-cols-8 gap-2 font-semibold bg-gray-600 p-2 rounded mt-4">
            <span>Total Unique Artists: ${uniqueArtists.size}</span>
            <span>Total Artworks: ${totalArtworks}</span>
            <span>Year Range: ${earliestYear || "N/A"} - ${latestYear || "N/A"}</span>
            <span></span>
            <span></span>
            <span>Total Value: $${totalValue.toFixed(2)}</span>
            <span></span>
            <span></span>
        </div>`;
    reportContainer.innerHTML += summaryRow;
}
async function loadDemographicsReport() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    const childAge = parseInt(document.getElementById("child-age-threshold").value, 10) || 17;
    const adultAge = parseInt(document.getElementById("adult-age-threshold").value, 10) || 64;

    if (childAge < 0 || adultAge < childAge) {
      alert("Please enter valid age thresholds where Child Age < Adult Age and both are non-negative.");
      return;
    }

    const queryParams = new URLSearchParams({ childAge, adultAge }).toString();
    const apiUrl = `${baseURL}/reports/demographics?${queryParams}`;
    const reportContainer = document.getElementById("report-columns");

    reportContainer.innerHTML = "<p class='text-gray-400'>Loading...</p>";

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch the demographics report:", response.statusText);
      alert(`Could not fetch the demographics report. Status: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    populateDemographicsData(data.data || []);
  } catch (error) {
    console.error("Error loading demographics report:", error);
    alert("An error occurred while loading the report.");
  }
}



function populateDemographicsData(reportData) {
  const reportContainer = document.getElementById("report-columns");
  reportContainer.innerHTML = ""; // Clear existing data

  if (reportData.length === 0) {
    reportContainer.innerHTML = "<p class='text-gray-400'>No data available.</p>";
    return;
  }

  // Create a header row
  const headerRow = `
    <div class="col-span-3 grid grid-cols-4 gap-2 font-semibold bg-gray-600 p-2 rounded">
      <span>Age Group</span>
      <span>Active Members</span>
      <span>Non-Members</span>
      <span>Ticket Sales</span>
    </div>`;
  reportContainer.innerHTML += headerRow;

  // Initialize summary variables
  let totalActiveMembers = 0;
  let totalNonMembers = 0;
  let totalTicketSales = 0;

  // Populate data rows dynamically based on response keys
  reportData.forEach((row, index) => {
    console.log(`Row ${index + 1}:`, row); // Debugging log for each row

    // Aggregate totals
    totalActiveMembers += row.active_members || 0;
    totalNonMembers += row.non_members || 0;
    totalTicketSales += row.ticket_sales || 0;

    // Add individual data row
    const dataRow = `
      <div class="col-span-3 grid grid-cols-4 gap-2 bg-gray-700 p-2 rounded hover:bg-gray-600">
        <span>${row.demographic || "N/A"}</span>
        <span>${row.active_members || 0}</span>
        <span>${row.non_members || 0}</span>
        <span>${row.ticket_sales || 0}</span>
      </div>`;
    reportContainer.innerHTML += dataRow;
  });

  // Add a summary row at the end
  const summaryRow = `
    <div class="col-span-3 grid grid-cols-4 gap-2 font-semibold bg-gray-600 p-2 rounded mt-4">
      <span>Total</span>
      <span>${totalActiveMembers}</span>
      <span>${totalNonMembers}</span>
      <span>${totalTicketSales}</span>
    </div>`;
  reportContainer.innerHTML += summaryRow;
}



function showFilters(reportType) {
  // Hide all filters initially
  document.getElementById("transaction-filters").classList.add("hidden");
  document.getElementById("museum-item-filters").classList.add("hidden");
  document.getElementById("demographics-filters").classList.add("hidden");

  // Show the selected report type filters
  if (reportType === "transactions") {
    document.getElementById("transaction-filters").classList.remove("hidden");
  } else if (reportType === "museumItems") {
    document.getElementById("museum-item-filters").classList.remove("hidden");
  } else if (reportType === "demographics") {
    document.getElementById("demographics-filters").classList.remove("hidden");
  }
}
 