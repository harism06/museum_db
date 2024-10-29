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
const pool = mysql.createPool({
    host: "museumdb.mysql.database.azure.com",
    database: "museumdb",
    user: "user",
    password: "password12345",
});


// Insert data route
app.post('/artist/insert', (req, res) => {
    const { name, country, dob } = req.body;

    const query = 'INSERT INTO artist (Name, Country, BirthYear) VALUES (?, ?, ?)';
    pool.query(query, [name, country, dob], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: results.insertId }); // Send back the auto-incremented ID
    });
});
app.delete('/artist/delete/:id', (req, res) => {
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
app.put('/artist/update/:id', (req, res) => {
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
app.post('/artwork/insert', (req, res) => {
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
app.put('/artwork/update/:id', (req, res) => {
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
app.delete('/artwork/delete/:id', (req, res) => {
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
// Insert Event
app.post('/event/insert', (req, res) => {
    const { Name, Date , Time,  StaffID,GalleryID } = req.body;
    const query = 'INSERT INTO event (Name, Date,Time,  StaffID,GalleryID) VALUES (?, ,? , ? , ?, ?)';
    pool.query(query, [Name, Date , Time,  StaffID,GalleryID], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error inserting event.', error: error.message });
        }
        res.status(201).json({ id: results.insertId });
    });
});

// Update Event
app.put('/event/update/:id', (req, res) => {
    const { id } = req.params;
    const { Name, Date , Time,  StaffID,GalleryID} = req.body;
    const query = 'UPDATE event SET Name = ?, Date = ?, Time = ?, StaffID= ?, GalleryID = ?  WHERE EventID = ?';
    pool.query(query, [Name, Date , Time,  StaffID,GalleryID], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error updating event.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.json({ message: 'Event updated successfully.' });
    });
});

// Delete Event
app.delete('/event/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM event WHERE EventID = ?';
    pool.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting event.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.json({ message: 'Event deleted successfully.' });
    });
});

// Insert Exhibit
app.post('/exhibition/insert', (req, res) => {
    const { name, StartDate, EndDate, GalleryID, Description } = req.body;
    const query = 'INSERT INTO exhibition (Name, StartDate, EndDate, GalleryID, Description) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [name, StartDate, EndDate], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error inserting exhibit.', error: error.message });
        }
        res.status(201).json({ id: results.insertId });
    });
});

// Update Exhibit
app.put('/exhibition/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, StartDate, EndDate, GalleryID, Description } = req.body;
    const query = 'UPDATE exhibition SET Name =?, StartDate= ? , EndDate = ? , GalleryID = ?, Description = ?  WHERE ExhibitID = ?';
    pool.query(query, [name, StartDate, EndDate, GalleryID, Description], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error updating exhibit.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Exhibit not found.' });
        }
        res.json({ message: 'Exhibit updated successfully.' });
    });
});

// Delete Exhibit
app.delete('/exhibition/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM exhibition WHERE ExhibitID = ?';
    pool.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting exhibit.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Exhibit not found.' });
        }
        res.json({ message: 'Exhibit deleted successfully.' });
    });
});

// Insert Gallery
app.post('/gallery/insert', (req, res) => {
    const { Name, FloorNumber, Capacity } = req.body;
    const query = 'INSERT INTO gallery (Name, FloorNumber, Capacity) VALUES (?, ?, ?)';
    pool.query(query, [Name, FloorNumber, Capacity], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error inserting gallery.', error: error.message });
        }
        res.status(201).json({ id: results.insertId });
    });
});

// Update Gallery
app.put('/gallery/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, FloorNumber, Capacity } = req.body;
    const query = 'UPDATE gallery SET Name = ?, Location = ? WHERE GalleryID = ?';
    pool.query(query, [name, FloorNumber, Capacity, id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error updating gallery.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Gallery not found.' });
        }
        res.json({ message: 'Gallery updated successfully.' });
    });
});

// Delete Gallery
app.delete('/gallery/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM gallery WHERE GalleryID = ?';
    pool.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting gallery.', error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Gallery not found.' });
        }
        res.json({ message: 'Gallery deleted successfully.' });
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server running at https://mofa14.azurewebsites.net on port ${port}`);
});
