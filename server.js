const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            city TEXT NOT NULL,
            businessName TEXT NOT NULL,
            businessType TEXT NOT NULL,
            projectDetails TEXT,
            submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// API endpoint to receive form submissions
app.post('/api/contact', (req, res) => {
    const { name, phone, email, city, businessName, businessType, projectDetails } = req.body;

    const sql = `INSERT INTO contacts (name, phone, email, city, businessName, businessType, projectDetails)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, phone, email, city, businessName, businessType, projectDetails];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error inserting data:', err.message);
            res.status(500).json({ status: 'error', message: 'Failed to save submission.' });
            return;
        }
        console.log(`A new contact submission has been inserted with rowid ${this.lastID}`);
        res.status(200).json({ status: 'success', message: 'Submission successful!' });
    });
});

// API endpoint to view submissions (for owner to check)
app.get('/api/contacts', (req, res) => {
    const sql = `SELECT * FROM contacts ORDER BY submittedAt DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
            return;
        }
        
        let html = '<h2>Contact Submissions</h2><table border="1" cellpadding="10" style="border-collapse: collapse; font-family: sans-serif;">';
        html += '<tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Business Name</th><th>Type</th><th>Details</th><th>Date</th></tr>';
        
        rows.forEach(row => {
            html += `<tr>
                <td>${row.id}</td>
                <td>${row.name}</td>
                <td>${row.phone}</td>
                <td>${row.email}</td>
                <td>${row.city}</td>
                <td>${row.businessName}</td>
                <td>${row.businessType}</td>
                <td>${row.projectDetails}</td>
                <td>${row.submittedAt}</td>
            </tr>`;
        });
        html += '</table>';
        
        res.send(html);
    });
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});
