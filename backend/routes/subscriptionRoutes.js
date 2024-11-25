const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');

// Subscribe to station alerts
router.post('/', async (req, res) => {
    try {
        const { email, station, line } = req.body;

        if (!email || !station || !line) {
            return res.status(400).json({
                error: 'Missing required fields: email, station, line'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        await subscriptionService.addSubscription(email, station, line);

        res.status(200).json({
            message: 'Successfully subscribed to station alerts',
            data: { email, station, line }
        });
    } catch (error) {
        console.error('Failed to create subscription:', error);
        res.status(500).json({
            error: 'Failed to create subscription',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;