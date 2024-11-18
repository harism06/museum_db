  const pricePerMonth = 10;

  function updatePrice() {
    const duration = parseInt(document.getElementById('membership-duration').value, 10) || 1;
    const totalPrice = Math.min(duration, 12) * pricePerMonth; // Limit to 12 months
    document.getElementById('total-price').innerText = `$${totalPrice}`;
  }

  function incrementDuration() {
    const durationElement = document.getElementById('membership-duration');
    let currentDuration = parseInt(durationElement.value, 10) || 1;
    if (currentDuration < 12) {
      currentDuration++;
      durationElement.value = currentDuration;
      updatePrice();
    }
  }

  function decrementDuration() {
    const durationElement = document.getElementById('membership-duration');
    let currentDuration = parseInt(durationElement.value, 10) || 1;
    if (currentDuration > 1) {
      currentDuration--;
      durationElement.value = currentDuration;
      updatePrice();
    }
  }

  function addMembershipToCart() {
    const token = localStorage.getItem('authToken'); // Check if the user is logged in

    // If not logged in, show the login modal
    if (!token) {
        document.getElementById('login-modal').classList.remove('hidden');
        return;
    }

    const durationElement = document.getElementById('membership-duration');
    const selectedDuration = parseInt(durationElement.value, 10);
    const totalPrice = selectedDuration * pricePerMonth;

    if (!selectedDuration || selectedDuration < 1 || selectedDuration > 12) {
        alert('Please select a duration between 1 and 12 months.');
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    cart.push({
        name: 'Museum Membership',
        quantity: selectedDuration, // Number of months as the quantity
        price: pricePerMonth, // Monthly price
        category: 'Membership',
        status: 'Active',
    });

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Membership added to cart!');
    console.log('Cart:', cart);
    location.reload();
}
