const Income = require('../models/incomeModel');

exports.addIncome = (req, res) => {
    const { name, amount, date, created_by, type, account_id } = req.body;

    Income.add(name, amount, date, created_by, type, account_id, (err) => {
        if (err) {
            console.error('Error inserting income:', err);
            return res.status(500).send('Error inserting income into database');
        }
        res.status(200).send('Income added successfully');
    });
};

exports.getIncomesByAccount = (req, res) => {
    const accountId = req.params.accountId;

    Income.getByAccountId(accountId, (err, results) => {
        if (err) {
            console.error('Error fetching incomes:', err);
            return res.status(500).send('Error fetching incomes from database');
        }
        res.status(200).json(results);
    });
}; 