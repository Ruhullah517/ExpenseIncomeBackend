const db = require('../config/db');

const Expense = {
    add: (name, amount, date, created_by, type, image_path, account_id, callback) => {
        const sql = `
            INSERT INTO expenses (name, amount, date, created_by, type, image_path, account_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [name, amount, date, created_by, type, image_path, account_id], callback);
    },
    getByAccountId: (accountId, callback) => {
        db.query('SELECT * FROM expenses WHERE account_id = ?', [accountId], callback);
    },
    getExpensesByAccountId: (accountId, callback) => {
        db.query('SELECT * FROM expenses WHERE account_id = ?', [accountId], callback);
    }
};

module.exports = Expense;
