const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
// const multer = require('multer');

const app = express();
app.use(express.json());
// Middleware
app.use(bodyParser.json());
// CORS configuration
app.use(cors({
    origin: '*',  // Replace this with your mobile device's IP address
    methods: 'GET,POST,PUT,DELETE',   // Specify the allowed HTTP methods
    credentials: true,                // If you're using cookies or auth headers
    optionsSuccessStatus: 200         // For legacy browser support
}));

// Initialize SQLite database connection and create tables if they don't exist
const db = new sqlite3.Database(`${process.env.DB_FILE_PATH}`, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');

        // SQL statements to create tables
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS user_account (
                user_id INTEGER NOT NULL,
                account_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                PRIMARY KEY (user_id, account_id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                created_by INTEGER NOT NULL,
                type TEXT NOT NULL,
                image_path TEXT,
                account_id INTEGER NOT NULL,
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            )
        `);

        console.log('Tables created or already exist');
    }
});

// Routes will go here...
app.post('/signup', (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Check if user with the provided email already exists
    const checkUserSql = 'SELECT * FROM users WHERE email = ?';
    db.get(checkUserSql, [email], (err, row) => {
        if (err) return res.status(500).send('Server error');

        // If user exists, return an error message
        if (row) return res.status(400).send('User already exists');

        // Insert new user into the 'users' table
        const insertUserSql = 'INSERT INTO users (email, password, name) VALUES (?, ?, ?)';
        db.run(insertUserSql, [email, hashedPassword, name], function (err) {
            if (err) return res.status(500).send('Server error');

            const userId = this.lastID;

            // Create personal account for the user
            const createAccountSql = 'INSERT INTO accounts (admin_id) VALUES (?)';
            db.run(createAccountSql, [userId], function (err) {
                if (err) return res.status(500).send('Error creating personal account');

                const accountId = this.lastID;

                // Associate the user with the personal account in 'user_account' table
                const associateUserSql = 'INSERT INTO user_account (user_id, account_id, role) VALUES (?, ?, ?)';
                db.run(associateUserSql, [userId, accountId, 'admin'], (err) => {
                    if (err) return res.status(500).send('Error associating user with personal account');

                    res.status(200).send('User and personal account created successfully');
                });
            });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.status(404).send('User not found');

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user.id }, `${process.env.JWT_SECRET}`, { expiresIn: 86400 });
        res.status(200).send({ auth: true, token: token });
    });
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT name FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return res.status(500).send('Server error');
        if (!user) return res.status(404).send('User not found');
        res.send(user);
    });
});

// Route to add an expense (no image upload handling needed)
app.post('/add-expense', (req, res) => {
    const { name, amount, date, created_by, type, image_path, account_id } = req.body;

    // SQL statement to insert expense data
    const sql = `
        INSERT INTO expenses (name, amount, date, created_by, type, image_path, account_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [name, amount, date, created_by, type, image_path, account_id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error inserting expense into database');
        }
        res.status(200).send('Expense added successfully');
    });
});

app.get('/accounts/current/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `SELECT a.id, a.admin_id 
                 FROM accounts a
                 JOIN user_account ua ON ua.account_id = a.id
                 WHERE ua.user_id = ? AND ua.role = 'admin'`;

    db.all(sql, [userId], (err, accounts) => {
        if (err) return res.status(500).send('Error fetching account details');
        res.status(200).json(accounts);
    });
});

app.get('/accounts/:accountId/expenses', (req, res) => {
    const { accountId } = req.params;
    const sql = 'SELECT * FROM expenses WHERE account_id = ?';

    db.all(sql, [accountId], (err, expenses) => {
        if (err) return res.status(500).send('Error fetching expenses');
        res.status(200).send(expenses);
    });
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
