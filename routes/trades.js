const express = require('express');
const router = express.Router();
const tradeService = require('../services/tradeService');

router.post('/', async (req, res) => {
    try {
        const trade = await tradeService.placeTrade(req.body);
        res.json(trade);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

module.exports = router;