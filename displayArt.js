const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection
const db = mysql.createConnection({
  host: "museumdb.mysql.database.azure.com", 
  database: "museumdb",                      
  user: "user",                              
  password: "password12345",                 
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the application if there's a connection error
  }
  console.log('Connected to the database!');
});

// Fetch all artists (selecting all columns with SELECT *)
app.get('/Artist', (req, res) => {
  db.query('SELECT * FROM Artist', (err, results) => {
    if (err) {
      console.error('Error fetching artists:', err);
      return res.status(500).send('Error retrieving artists');
    }
    res.json(results); // Send the artist data as JSON
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});