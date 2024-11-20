const kafka = require('kafka-node');
const EventEmitter = require('events');
const cassandraService = require('../database/cassandraService');

class TransitStreamProcessor extends EventEmitter {
    constructor() {
        super();
        this.client = new kafka.KafkaClient({
            kafkaHost: 'kafka:29092',
            connectTimeout: 10000,
            requestTimeout: 30000
        });

        this.analytics = {
            delaysByLine: new Map(),
            cancelsByLine: new Map(),
            incidentsByStop: new Map(),
            serviceHealth: new Map()
        };

        this.windowSize = 24 * 60 * 60 * 1000; // 24 hours default
        this.consumer = null;
        this.messageCount = 0;

        this.topics = [
            { topic: 'transit-events-BLUE', partition: 0 },
            { topic: 'transit-events-GREEN', partition: 0 },
            { topic: 'transit-events-ORANGE', partition: 0 }
        ];
    }

    setWindowSize(minutes) {
        this.windowSize = minutes * 60 * 1000;
        this.refreshAnalytics();
    }

    refreshAnalytics() {
        // Reset analytics
        this.analytics = {
            delaysByLine: new Map(),
            cancelsByLine: new Map(),
            incidentsByStop: new Map(),
            serviceHealth: new Map()
        };

        // Reprocess events from Cassandra
        this.reprocessEvents();
    }

    async reprocessEvents() {
        try {
            const cutoffTime = new Date(Date.now() - this.windowSize);
            const query = `
                SELECT * FROM transit_system.transit_events 
                WHERE timestamp >= ? 
                ALLOW FILTERING
            `;
            const result = await cassandraService.client.execute(query, [cutoffTime], { prepare: true });

            for (const row of result.rows) {
                const event = {
                    eventId: row.event_id,
                    eventType: row.event_type,
                    lineId: row.line_id,
                    lineName: row.line_name,
                    stopId: row.stop_id,
                    scheduledTime: row.scheduled_time,
                    actualTime: row.actual_time,
                    delayMinutes: row.delay_minutes,
                    status: row.status,
                    reason: row.reason,
                    weather: row.weather,
                    timestamp: row.timestamp
                };
                this.processMessage({ value: JSON.stringify(event) });
            }

            // Emit updated analytics
            this.emit('dataUpdated', this.getAnalytics());
        } catch (error) {
            console.error('Error reprocessing events:', error);
        }
    }

    async start() {
        try {
            console.log('Starting stream processor for multiple topics...');

            const consumer = new kafka.Consumer(
                this.client,
                this.topics,
                {
                    autoCommit: true,
                    autoCommitIntervalMs: 5000,
                    groupId: 'transit-stream-processor-group',
                    fromOffset: true
                }
            );

            this.consumer = consumer;

            consumer.on('message', (message) => {
                this.messageCount++;
                this.processMessage(message);
            });

            consumer.on('error', (error) => {
                console.error('Stream processor consumer error:', error);
            });

            consumer.on('offsetOutOfRange', (error) => {
                console.error('Offset out of range:', error);
                consumer.setOffset(error.topic, error.partition, 0);
            });

            consumer.on('ready', () => {
                console.log('Stream processor consumer is ready');
            });

            setInterval(() => {
                // console.log('Current analytics state:', {
                //     messageCount: this.messageCount,
                //     delaysByLineCount: this.analytics.delaysByLine.size,
                //     incidentsByStopCount: this.analytics.incidentsByStop.size,
                //     serviceHealthCount: this.analytics.serviceHealth.size
                // });
                this.emit('dataUpdated', this.getAnalytics());
            }, 30000);

            console.log('Stream processor started successfully');
        } catch (error) {
            console.error('Failed to start stream processor:', error);
            throw error;
        }
    }

    async shutdown() {
        try {
            if (this.consumer) {
                await new Promise((resolve) => this.consumer.close(resolve));
            }
            await new Promise((resolve) => this.client.close(resolve));
            console.log('Stream processor shut down successfully');
        } catch (error) {
            console.error('Error during stream processor shutdown:', error);
            throw error;
        }
    }

