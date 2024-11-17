// backend.js
require('dotenv').config(); // To load environment variables
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const express = require('express');
const bcrypt = require('bcryptjs');
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

        // Update the lastLoggedIn field in the visitor table
        const updateLoginTimeQuery = 'UPDATE visitor SET lastLoggedIn = NOW() WHERE VisitorID = ?';
        db.query(updateLoginTimeQuery, [user.visitorid], (err) => {
            if (err) {
                console.error('Error updating last login time:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            // Generate a JWT token
            const token = jwt.sign({ userId: user.visitorid, email: user.email }, secretKey, {
                expiresIn: '1h' // Token will expire in 1 hour
            });

            // Return the token in the response body instead of setting it in a cookie
            return res.status(200).json({ token, message: 'Login successful' });
        });
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

    const combinedQuery = `
        SELECT v.VisitorID, v.Name, v.Age, v.BirthDate, v.Email, v.PhoneNum, v.created_at, v.membership_start_date, v.membership_end_date, c.role
        FROM visitor v
        JOIN credentials c ON v.VisitorID = c.visitorid
        WHERE v.VisitorID = ?;
    `;

    db.query(combinedQuery, [userId], (error, results) => {
        if (error) {
            console.error('Error retrieving profile information:', error);
            return res.status(500).json({ message: 'Error retrieving profile information' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];

        return res.status(200).json({
            visitorID: user.VisitorID,
            name: user.Name,
            age: user.Age,
            birthdate: user.BirthDate,
            email: user.Email,
            phoneNumber: user.PhoneNum,
            createdAt: user.created_at,
            membershipStartDate: user.membership_start_date,
            membershipEndDate: user.membership_end_date,
            role: user.role
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

router.get('/api/notifications', async (req, res) => {
    try {
        // Parse visitorID from the query parameters
        const visitorID = parseInt(req.query.visitorID, 10);

        // Validate parsed visitorID
        if (isNaN(visitorID)) {
            return res.status(400).json({ message: 'visitorID must be a valid number' });
        }

        // SQL query to fetch notifications for the visitor
        const query = `
            SELECT NotificationId, NotificationText, NotificationTime, IsCheck
            FROM notification
            WHERE visitorID = ? and IsCheck = 0
            ORDER BY NotificationTime DESC
        `;

        // Execute the query
        db.query(query, [visitorID], (error, results) => {
            if (error) {
                console.error('Error fetching notifications:', error);
                return res.status(500).json({ message: 'Server error' });
            }

            // If no notifications are found
            if (results.length === 0) {
                return res.status(200).json([]);
            }

            // Return the notifications
            return res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error in notifications endpoint:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


router.put('/api/notifications/check/:id', async (req, res) => {
    const notificationId = req.params.id;
    console.log(`Received request to mark notification as checked, ID: ${notificationId}`);

    // Check if the ID is valid
    if (!notificationId) {
        console.error('Notification ID is missing');
        return res.status(400).json({ message: 'Notification ID is required' });
    }

    try {
        // SQL query to update the notification
        const query = `UPDATE notification SET IsCheck = 1 WHERE NotificationId = ?`;
        console.log(`Executing query: ${query}, with ID: ${notificationId}`);

        db.query(query, [notificationId], (error, results) => {
            if (error) {
                console.error('Error updating notification:', error);
                return res.status(500).json({ message: 'Server error' });
            }

            if (results.affectedRows === 0) {
                console.warn('Notification not found or already checked:', notificationId);
                return res.status(404).json({ message: 'Notification not found' });
            }

            console.log(`Notification with ID: ${notificationId} marked as checked`);
            return res.status(200).json({ message: 'Notification marked as checked' });
        });
    } catch (error) {
        console.error('Error in checking notification endpoint:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/api/events', (req, res) => {
    const sql = 'SELECT * from event';
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }
      res.json(results);
    });
  });
  
  // Endpoint to fetch exhibitions
  router.get('/api/exhibitions', (req, res) => {
    const sql = 'SELECT * FROM exhibition';
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch exhibitions' });
      }
      res.json(results);
    });
  });

  router.get('/api/galleries', (req, res) => {
    const sql = 'SELECT * FROM gallery';
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch exhibitions' });
      }
      res.json(results);
    });
  });

  router.get('/api/storeitems', (req, res) => {
    const sql = 'SELECT * FROM storeitem';
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch items from store' });
      }
      res.json(results);
    });
  });

  router.get('/api/artists', (req, res) => {
    const sql = 'SELECT * FROM artist';
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch artists' });
      }
      res.json(results);
    });
  });

  router.get('/api/artworks', (req, res) => {
    const getArtworksQuery = `
        SELECT 
            artwork.ArtworkID,
            artwork.Title,
            artwork.YearCreated,
            artist.Name AS ArtistName,
            artwork.GalleryID,
            artwork.Value,
            artwork.Medium,
            artwork.Dimensions
        FROM 
            artwork
        JOIN 
            artist ON artwork.ArtistID = artist.ArtistID;
    `;

    db.query(getArtworksQuery, (error, results) => {
        if (error) {
            console.error('Error fetching artworks:', error);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(200).json(results);
    });
});



  router.delete('/api/galleries/:galleryId', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const galleryId = req.params.galleryId;

    // Query to delete the gallery from the database
    const deleteGalleryQuery = `DELETE FROM gallery WHERE galleryid = ?`;

    db.query(deleteGalleryQuery, [galleryId], (error, results) => {
        if (error) {
            console.error('Error deleting gallery:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Gallery not found' });
        }

        return res.status(200).json({ message: 'Gallery successfully deleted' });
    });
});

