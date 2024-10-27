// backend.js
require('dotenv').config(); // To load environment variables
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database'); // Import the database connection

const secretKey = process.env.JWT_SECRET_KEY || 'default_secret_key';
const router = express.Router();

// Registration endpoint
router.post('/auth/register', async (req, res) => {
    try {
        const { name, age, birthdate, phoneNumber, email, password } = req.body;

        // Basic validation checks
        if (!name || !age || !birthdate || !phoneNumber || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const checkEmailQuery = 'SELECT * FROM visitor WHERE Email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (results.length > 0) {
                return res.status(409).json({ message: 'Email already registered' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into visitor table
            const visitorQuery = `
                INSERT INTO visitor (Name, Age, BirthDate, Email, PhoneNum, membership_start_date, membership_end_date)
                VALUES (?, ?, ?, ?, ?, NULL, NULL);
            `;
            const visitorParams = [name, age, birthdate, email, phoneNumber];

            db.query(visitorQuery, visitorParams, (err, visitorResults) => {
                if (err) {
                    console.error('Error inserting into visitor table:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                const visitorID = visitorResults.insertId;

                // Insert into credentials table using visitorID
                const credentialsQuery = `
                    INSERT INTO credentials (email, password, visitorid) VALUES (?, ?, ?);
                `;
                db.query(credentialsQuery, [email, hashedPassword, visitorID], (err, credentialsResults) => {
                    if (err) {
                        console.error('Error inserting into credentials table:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }

                    return res.status(201).json({ message: 'Registration successful' });
                });
            });
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Login Endpoint
router.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if email exists in the database
    const checkEmailQuery = 'SELECT * FROM credentials WHERE email = ?';
    db.query(checkEmailQuery, [email], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];

        // Compare the hashed password with the provided password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user.visitorid, email: user.email }, secretKey, {
            expiresIn: '1h' // Token will expire in 1 hour
        });

        // Return the token in the response body instead of setting it in a cookie
        return res.status(200).json({ token, message: 'Login successful' });
    });
});


// Middleware to authenticate a user using the token in cookies
function authenticateToken(req, res, next) {
    // Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get the token after "Bearer"

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.status(403).json({ message: 'Invalid token.' });
        }

        // Attach the decoded user information to the request
        req.user = user;
        next();
    });
}


// Logout Endpoint
router.post('/auth/logout', (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logout successful' });
});

// Profile Endpoint to fetch user details along with role
router.get('/auth/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId; // Retrieved from the decoded token

    // Query to get visitor details along with role
    const combinedQuery = `
        SELECT v.VisitorID, v.Name, v.Age, v.BirthDate, v.Email, v.PhoneNum, v.created_at, c.role
        FROM visitor v
        JOIN credentials c ON v.VisitorID = c.visitorid
        WHERE v.VisitorID = ?;
    `;

    // Execute the combined query
    db.query(combinedQuery, [userId], (error, results) => {
        if (error) {
            console.error('Error retrieving profile information:', error);
            return res.status(500).json({ message: 'Error retrieving profile information' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];

        // Return combined response with visitor information and role
        return res.status(200).json({
            visitorID: user.VisitorID,
            name: user.Name,
            age: user.Age,
            birthdate: user.BirthDate,
            email: user.Email,
            phoneNumber: user.PhoneNum,
            createdAt: user.created_at,
            role: user.role // Ensure the role is included in the response
        });
    });
});


// Fetch all visitor memberships for employees
router.get('/api/memberships', authenticateToken, (req, res) => {
    // Only allow access if the role is 1 or higher
    if (req.user.role < 1) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    // Fetch data from the 'visitor_information' view
    const query = `SELECT * FROM visitor_information;`;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching visitor memberships:', error);
            return res.status(500).json({ message: 'Server error' });
        }
        return res.status(200).json(results);
    });
});

// Update Membership Date Endpoint
router.put('/api/update-membership/:visitorID', authenticateToken, (req, res) => {
    const visitorID = req.params.visitorID;
    const { membership_start_date, membership_end_date } = req.body;

    // Only allow access if the role is 1 or higher
    if (req.user.role < 1) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    // Check if both dates are provided
    if (!membership_start_date || !membership_end_date) {
        return res.status(400).json({ message: 'Both membership start and end dates are required.' });
    }

    const updateQuery = `
        UPDATE visitor 
        SET membership_start_date = ?, membership_end_date = ? 
        WHERE VisitorID = ?;
    `;

    db.query(updateQuery, [membership_start_date, membership_end_date, visitorID], (error, results) => {
        if (error) {
            console.error('Error updating membership dates:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        return res.status(200).json({ message: 'Membership dates updated successfully.' });
    });
});

// Staff Registration endpoint
router.post('/auth/register-staff', async (req, res) => {
    try {
        const { name, email, password, phoneNumber, age, birthdate, role } = req.body;

        // Basic validation checks
        if (!name || !email || !password || !phoneNumber || !age || !birthdate || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate role and map it to the correct code
        let roleCode;
        if (role === 'Employee') {
            roleCode = 1;
        } else if (role === 'Supervisor') {
            roleCode = 2;
        } else if (role === 'Manager') {
            roleCode = 3;
        } else {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if email already exists in the visitor table (to avoid duplicates)
        const checkEmailQuery = 'SELECT * FROM visitor WHERE Email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (results.length > 0) {
                return res.status(409).json({ message: 'Email already registered' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into visitor table
            const visitorQuery = `
                INSERT INTO visitor (Name, Age, birthdate, email, PhoneNum, membership_start_date, membership_end_date)
                VALUES (?, ?, ?, ?, ?, NULL, NULL);
            `;
            const visitorParams = [name, age, birthdate, email, phoneNumber];

            db.query(visitorQuery, visitorParams, (err, visitorResults) => {
                if (err) {
                    console.error('Error inserting into visitor table:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                const visitorID = visitorResults.insertId;

                // Insert into credentials table using visitorID
                const credentialsQuery = `
                    INSERT INTO credentials (email, password, visitorid, role)
                    VALUES (?, ?, ?, ?);
                `;
                db.query(credentialsQuery, [email, hashedPassword, visitorID, roleCode], (err, credentialsResults) => {
                    if (err) {
                        console.error('Error inserting into credentials table:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }

                    return res.status(201).json({ message: 'Staff registration successful' });
                });
            });
        });
    } catch (error) {
        console.error('Error during staff registration:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;
