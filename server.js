require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
// Middleware
app.use(bodyParser.json());
// CORS configuration
app.use(cors({
    origin: 'http://192.168.18.158',  // Replace this with your mobile device's IP address
    methods: 'GET,POST,PUT,DELETE',   // Specify the allowed HTTP methods
    credentials: true,                // If you're using cookies or auth headers
    optionsSuccessStatus: 200         // For legacy browser support
}));



const db = mysql.createConnection({
    host: 'localhost',
    user: 'ruhullah',
    password: 'Ruhullah@1234',
    database: 'expense_app',
});


db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use path.join to resolve the path to the correct 'uploads' directory
        cb(null, path.join(__dirname, 'uploads')); // __dirname ensures it's relative to the backend folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    },
});
const upload = multer({ storage });

// Routes will go here...
app.post('/signup', (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Insert user into the 'users' table
    db.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name], (err, result) => {
        if (err) return res.status(500).send('Server error');

        const userId = result.insertId;

        // Create personal account for the user
        const createAccountSql = 'INSERT INTO accounts (admin_id) VALUES (?)';
        db.query(createAccountSql, [userId], (err, accountResult) => {
            if (err) return res.status(500).send('Error creating personal account');

            const accountId = accountResult.insertId;

            // Associate the user with the personal account in 'user_account' table
            const associateUserSql = 'INSERT INTO user_account (user_id, account_id, role) VALUES (?, ?, ?)';
            db.query(associateUserSql, [userId, accountId, 'admin'], (err) => {
                if (err) return res.status(500).send('Error associating user with personal account');

                // Send a single response after all operations are done
                res.status(200).send('User and personal account created successfully');
            });
        });
    });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.status(404).send('User not found');
        console.log("UserFound:", results[0]);
        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user.id }, "AnAppleADay", { expiresIn: 86400 });
        res.status(200).send({ auth: true, token: token });
    });
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT name FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) return res.status(500).send('Server error');
        if (result.length === 0) return res.status(404).send('User not found');
        res.send(result[0]);
    });
});

// Handle POST request to add expense
app.post('/add-expense', upload.single('image'), (req, res) => {
    const { name, amount, date, created_by, type, account_id } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Get the image path if available
    console.log(req.body);
    const sql = 'INSERT INTO expenses (name, amount, date, created_by, type, image_path,account_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, amount, date, created_by, type, imagePath, account_id], (err, result) => {
        if (err) {
            console.error(err); // Add this to log the actual SQL error
            return res.status(500).send('Error inserting expense into database');
        }
        res.status(200).send('Expense added successfully');
    });
});

// Assuming you have an endpoint to get account details by user ID
app.get('/accounts/current/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `SELECT a.id, a.admin_id 
                 FROM accounts a
                 JOIN user_account ua ON ua.account_id = a.id
                 WHERE ua.user_id = ? AND ua.role = 'admin'`; // Adjust as needed based on your logic

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching account details');
        }
        res.status(200).json(results); // Return account details
    });
});

app.get('/accounts/:accountId/expenses', (req, res) => {
    const { accountId } = req.params;

    const sql = `
        SELECT * FROM expenses 
        WHERE account_id = ?
    `;
    db.query(sql, [accountId], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching expenses');
        }
        // console.log(results);
        res.status(200).send(results);
    });
});
// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

app.listen(3000, () => console.log('Server running on port 3000'));