router.delete('/api/events/:eventID', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const eventID = req.params.eventID; // Correct variable name (eventID instead of galleryId)

    // Query to delete the event from the database
    const deleteEventQuery = `DELETE FROM event WHERE eventid = ?`;

    db.query(deleteEventQuery, [eventID], (error, results) => {
        if (error) {
            console.error('Error deleting event:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(200).json({ message: 'Event successfully deleted' });
    });
});

router.delete('/api/artists/:artistID', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const artistID = req.params.artistID;

    // Query to delete the artist from the database
    const deleteArtistQuery = `DELETE FROM artist WHERE ArtistID = ?`;

    db.query(deleteArtistQuery, [artistID], (error, results) => {
        if (error) {
            console.error('Error deleting artist:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        return res.status(200).json({ message: 'Artist successfully deleted' });
    });
});

router.post('/api/artists', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const { name, birthYear, country } = req.body;

    // Check if all required fields are provided
    if (!name || !birthYear || !country) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Query to insert a new artist into the database
    const insertArtistQuery = `
        INSERT INTO artist (Name, BirthYear, Country)
        VALUES (?, ?, ?)
    `;

    db.query(insertArtistQuery, [name, birthYear, country], (error, results) => {
        if (error) {
            console.error('Error inserting artist:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        return res.status(201).json({
            message: 'Artist successfully created',
            artistID: results.insertId // Return the ID of the newly created artist
        });
    });
});

// POST /api/artworks
router.post('/api/artworks', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const { title, yearCreated, artistID, galleryID, value, dimensions, medium } = req.body;

    // Check if all required fields are provided
    if (!title || !yearCreated || !artistID || !galleryID || !value || !dimensions || !medium) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Query to insert a new artwork into the database
    const insertArtworkQuery = `
        INSERT INTO artwork (Title, YearCreated, ArtistID, GalleryID, Value, Dimensions, Medium)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertArtworkQuery, [title, yearCreated, artistID, galleryID, value, dimensions, medium], (error, results) => {
        if (error) {
            console.error('Error inserting artwork:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        return res.status(201).json({
            message: 'Artwork successfully created',
            artworkID: results.insertId // Return the ID of the newly created artwork
        });
    });
});

// POST /api/exhibitions
router.post('/api/exhibitions', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const { name, startDate, endDate, galleryID, description } = req.body;

    // Check if all required fields are provided
    if (!name || !startDate || !endDate || !galleryID || !description) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Insert new exhibition into the database
        const insertExhibitionQuery = `
            INSERT INTO exhibition (Name, StartDate, EndDate, GalleryID, Description)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(insertExhibitionQuery, [name, startDate, endDate, galleryID, description], (error, results) => {
            if (error) {
                console.error('Error inserting exhibition:', error);
                return res.status(500).json({ message: 'An error occurred while adding the exhibition.' });
            }

            return res.status(201).json({
                message: 'Exhibition successfully added!',
                exhibitionID: results.insertId  // Return the ID of the newly created exhibition
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST /api/galleries
router.post('/api/galleries', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const { name, floorNumber, capacity } = req.body;

    // Check if all required fields are provided
    if (!name || !floorNumber || !capacity) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Query to insert a new gallery into the database
    const insertGalleryQuery = `
        INSERT INTO gallery (Name, FloorNumber, Capacity)
        VALUES (?, ?, ?)
    `;

    db.query(insertGalleryQuery, [name, floorNumber, capacity], (error, results) => {
        if (error) {
            console.error('Error inserting gallery:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        return res.status(201).json({
            message: 'Gallery successfully created',
            galleryID: results.insertId // Return the ID of the newly created gallery
        });
    });
});

// POST /api/storeitems
router.post('/api/storeitems', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const { name, price, category, description } = req.body;

    // Check if all required fields are provided
    if (!name || !price || !category || !description) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Insert new store item into the database
    const insertStoreItemQuery = `
        INSERT INTO storeitem (Name, Price, Category, Description)
        VALUES (?, ?, ?, ?)
    `;

    db.query(insertStoreItemQuery, [name, price, category, description], (error, results) => {
        if (error) {
            console.error('Error inserting store item:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        return res.status(201).json({
            message: 'Store item successfully created',
            storeItemID: results.insertId // Return the ID of the newly created store item
        });
    });
});

// POST /api/events
router.post('/api/events', authenticateToken, (req, res) => {
    // Only allow access if the user's role is 3 or higher (e.g., manager)
    if (req.user.role < 3) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }

    const { name, date, time, galleryID, description } = req.body;

    // Check if all required fields are provided
    if (!name || !date || !time || !galleryID || !description) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Insert new event into the database
        const query = `
            INSERT INTO event (Name, Date, Time, GalleryID, Description) 
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(query, [name, date, time, galleryID, description], (error, results) => {
            if (error) {
                console.error('Error inserting event:', error);
                return res.status(500).json({ message: 'Server error' });
            }

            res.status(201).json({
                message: 'Event added successfully!',
                eventID: results.insertId // Return the ID of the newly created event
            });
        });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ message: 'An error occurred while adding the event.' });
    }
});

// Endpoint to validate discount code for a specific user
router.get('/api/validate-discount-code/:discountCode/:visitorID', authenticateToken, (req, res) => {
    const { discountCode, visitorID } = req.params;

    // Query to fetch the discount code details
    const discountQuery = `
        SELECT discountID, visitorID, percent, numOfUses, expiration
        FROM discountcodes
        WHERE discountID = ? AND visitorID = ? AND numOfUses > 0 AND expiration >= CURDATE();
    `;

    db.query(discountQuery, [discountCode, visitorID], (error, results) => {
        if (error) {
            console.error('Error validating discount code:', error);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Discount code not valid for this user or has expired' });
        }

        const discount = results[0];
        
        // Return the discount details
        return res.status(200).json({
            discountID: discount.discountID,
            percent: discount.percent,
            numOfUses: discount.numOfUses,
            expiration: discount.expiration,
        });
    });
});

// POST endpoint to record a transaction and associated transaction items
router.post('/api/transactions/:discountCode?', authenticateToken, async (req, res) => {
    try {
        const visitorID = req.user.userId; // Extract visitorID from authenticated token
        const { totalPrice, items } = req.body;
        const discountCode = req.params.discountCode; // Get discount code from URL parameter

        // Validate items is an array
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: "Items should be an array." });
        }

        // Check if a discount code is provided and decrement its uses
        if (discountCode) {
            const discountQuery = 'SELECT * FROM discountcodes WHERE discountID = ? AND visitorID = ? AND numOfUses > 0 AND expiration >= CURDATE()';
            const discountValues = [discountCode, visitorID];

            db.query(discountQuery, discountValues, (err, discountResults) => {
                if (err) {
                    console.error("Error verifying discount code:", err);
                    return res.status(500).json({ message: "Error verifying discount code." });
                }

                if (discountResults.length === 0) {
                    return res.status(400).json({ message: "Invalid or expired discount code." });
                }

                // Decrement the numOfUses for the discount code
                const updateDiscountQuery = 'UPDATE discountcodes SET numOfUses = numOfUses - 1 WHERE discountID = ?';
                db.query(updateDiscountQuery, [discountCode], (err, discountUpdateResults) => {
                    if (err) {
                        console.error("Error updating discount code:", err);
                        return res.status(500).json({ message: "Error updating discount code." });
                    }

                    // Proceed with the transaction after successful discount code update
                    recordTransaction(visitorID, totalPrice, items, res);
                });
            });
        } else {
            // No discount code provided, proceed with the transaction directly
            recordTransaction(visitorID, totalPrice, items, res);
        }
    } catch (error) {
        console.error("Error handling transaction:", error);
        res.status(500).json({ message: "Server error while processing transaction." });
    }
});

function recordTransaction(visitorID, totalPrice, items, res) {
    // Insert into the transactions table
    db.query(
        'INSERT INTO transactions (visitorID, price, date) VALUES (?, ?, NOW())',
        [visitorID, totalPrice],
        (err, results) => {
            if (err) {
                console.error("Error recording transaction:", err);
                return res.status(500).json({ message: "Error recording transaction." });
            }

            const transactionID = results.insertId; // Get the inserted transaction ID

            // Prepare items for bulk insert
            const itemInserts = items.map(item => [transactionID, item.name, item.price, item.quantity, item.category]);

            // Insert items into transaction_items table
            db.query(
                'INSERT INTO transaction_items (transactionID, name, price, quantity, category) VALUES ?',
                [itemInserts],
                (err, itemResults) => {
                    if (err) {
                        console.error("Error inserting transaction items:", err);
                        return res.status(500).json({ message: "Error recording transaction items." });
                    }

                    // Send success response
                    res.status(201).json({ message: "Transaction recorded successfully." });
                }
            );
        }
    );
}


router.post('/api/tickets', authenticateToken, (req, res) => {
    const visitorID = req.user.userId; // Extract visitorID from the auth token
    const tickets = req.body.tickets; // Array of ticket objects

    if (!Array.isArray(tickets) || tickets.length === 0) {
        return res.status(400).json({ message: 'Invalid tickets data' });
    }

    // Prepare values for batch insert
    const ticketInserts = tickets.map(ticket => [
        visitorID,
        ticket.quantity,
        ticket.price,
        ticket.date,
        ticket.type,
        ticket.status || 'Active' // Default status to 'Active' if not provided
    ]);

    // SQL query for batch insert
    const query = `
        INSERT INTO tickets (visitorID, quantity, price, date, type, status)
        VALUES ?;
    `;

    db.query(query, [ticketInserts], (err, results) => {
        if (err) {
            console.error('Error inserting tickets:', err);
            return res.status(500).json({ message: 'Failed to insert tickets.' });
        }
        res.status(201).json({ message: 'Tickets successfully created.', insertedCount: results.affectedRows });
    });
});

router.put('/auth/membership', authenticateToken, (req, res) => {
    const { membership_start_date, membership_end_date } = req.body;

    // The visitorID is already available from the token in `authenticateToken`
    const visitorID = req.user.userId; // Assuming `authenticateToken` attaches user data to `req.user`

    // Validate input
    if (!membership_start_date || !membership_end_date) {
        return res.status(400).json({ message: 'Membership dates are required.' });
    }

    const updateMembershipQuery = `
        UPDATE visitor
        SET membership_start_date = ?, membership_end_date = ?
        WHERE VisitorID = ?;
    `;

    db.query(updateMembershipQuery, [membership_start_date, membership_end_date, visitorID], (err, results) => {
        if (err) {
            console.error('Error updating membership:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Visitor not found or no changes made.' });
        }

        res.status(200).json({ message: 'Membership updated successfully.' });
    });
});


router.get('/reports/transactions', authenticateToken, (req, res) => {
    const { visitorID, startDate, endDate, itemName, sortBy, order, limit, offset } = req.query;

    // Start building the base query
    let query = `
        SELECT 
            visitor.Name AS visitor_name,
            visitor.VisitorID AS visitor_id,
            transaction_items.name AS item_name,
            transaction_items.price AS item_price,
            transaction_items.quantity AS item_quantity,
            transactions.date AS transaction_date
        FROM 
            visitor
        JOIN 
            transactions ON visitor.VisitorID = transactions.visitorID
        JOIN 
            transaction_items ON transactions.TransactionID = transaction_items.transactionID
        WHERE 
            1 = 1
    `;

    // Add filters dynamically
    const params = [];
    if (visitorID) {
        query += ` AND visitor.VisitorID = ?`;
        params.push(visitorID);
    }
    if (startDate) {
        query += ` AND transactions.date >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        query += ` AND transactions.date <= ?`;
        params.push(endDate);
    }
    if (itemName) {
        query += ` AND transaction_items.name LIKE ?`;
        params.push(`%${itemName}%`);
    }

    // Add sorting
    if (sortBy) {
        query += ` ORDER BY ${sortBy} ${order === 'desc' ? 'DESC' : 'ASC'}`;
    }

    // Add pagination
    if (limit) {
        query += ` LIMIT ?`;
        params.push(parseInt(limit, 10));
    }
    if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset, 10));
    }

    // Execute the query
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching transactions report:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No transactions found for the given criteria.' });
        }

        res.status(200).json({
            message: 'Transaction report fetched successfully.',
            data: results,
        });
    });
});