    processMessage(message) {
        try {
            const event = JSON.parse(message.value);

            if (!event.eventType || !event.lineId || !event.eventId) {
                console.warn('Invalid event format:', event);
                return;
            }

            // Process delays
            if (event.eventType === 'DELAY') {
                this.processDelay(event);
            }
            if (event.eventType === 'CANCELLATION') {
                this.processCancellation(event);
            }
            // Process incidents
            if (['DELAY', 'CANCELLATION'].includes(event.eventType)) {
                this.processIncident(event);
            }

            // Update service health
            this.updateServiceHealth(event);

            // Emit the dataUpdated event with current analytics
            this.emit('dataUpdated', this.getAnalytics());
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    processDelay(event) {
        const currentStats = this.analytics.delaysByLine.get(event.lineId) || {
            avgDelay: 0,
            count: 0,
            delays: []
        };

        currentStats.delays.push({
            eventId: event.eventId,
            delay: event.delayMinutes,
            timestamp: new Date(event.timestamp || Date.now())
        });

        const now = new Date();
        currentStats.delays = currentStats.delays.filter(d =>
            now - d.timestamp <= this.windowSize
        );

        currentStats.avgDelay = currentStats.delays.reduce((sum, d) =>
            sum + d.delay, 0) / currentStats.delays.length || 0;

        currentStats.count = currentStats.delays.length;
        currentStats.lastUpdated = event.timestamp || new Date().toISOString();

        this.analytics.delaysByLine.set(event.lineId, currentStats);
    }

    processCancellation(event) {
        const currentStats = this.analytics.cancelsByLine.get(event.lineId) || {
            count: 0,
            cancellations: [],
            lastCancellation: null
        };

        currentStats.cancellations.push({
            eventId: event.eventId,
            timestamp: new Date(event.timestamp || Date.now()),
            reason: event.reason || 'Unknown'
        });

        const now = new Date();
        currentStats.cancellations = currentStats.cancellations.filter(c =>
            now - c.timestamp <= this.windowSize
        );

        currentStats.count = currentStats.cancellations.length;
        currentStats.lastCancellation = event.timestamp || new Date().toISOString();

        this.analytics.cancelsByLine.set(event.lineId, currentStats);
    }

    processIncident(event) {
        const currentStats = this.analytics.incidentsByStop.get(event.stopId) || {
            count: 0,
            incidents: [],
            type: event.eventType
        };

        currentStats.incidents.push({
            eventId: event.eventId,
            type: event.eventType,
            timestamp: new Date(event.timestamp || Date.now()),
            reason: event.reason || null,
            delayMinutes: event.delayMinutes || null
        });

        const now = new Date();
        currentStats.incidents = currentStats.incidents.filter(i =>
            now - i.timestamp <= this.windowSize
        );

        currentStats.count = currentStats.incidents.length;
        currentStats.lastIncident = event.timestamp || new Date().toISOString();
        currentStats.type = event.eventType;
        currentStats.lastEventId = event.eventId;

        this.analytics.incidentsByStop.set(event.stopId, currentStats);
    }

    updateServiceHealth(event) {
        const currentHealth = this.analytics.serviceHealth.get(event.lineId) || {
            healthScore: 100,
            events: [],
            totalEvents: 0,
            delayCount: 0,
            cancelCount: 0,
            lastUpdated: new Date().toISOString()
        };
    
        // Add event to tracking
        currentHealth.events.push({
            eventId: event.eventId,
            type: event.eventType,
            timestamp: new Date(event.timestamp || Date.now())
        });
    
        const now = new Date();
        // Filter events within window
        currentHealth.events = currentHealth.events.filter(e => 
            now - e.timestamp <= this.windowSize
        );
    
        // Count each type of event
        currentHealth.totalEvents = currentHealth.events.length;
        currentHealth.delayCount = currentHealth.events.filter(e => e.type === 'DELAY').length;
        currentHealth.cancelCount = currentHealth.events.filter(e => e.type === 'CANCELLATION').length;
        
        // Calculate health score using the same formula everywhere:
        // (1 - (incidents / total_events)) * 100
        const totalIncidents = currentHealth.delayCount + currentHealth.cancelCount;
        currentHealth.healthScore = currentHealth.totalEvents > 0 
            ? (1 - (totalIncidents / currentHealth.totalEvents)) * 100 
            : 100;
                
        currentHealth.lastUpdated = event.timestamp || new Date().toISOString();
    
        this.analytics.serviceHealth.set(event.lineId, currentHealth);
    }

    async getIncidentDetails(eventId) {
        try {
            const query = `
                SELECT * FROM transit_system.transit_events 
                WHERE event_id = ? 
                ALLOW FILTERING
            `;
            const result = await cassandraService.client.execute(query, [eventId], { prepare: true });

            if (result.rows.length > 0) {
                const event = result.rows[0];
                return {
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
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching incident details:', error);
            throw error;
        }
    }

    getAnalytics() {
        // Calculate overall health score
        let totalEvents = 0;
        let totalIncidents = 0;
        
        Object.values(this.analytics.serviceHealth).forEach(line => {
            totalEvents += line.totalEvents;
            totalIncidents += (line.delayCount + line.cancelCount);
        });
    
        const overallHealth = totalEvents > 0 
            ? (1 - (totalIncidents / totalEvents)) * 100 
            : 100;
    
        const analytics = {
            delaysByLine: Object.fromEntries(this.analytics.delaysByLine),
            cancelsByLine: Object.fromEntries(this.analytics.cancelsByLine),
            incidentsByStop: Object.fromEntries(this.analytics.incidentsByStop),
            serviceHealth: Object.fromEntries(this.analytics.serviceHealth),
            overallHealth: overallHealth
        };
    
        return {
            timestamp: new Date().toISOString(),
            messageCount: this.messageCount,
            analytics: analytics,
            status: 'active',
            consumingTopics: this.topics.map(t => t.topic),
            windowSize: this.windowSize / (60 * 1000) // Convert back to minutes
        };
    }
}
module.exports = new TransitStreamProcessor();