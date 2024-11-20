const express = require('express');
const router = express.Router();
const cassandraService = require('../database/cassandraService');

// Get event by ID
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const query = `
            SELECT * FROM transit_system.transit_events 
            WHERE event_id = ? 
            ALLOW FILTERING`;
        
        const result = await cassandraService.client.execute(query, [eventId], { prepare: true });
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = result.rows[0];
        res.json({
            eventId: event.event_id,
            eventType: event.event_type,
            lineId: event.line_id,
            stopId: event.stop_id,
            timestamp: event.timestamp,
            status: event.status,
            reason: event.reason,
            delayMinutes: event.delay_minutes,
            weather: event.weather,
            scheduledTime: event.scheduled_time,
            actualTime: event.actual_time
        });
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ error: 'Failed to fetch event details' });
    }
});
// Get events for a specific line, sorted by timestamp
router.get('/line/:lineId', async (req, res) => {
    try {
        const { lineId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        
        const query = `
            SELECT * FROM transit_system.transit_events 
            WHERE line_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?`;
        
        const result = await cassandraService.client.execute(query, [lineId, limit], { prepare: true });
        
        res.json({
            line: lineId,
            count: result.rows.length,
            events: result.rows
        });
    } catch (error) {
        console.error('Error fetching events by line:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get events by type for a specific line
router.get('/line/:lineId/type/:eventType', async (req, res) => {
    try {
        const { lineId, eventType } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        
        const query = `
            SELECT * FROM transit_system.transit_events 
            WHERE line_id = ? 
            AND event_type = ? 
            ORDER BY timestamp DESC 
            LIMIT ?`;
        
        const result = await cassandraService.client.execute(query, [lineId, eventType, limit], { prepare: true });
        
        res.json({
            line: lineId,
            type: eventType,
            count: result.rows.length,
            events: result.rows
        });
    } catch (error) {
        console.error('Error fetching events by line and type:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get events for a specific station
router.get('/station/:stopId', async (req, res) => {
    try {
        const { stopId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        
        const query = `
            SELECT * FROM transit_system.transit_events 
            WHERE stop_id = ? 
            ALLOW FILTERING`;
        
        const result = await cassandraService.client.execute(query, [stopId], { prepare: true });
        
        res.json({
            station: stopId,
            count: result.rows.length,
            events: result.rows
        });
    } catch (error) {
        console.error('Error fetching events by station:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get latest events for all lines
router.get('/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const lines = ['BLUE', 'GREEN', 'ORANGE'];
        
        const results = await Promise.all(lines.map(async (lineId) => {
            const query = `
                SELECT * FROM transit_system.transit_events 
                WHERE line_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?`;
            
            const result = await cassandraService.client.execute(query, [lineId, limit], { prepare: true });
            return {
                line: lineId,
                events: result.rows
            };
        }));
        
        res.json({
            latestEvents: results
        });
    } catch (error) {
        console.error('Error fetching latest events:', error);
        res.status(500).json({ error: 'Failed to fetch latest events' });
    }
});

// Get statistics
router.get('/stats', async (req, res) => {z
    try {
        const lines = ['BLUE', 'GREEN', 'ORANGE'];
        
        const stats = await Promise.all(lines.map(async (lineId) => {
            const countQuery = `
                SELECT COUNT(*) as total FROM transit_system.transit_events 
                WHERE line_id = ?`;
            
            const delayQuery = `
                SELECT COUNT(*) as delays FROM transit_system.transit_events 
                WHERE line_id = ? AND event_type = 'DELAY' 
                ALLOW FILTERING`;
            
            const [countResult, delayResult] = await Promise.all([
                cassandraService.client.execute(countQuery, [lineId], { prepare: true }),
                cassandraService.client.execute(delayQuery, [lineId], { prepare: true })
            ]);
            
            return {
                line: lineId,
                totalEvents: countResult.rows[0].total.toString(),
                delayEvents: delayResult.rows[0].delays.toString()
            };
        }));
        
        res.json({ statistics: stats });
    } catch (error) {
        console.error('Error fetching event statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;