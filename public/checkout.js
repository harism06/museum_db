document.addEventListener('DOMContentLoaded', async function () {
    loadCheckoutCart();
    applyDiscountIfMember();
    checkAccess(0);
});

const baseURL = 'https://museum-db-2.onrender.com' || 'http://localhost:3000';

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


function loadCheckoutCart() {
    console.log("Loading checkout cart...");
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartSummary = document.getElementById('cart-summary');
    const cartTotal = document.getElementById('cart-total-front');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    // Log to check element existence
    console.log("cartSummary:", cartSummary);
    console.log("cartTotal:", cartTotal);
    console.log("emptyCartMessage:", emptyCartMessage);

    if (!cartSummary || !cartTotal || !emptyCartMessage) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    cartSummary.innerHTML = ''; // Clear previous items

    if (cartItems.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartTotal.textContent = '$0.00';
    } else {
        emptyCartMessage.style.display = 'none';
        let total = 0;

        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('flex', 'justify-between', 'items-center', 'p-2', 'border-b', 'border-gray-700');

            itemElement.innerHTML = `
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-sm text-gray-400">Qty: ${item.quantity}</p>
                </div>
                <span class="text-lg font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
            `;

            cartSummary.appendChild(itemElement);
            total += item.price * item.quantity; // Add item total to the overall total
        });

        // Update the total display with the calculated amount
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}