router.get('/reports/museumItems', authenticateToken, async (req, res) => {
    try {
        const { yearCreated, medium, artistName, galleryID, minValue, maxValue, sortBy, order } = req.query;

        let query = `
            SELECT 
                ar.name AS artist_name,
                a.title AS artwork_title,
                a.yearCreated AS year_created,
                a.artistID AS artist_id,
                a.galleryID AS gallery_id,
                a.value AS artwork_value,
                a.medium AS artwork_medium,
                a.dimensions AS artwork_dimensions
            FROM 
                artist AS ar
            JOIN 
                artwork AS a
            ON 
                ar.ArtistID = a.ArtistID
            WHERE 
                1 = 1
        `;

        const params = [];
        if (yearCreated) {
            query += " AND a.yearCreated = ?";
            params.push(yearCreated);
        }
        if (medium) {
            query += " AND a.medium LIKE ?";
            params.push(`%${medium}%`);
        }
        if (artistName) {
            query += " AND ar.name LIKE ?";
            params.push(`%${artistName}%`);
        }
        if (galleryID) {
            query += " AND a.galleryID = ?";
            params.push(galleryID);
        }
        if (minValue) {
            query += " AND a.value >= ?";
            params.push(minValue);
        }
        if (maxValue) {
            query += " AND a.value <= ?";
            params.push(maxValue);
        }

        // Add sorting
        if (sortBy) {
            query += ` ORDER BY ${sortBy} ${order === "desc" ? "DESC" : "ASC"}`;
        }

        db.query(query, params, (err, results) => {
            if (err) {
                console.error("Error fetching museum items report:", err);
                return res.status(500).json({ message: "Error fetching museum items report." });
            }

            res.status(200).json({
                message: "Museum items report fetched successfully.",
                data: results,
            });
        });
    } catch (error) {
        console.error("Server error while fetching museum items:", error);
        res.status(500).json({ message: "Server error while fetching museum items." });
    }
});


module.exports = router;
