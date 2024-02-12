const express = require('express');
const router = express.Router();
const chartinkService = require('../services/chartinkService');

router.post('/', async (req, res) => {
  try {
    // Validate the request data
    const reqdata = req.body;
    if (!reqdata.stocks || !reqdata.trigger_prices || !reqdata.triggered_at || !reqdata.scan_name || !reqdata.scan_url || !reqdata.alert_name || !reqdata.webhook_url) {
      return res.status(400).json({ error: 'Invalid alert data' });
    }

    // Handle the alert
    const alert = await chartinkService.handleAlert(reqdata);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;