async function applyDiscountIfMember() {
    try {
        console.log("Starting applyDiscountIfMember function");

        const token = localStorage.getItem('authToken');
        console.log("Token retrieved:", token);

        const response = await fetch(`${baseURL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Attach token in Authorization header
            }
        });

        console.log("Profile fetch response status:", response.status);

        if (response.ok) {
            const profile = await response.json();
            console.log("Profile data fetched successfully:", profile);

            const membershipStart = profile.membershipStartDate ? new Date(profile.membershipStartDate) : null;
            const membershipEnd = profile.membershipEndDate ? new Date(profile.membershipEndDate) : null;
            const now = new Date();
            const isMember = membershipStart && (!membershipEnd || membershipEnd >= now);
            console.log("Is user a member?", isMember);

            let originalTotal = parseFloat(document.getElementById('cart-total-front').innerText.replace('$', ''));
            let memberDiscountAmount = 0;
            let finalTotal = originalTotal;

            if (isMember) {
                memberDiscountAmount = originalTotal * 0.07; // 7% discount
                finalTotal = originalTotal - memberDiscountAmount;

                // Show the member discount section
                document.getElementById('member-discount-section').style.display = 'flex';
                document.getElementById('member-discount-amount').textContent = `-$${memberDiscountAmount.toFixed(2)}`;
            }

            // Update the final total display with the calculated amount after member discount
            document.getElementById('final-total').textContent = `$${finalTotal.toFixed(2)}`;

            // Store the final total in a global variable to be used by the discount code
            window.finalTotalBeforeCode = finalTotal;
        } else {
            console.error('Failed to fetch profile information.');
        }
    } catch (error) {
        console.error('Error applying discount:', error);
    }
}

async function applyDiscountCode() {
    const discountCode = document.getElementById('discount-code').value.trim();
    let codeDiscountAmount = 0;
    let finalTotal = window.finalTotalBeforeCode || parseFloat(document.getElementById('cart-total-front').innerText.replace('$', ''));

    try {
        // Fetch the token from local storage (if needed for authorization)
        const token = localStorage.getItem('authToken');

        // Make a request to validate the discount code
        const response = await fetch(`${baseURL}/api/validate-discount-code/${discountCode}/${visitorID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid or expired discount code.');
        }

        // Parse the response
        const discountData = await response.json();
        console.log("Discount data:", discountData);

        // Calculate the discount based on the returned percent
        codeDiscountAmount = finalTotal * (discountData.percent / 100);
        finalTotal -= codeDiscountAmount;

        // Show the discount code section
        document.getElementById('code-discount-section').style.display = 'flex';
        document.getElementById('code-discount-amount').textContent = `-$${codeDiscountAmount.toFixed(2)}`;

        // Update the final total display
        document.getElementById('final-total').textContent = `$${finalTotal.toFixed(2)}`;
    } catch (error) {
        console.error('Error applying discount code:', error);
        alert("Invalid or expired discount code.");
    }
}

async function submitOrder() {
    try {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const finalTotal = parseFloat(document.getElementById('final-total').innerText.replace('$', ''));

        console.log("Cart items:", cartItems);
        console.log("Final total:", finalTotal);

        if (cartItems.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const token = localStorage.getItem('authToken');
        console.log("Auth token:", token);

        // Extract membership item from the cart, if present
        const membershipItem = cartItems.find(item => item.category === 'Membership');
        let membershipStartDate = null;
        let membershipEndDate = null;

        if (membershipItem) {
            // Check if the user is already a member
            let memberResponse;
            try {
                memberResponse = await fetch(`${baseURL}/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (fetchError) {
                console.error("Error fetching user profile:", fetchError);
                alert("Unable to fetch user profile. Please try again.");
                return;
            }

            if (memberResponse.ok) {
                const profileData = await memberResponse.json();
                console.log("Profile data:", profileData);

                const currentMembershipEndDate = profileData.membershipEndDate
                    ? new Date(profileData.membershipEndDate)
                    : null;

                const today = new Date();

                // If the user is already a member, extend the current end date
                if (currentMembershipEndDate && currentMembershipEndDate >= today) {
                    membershipStartDate = currentMembershipEndDate;
                    membershipEndDate = new Date(currentMembershipEndDate);
                } else {
                    // If the user is not a current member, start membership today
                    membershipStartDate = today;
                    membershipEndDate = new Date(today);
                }

                console.log("Current membership end date (before update):", membershipEndDate.toISOString().split('T')[0]);

                membershipEndDate.setMonth(
                    membershipEndDate.getMonth() + membershipItem.quantity
                );
                
                console.log("Updated membership end date (after update):", membershipEndDate.toISOString().split('T')[0]);
                
            } else {
                console.error("Failed to fetch profile data:", await memberResponse.json());
                alert("Unable to determine membership status. Please try again.");
                return;
            }
        }

        // Prepare the transaction data
        const transactionData = {
            totalPrice: finalTotal,
            items: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: item.category || 'General',
                date: item.date || null, // Ensure date is included
                status: item.status || 'Active', // Include ticket status if applicable
            })),
        };
        

        console.log("Payload being sent to the endpoint:", JSON.stringify(transactionData, null, 2));


        let response;
        try {
            response = await fetch(`${baseURL}/api/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(transactionData),
            });
        } catch (fetchError) {
            console.error("Fetch request error:", fetchError);
            alert("Network error occurred while submitting your order. Please try again.");
            return;
        }

        console.log("Response Status:", response.status);

        const responseData = await response.json();
        console.log("Response Data:", responseData);

        if (response.ok) {
            // Update membership in the backend if membership was part of the order
            if (membershipItem) {
                try {
                    const membershipResponse = await fetch(`${baseURL}/auth/membership`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            membership_start_date: membershipStartDate.toISOString().split('T')[0],
                            membership_end_date: membershipEndDate.toISOString().split('T')[0],
                        }),
                    });
        
                    if (membershipResponse.ok) {
                        console.log("Membership updated successfully!");
                    } else {
                        const membershipErrorResponse = await membershipResponse.json();
                        console.error("Error updating membership:", membershipErrorResponse);
                        alert("Order submitted, but membership update failed. Please contact support.");
                    }
                } catch (membershipError) {
                    console.error("Error updating membership:", membershipError);
                    alert("Order submitted, but an error occurred while updating membership.");
                }
            }
        
            // Clear the cart and reload checkout
            localStorage.removeItem('cart');
            loadCheckoutCart();
            alert('Order submitted successfully!');
            location.reload();
        } else {
            console.error("Error Response Data:", responseData);
            alert("An error occurred while submitting your order. Please try again.");
        }
        
    } catch (error) {
        console.error("Error submitting order:", error);
        alert("An unexpected error occurred while submitting your order. Please try again.");
    }
}


