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

        this.windowSize = 5 * 60 * 1000; // 5 minutes
        this.consumer = null;
        this.messageCount = 0;
        
        this.topics = [
            { topic: 'transit-events-BLUE', partition: 0 },
            { topic: 'transit-events-GREEN', partition: 0 },
            { topic: 'transit-events-ORANGE', partition: 0 }
        ];
    }

    async start() {
        try {
            console.log('Starting stream processor for multiple topics...');
            
            // Create consumer with specific configs
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

            // Add detailed event handlers
            consumer.on('message', (message) => {
                this.messageCount++;
                this.processMessage(message);
            });

            consumer.on('error', (error) => {
                console.error('Stream processor consumer error:', error);
            });

            consumer.on('offsetOutOfRange', (error) => {
                console.error('Offset out of range:', error);
                // Reset offset to earliest
                consumer.setOffset(error.topic, error.partition, 0);
            });

            consumer.on('ready', () => {
                console.log('Stream processor consumer is ready');
            });

            // Monitor processing status
            setInterval(() => {
                // console.log('Current analytics state:', {
                //     messageCount: this.messageCount,
                //     delaysByLineCount: this.analytics.delaysByLine.size,
                //     incidentsByStopCount: this.analytics.incidentsByStop.size,
                //     serviceHealthCount: this.analytics.serviceHealth.size
                // });
                // Emit current state
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
            events: []
        };

        const isHealthy = event.eventType !== 'CANCELLATION' && 
                         (event.eventType !== 'DELAY' || event.delayMinutes < 15);

        currentHealth.events.push({
            eventId: event.eventId,
            isHealthy,
            timestamp: new Date(event.timestamp || Date.now())
        });

        const now = new Date();
        currentHealth.events = currentHealth.events.filter(e => 
            now - e.timestamp <= this.windowSize
        );

        const totalEvents = currentHealth.events.length;
        const healthyEvents = currentHealth.events.filter(e => e.isHealthy).length;
        
        currentHealth.healthScore = totalEvents > 0 
            ? (healthyEvents / totalEvents) * 100 
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
        // Convert Maps to plain objects for API response
        const analytics = {
            delaysByLine: Object.fromEntries(this.analytics.delaysByLine),
            cancelsByLine: Object.fromEntries(this.analytics.cancelsByLine),
            incidentsByStop: Object.fromEntries(this.analytics.incidentsByStop),
            serviceHealth: Object.fromEntries(this.analytics.serviceHealth)
        };

        return {
            timestamp: new Date().toISOString(),
            messageCount: this.messageCount,
            analytics: analytics,
            status: 'active',
            consumingTopics: this.topics.map(t => t.topic)
        };
    }
}

module.exports = new TransitStreamProcessor();