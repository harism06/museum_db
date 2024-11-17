        // Set the minimum date for the custom date input to today
        function setMinDate() {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD
            document.getElementById('date').setAttribute('min', formattedDate);
        }
    
        // Call the function when the page loads
        window.onload = setMinDate;
    
        function formatDate(date) {
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        
        // Set the selected date and update UI accordingly
        function setDate(option) {
            const today = new Date();
            let selectedDate;
        
            // Determine the date based on the selected option
            if (option === 'today') {
                selectedDate = today;
                document.getElementById('customDateInput').classList.add('hidden'); // Hide custom date input
            } else if (option === 'tomorrow') {
                selectedDate = new Date(today);
                selectedDate.setDate(today.getDate() + 1);
                document.getElementById('customDateInput').classList.add('hidden'); // Hide custom date input
            } else if (option === 'custom') {
                document.getElementById('customDateInput').classList.remove('hidden'); // Show custom date input
                const customDateValue = document.getElementById('date').value;
                if (customDateValue) {
                    selectedDate = new Date(customDateValue);
                }
            }
        
            // If a valid date is selected, update the displayed date
            if (selectedDate && !isNaN(selectedDate)) {
                document.getElementById('selectedDateText').innerText = formatDate(selectedDate);
            }
        
            // Update button styles to show the selected state
            document.querySelectorAll('.date-btn').forEach(btn => btn.classList.remove('bg-gray-600'));
            document.getElementById(option + 'Btn').classList.add('bg-gray-600');
        }
        // Increment the ticket count
    function incrementCount(ticketType) {
        const countElement = document.getElementById(`${ticketType}Count`);
        let currentCount = parseInt(countElement.innerText, 10);
        currentCount++;
        countElement.innerText = currentCount;
    }
    
    // Decrement the ticket count (ensure it doesn't go below zero)
    function decrementCount(ticketType) {
        const countElement = document.getElementById(`${ticketType}Count`);
        let currentCount = parseInt(countElement.innerText, 10);
        if (currentCount > 0) {
            currentCount--;
            countElement.innerText = currentCount;
        }
    }
    
    function addToCart() {
        const token = localStorage.getItem('authToken'); // Check if the user is logged in
    
        // If not logged in, show the login modal
        if (!token) {
            document.getElementById('login-modal').classList.remove('hidden');
            return;
        }
    
        const cart = [];
    
        // Retrieve counts for each ticket type
        const adultCount = parseInt(document.getElementById('adultCount').innerText, 10) || 0;
        const childCount = parseInt(document.getElementById('childCount').innerText, 10) || 0;
        const studentCount = parseInt(document.getElementById('studentCount').innerText, 10) || 0;
        const seniorCount = parseInt(document.getElementById('seniorCount').innerText, 10) || 0;
    
        // Get the selected date
        const today = new Date();
        const selectedDate = document.getElementById('date').value || today.toISOString().split('T')[0]; // Use custom or today's date
    
        // Validate the date and ticket quantities
        if (!selectedDate) {
            alert('Please select a valid date.');
            return;
        }
    
        if (adultCount <= 0 && childCount <= 0 && studentCount <= 0 && seniorCount <= 0) {
            alert('Please select at least one ticket to add to the cart.');
            return;
        }
    
        // Add tickets to the cart if the count is greater than 0
        if (adultCount > 0) {
            cart.push({
                name: 'Adult Admission',
                price: 30.00,
                quantity: adultCount,
                type: 'Adult',
                date: selectedDate,
                status: 'Active'
            });
        }
        if (childCount > 0) {
            cart.push({
                name: 'Child Admission',
                price: 0.00,
                quantity: childCount,
                type: 'Child',
                date: selectedDate,
                status: 'Active'
            });
        }
        if (studentCount > 0) {
            cart.push({
                name: 'Student Admission',
                price: 17.00,
                quantity: studentCount,
                type: 'Student',
                date: selectedDate,
                status: 'Active'
            });
        }
        if (seniorCount > 0) {
            cart.push({
                name: 'Senior Admission',
                price: 22.00,
                quantity: seniorCount,
                type: 'Senior',
                date: selectedDate,
                status: 'Active'
            });
        }
    
        // Save the cart to localStorage (or send to backend)
        localStorage.setItem('cart', JSON.stringify(cart));
    
        // Provide feedback to the user
        alert('Tickets added to cart!');
        console.log('Cart:', cart);
    
        location.reload();
    }
    