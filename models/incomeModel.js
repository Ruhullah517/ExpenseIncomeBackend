const db = require('../config/db');

const Income = {
    add: (name, amount, date, created_by, type, account_id, callback) => {
        const sql = `
            INSERT INTO incomes (name, amount, date, created_by, type, account_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [name, amount, date, created_by, type, account_id], callback);
    },
    getByAccountId: (accountId, callback) => {
        db.query('SELECT * FROM incomes WHERE account_id = ?', [accountId], callback);
    }
};

module.exports = Income;