const { Client } = require('cassandra-driver');

class CassandraService {
    constructor() {
        this.client = new Client({
            contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],
            localDataCenter: process.env.CASSANDRA_DC || 'datacenter1',
            keyspace: process.env.CASSANDRA_KEYSPACE || 'transit_system',
            credentials: {
                username: process.env.CASSANDRA_USERNAME || 'cassandra',
                password: process.env.CASSANDRA_PASSWORD || 'cassandra'
            }
        });

        this.insertQuery = `
            INSERT INTO transit_system.transit_events (
                event_id, event_type, line_id, line_name, stop_id, 
                scheduled_time, actual_time, delay_minutes, status, 
                reason, weather, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    }

    async setup() {
        try {
            console.log('Setting up Cassandra connection...');
            await this.client.connect();
            console.log('Connected to Cassandra');

            // Verify keyspace
            const keyspaceQuery = `
                CREATE KEYSPACE IF NOT EXISTS transit_system 
                WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`;
            await this.client.execute(keyspaceQuery);
            console.log('Keyspace verified');

            // Verify table
            const tableQuery = `
                CREATE TABLE IF NOT EXISTS transit_system.transit_events (
                    event_id text,
                    event_type text,
                    line_id text,
                    line_name text,
                    stop_id text,
                    scheduled_time timestamp,
                    actual_time timestamp,
                    delay_minutes int,
                    status text,
                    reason text,
                    weather text,
                    timestamp timestamp,
                    PRIMARY KEY ((line_id), timestamp, event_id)
                )`;
            await this.client.execute(tableQuery);
            console.log('Table verified');

            // Check if table exists and is empty
            const countQuery = 'SELECT COUNT(*) FROM transit_system.transit_events';
            const result = await this.client.execute(countQuery);
            console.log('Current event count:', result.rows[0].count);

        } catch (error) {
            console.error('Error setting up Cassandra:', error);
            throw error;
        }
    }

    async storeEvent(event) {
        try {
            const params = [
                event.eventId,
                event.eventType,
                event.lineId,
                event.lineName,
                event.stopId,
                new Date(event.scheduledTime),
                new Date(event.actualTime),
                event.delayMinutes,
                event.status,
                event.reason || null,
                event.weather || null,
                new Date(event.timestamp)
            ];
            await this.client.execute(this.insertQuery, params, { prepare: true });
            console.log('Insert successful for event:', event.eventId);

            return true;
        } catch (error) {
            console.error('Error storing event in Cassandra:', error);
            throw error;
        }
    }

    async shutdown() {
        try {
            await this.client.shutdown();
            console.log('Cassandra connection closed');
        } catch (error) {
            console.error('Error shutting down Cassandra client:', error);
            throw error;
        }
    }
}

module.exports = new CassandraService();