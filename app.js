const express = require('express');
const cors = require('cors'); // Importing CORS middleware
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser'); // Importing cookie parser
const connection = require('./database'); // Import the database connection
const backendRoutes = require('./backend'); // Importing the backend.js file

const app = express();
const port = 3000;

// Enable CORS for all routes with specific options to allow credentials
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files (like images, CSS, JS) from the "home" directory
app.use(express.static(path.join(__dirname, 'home')));

// Register backend routes for /auth endpoints
app.use(backendRoutes);

// Serve the home page (home.html)
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'home', 'home.html');
    res.sendFile(filePath);
});

// Handle requests for missing routes (404 errors)
app.use((req, res) => {
    res.status(404).send('<h1>404 Not Found</h1>');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    connection.connect(function (err) {
        if (err) {
            console.error('Database connection error:', err);
        } else {
            console.log('Database Connected!');
        }
    });
});
