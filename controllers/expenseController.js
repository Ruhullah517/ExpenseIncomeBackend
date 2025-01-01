const db = require('../config/db');
const Expense = require('../models/expenseModel');
const Account = require('../models/accountModel');

exports.addExpense = (req, res) => {
    const { name, amount, date, type, account_id } = req.body;
    const created_by = req.userId; // Get the user ID from the request

    // Check if the image file is provided
    if (!req.file) {
        return res.status(400).send('Image file is required');
    }

    // Convert the image buffer to a format suitable for the database
    const imageBuffer = req.file.buffer; // Get the buffer from the uploaded file

    const sql = `
        INSERT INTO expenses (name, amount, date, created_by, type, image, account_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, amount, date, created_by, type, imageBuffer, account_id], (err) => {
        if (err) {
            console.error('Error inserting expense:', err);
            return res.status(500).send('Error inserting expense into database');
        }
        res.status(200).send('Expense added successfully');
    });
};

exports.getExpensesByAccount = (req, res) => {
    const accountId = req.params.accountId;
    const userId = req.userId; // Get user ID from the request

    // Check if the user is a member of the account
    Account.isUserMember(accountId, userId, (err, isMember) => {
        if (err) {
            console.error('Error checking account membership:', err);
            return res.status(500).send('Error checking account membership');
        }
        if (!isMember) {
            return res.status(403).send('Access denied'); // User is not a member of the account
        }

        // If the user is authorized, fetch the expenses
        Expense.getByAccountId(accountId, (err, results) => {
            if (err) {
                console.error('Error fetching expenses:', err);
                return res.status(500).send('Error fetching expenses from database');
            }
            res.status(200).json(results);
        });
    });
};
