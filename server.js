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

    db.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name], (err, result) => {
        if (err) return res.status(500).send('Server error');
        res.status(201).send({ message: 'User created' });
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
    const { name, amount, date, created_by, type } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Get the image path if available
    console.log(req.body);
    const sql = 'INSERT INTO expenses (name, amount, date, created_by, type, image_path) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, amount, date, created_by, type, imagePath], (err, result) => {
        if (err) {
            console.error(err); // Add this to log the actual SQL error
            return res.status(500).send('Error inserting expense into database');
        }
        res.status(200).send('Expense added successfully');
    });
});
// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

app.listen(3000, () => console.log('Server running on port 3000'));
