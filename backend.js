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

// Update Visitor Information Endpoint
router.put('/api/update-visitor/:visitorID', authenticateToken, (req, res) => {
    const visitorID = req.params.visitorID;
    const { phoneNumber, birthdate, membership_start_date, membership_end_date } = req.body;

    // Only allow access if the role is 1 or higher
    if (req.user.role < 1) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    // Validate input
    if (!phoneNumber || !birthdate || !membership_start_date || !membership_end_date) {
        return res.status(400).json({ message: 'All fields are required for updating visitor information.' });
    }

    // Update visitor details in the database
    const updateVisitorQuery = `
        UPDATE visitor 
        SET 
            birthdate = ?, 
            PhoneNum = ?, 
            membership_start_date = ?, 
            membership_end_date = ? 
        WHERE VisitorID = ?;
    `;

    db.query(updateVisitorQuery, [birthdate, phoneNumber, membership_start_date, membership_end_date, visitorID], (visitorError, visitorResults) => {
        if (visitorError) {
            console.error('Error updating visitor information:', visitorError);
            return res.status(500).json({ message: 'Server error' });
        }

        return res.status(200).json({ message: 'Visitor information updated successfully.' });
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

// Employee Endpoint to fetch employees
router.get('/api/employees', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 1 or higher (e.g., employee, supervisor, manager)
    if (req.user.role < 1) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    // Query the employee_view to get the list of employees
    const employeeQuery = `SELECT * FROM employee_view`;

    db.query(employeeQuery, (error, results) => {
        if (error) {
            console.error('Error fetching employees:', error);
            return res.status(500).json({ message: 'Server error' });
        }
        return res.status(200).json(results);
    });
});


// Deletion endpoint for removing an employee
router.delete('/api/remove-employee/:visitorId', authenticateToken, (req, res) => {
    const visitorId = req.params.visitorId;

    // Check if the role of the user is high enough to perform deletions (e.g., Supervisor or Manager)
    if (req.user.role < 2) {  // Assuming role 2 or higher (Supervisor or Manager) can delete employees
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
    }

    // Query to delete the employee from the visitor and credentials tables
    const deleteVisitorQuery = 'DELETE FROM visitor WHERE VisitorID = ?';
    const deleteCredentialsQuery = 'DELETE FROM credentials WHERE visitorid = ?';

    // Perform the deletion in the credentials table first (to avoid foreign key issues)
    db.query(deleteCredentialsQuery, [visitorId], (err, credentialsResults) => {
        if (err) {
            console.error('Error deleting from credentials table:', err);
            return res.status(500).json({ message: 'Server error while deleting credentials' });
        }

        // Delete from the visitor table
        db.query(deleteVisitorQuery, [visitorId], (err, visitorResults) => {
            if (err) {
                console.error('Error deleting from visitor table:', err);
                return res.status(500).json({ message: 'Server error while deleting visitor' });
            }

            return res.status(200).json({ message: 'Employee removed successfully' });
        });
    });
});


// Update Profile Endpoint
router.put('/auth/profile', authenticateToken, (req, res) => {
    const { name, email, phoneNumber, age, birthdate, visitorID } = req.body;

    // Validate that all fields are provided
    if (!name || !email || !phoneNumber || !age || !birthdate || !visitorID) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Step 1: Check if the new email already exists in the credentials table
    const emailCheckQuery = 'SELECT * FROM credentials WHERE email = ? AND visitorid != ?';
    db.query(emailCheckQuery, [email, visitorID], (emailError, emailResults) => {
        if (emailError) {
            console.error('Error checking email:', emailError);
            return res.status(500).json({ message: 'Server error' });
        }

        if (emailResults.length > 0) {
            // If email already exists for another visitor, return a conflict response
            return res.status(409).json({ message: 'Email already in use'});
        }

        // Step 2: If email is not already taken, update the visitor and credentials tables
        const updateVisitorQuery = `
            UPDATE visitor 
            SET Name = ?, Email = ?, PhoneNum = ?, Age = ?, birthdate = ?
            WHERE VisitorID = ?;
        `;

        db.query(updateVisitorQuery, [name, email, phoneNumber, age, birthdate, visitorID], (visitorError, visitorResults) => {
            if (visitorError) {
                console.error('Error updating visitor profile:', visitorError);
                return res.status(500).json({ message: 'Server error' });
            }

            if (visitorResults.affectedRows === 0) {
                return res.status(404).json({ message: 'Visitor not found or no changes made.' });
            }

            // Step 3: Update the credentials table with the new email if the visitor update is successful
            const updateCredentialsQuery = `
                UPDATE credentials 
                SET email = ?
                WHERE visitorid = ?;
            `;

            db.query(updateCredentialsQuery, [email, visitorID], (credentialsError, credentialsResults) => {
                if (credentialsError) {
                    console.error('Error updating credentials:', credentialsError);
                    return res.status(500).json({ message: 'Server error' });
                }

                return res.status(200).json({ message: 'Profile and credentials updated successfully.' });
            });
        });
    });
});

// Update Employee Information Endpoint
router.put('/api/update-employee/:visitorId', authenticateToken, (req, res) => {
    const { visitorId } = req.params;
    const { name, email, phoneNumber, age, birthdate, role } = req.body;

    // Only allow access if the role is Supervisor (2) or Manager (3)
    if (req.user.role < 2) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to update employee information.' });
    }

    // Validate input fields
    if (!name || !email || !phoneNumber || !birthdate || !role) {
        return res.status(400).json({ message: 'All fields are required for updating employee information.' });
    }

    // Step 1: Check if the new email already exists for another user
    const emailCheckQuery = 'SELECT * FROM credentials WHERE email = ? AND visitorid != ?';
    db.query(emailCheckQuery, [email, visitorId], (emailError, emailResults) => {
        if (emailError) {
            console.error('Error checking email:', emailError);
            return res.status(500).json({ message: 'Server error while checking email' });
        }

        if (emailResults.length > 0) {
            return res.status(409).json({ message: 'Email already in use by another user.' });
        }

        // Step 2: If email is not taken, update the visitor and credentials tables
        const updateVisitorQuery = `
            UPDATE visitor 
            SET Name = ?, Email = ?, PhoneNum = ?, Age = ?, birthdate = ?
            WHERE VisitorID = ?;
        `;

        db.query(updateVisitorQuery, [name, email, phoneNumber, age, birthdate, visitorId], (visitorError, visitorResults) => {
            if (visitorError) {
                console.error('Error updating visitor profile:', visitorError);
                return res.status(500).json({ message: 'Server error while updating visitor profile' });
            }

            if (visitorResults.affectedRows === 0) {
                return res.status(404).json({ message: 'Visitor not found or no changes made.' });
            }

            // Step 3: Update the role in the credentials table
            const updateCredentialsQuery = `
                UPDATE credentials 
                SET email = ?, role = ?
                WHERE visitorid = ?;
            `;

            db.query(updateCredentialsQuery, [email, role, visitorId], (credentialsError, credentialsResults) => {
                if (credentialsError) {
                    console.error('Error updating credentials:', credentialsError);
                    return res.status(500).json({ message: 'Server error while updating credentials' });
                }

                return res.status(200).json({ message: 'Employee information updated successfully.' });
            });
        });
    });
});



module.exports = router;
