const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection
const pool = mysql.createPool({
    host: "museumdb.mysql.database.azure.com",
    database: "museumdb",
    user: "user",
    password: "password12345",
});

app.use(express.static(path.join(__dirname)));

pool.getConnection((err,connection) => {
 if(err){
    console.error("Error connecting to the database");
 }else{
    console.log("connected to the database");
    connection.release();
 }

});
// Report endpoint to get ticket sales revenue data
app.get('/report', (req, res) => {
    const query = `
     SELECT 
      DateofTransaction,
      TotalAmount,
      PaymentMethod,
      VisitorID
    FROM giftshoptransaction;
    `;
  
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Database query error' });
      } else {
        res.json(results);
      }
    });
  });

// Insert data route
app.post('/insert', (req, res) => {
    const { name, country, dob } = req.body;

    const query = 'INSERT INTO artist (Name, Country, BirthYear) VALUES (?, ?, ?)';
    pool.query(query, [name, country, dob], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: results.insertId }); // Send back the auto-incremented ID
    });
});
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM artist WHERE ArtistID = ?';

    pool.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting item.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        res.json({ message: 'Item deleted successfully.' });
    });
});
app.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, country, dob } = req.body;
    const query = 'UPDATE artist SET Name = ?, Country = ?, BirthYear = ? WHERE ArtistID = ?';

    pool.query(query, [name, country, dob, id], (error, results) => {
        if (error) {
            console.error('Update error:', error);
            return res.status(500).json({ message: 'Error updating data.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        res.json({ message: 'Item updated successfully.' });
    });
});
app.post('/art/insert', (req, res) => {
    const { title, medium, year } = req.body;
    const query = 'INSERT INTO artwork (Title ,YearCreated ,ArtistID , GalleryID , Value , Medium ,Dimensions ) VALUES (?, ?, ? , ? , ? , ? , ?)';
    pool.query(query, [title, year, artistid, galleryid, value, medium, dimesions ], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error inserting art.', error: error.message });
        }
        res.status(201).json({ id: results.insertId });
    });
});

// Update Art
app.put('/art/update/:id', (req, res) => {
    const { id } = req.params;
    const { title, medium, year } = req.body;
    const query = 'UPDATE artwork SET Title = ?,YearCreated = ?,ArtistID = ?, GalleryID = ?, Value = ? , Medium = ?,Dimensions = ? WHERE artworkID = ?';
    pool.query(query, [title, year, artistid, galleryid, value, medium, dimesions, id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error updating art.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Art not found.' });
        }
        res.json({ message: 'Art updated successfully.' });
    });
});

// Delete Art
app.delete('/art/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM artwork WHERE ArtworkID = ?';
    pool.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting art.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Art not found.' });
        }
        res.json({ message: 'Art deleted successfully.' });
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});