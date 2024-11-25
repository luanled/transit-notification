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

        this.insertSubscriptionQuery = `
            INSERT INTO transit_system.station_subscriptions (
                email, station, line, subscribed_at
            ) VALUES (?, ?, ?, ?)`;
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

            // Verify events table
            const eventsTableQuery = `
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
            await this.client.execute(eventsTableQuery);
            console.log('Events table verified');

            // Verify subscriptions table
            const subscriptionsTableQuery = `
                CREATE TABLE IF NOT EXISTS transit_system.station_subscriptions (
                    email text,
                    station text,
                    line text,
                    subscribed_at timestamp,
                    PRIMARY KEY ((station), email)
                )`;
            await this.client.execute(subscriptionsTableQuery);
            console.log('Subscriptions table verified');

            // Check if tables exist and are empty
            const eventCountQuery = 'SELECT COUNT(*) FROM transit_system.transit_events';
            const eventResult = await this.client.execute(eventCountQuery);
            console.log('Current event count:', eventResult.rows[0].count);

            const subscriptionCountQuery = 'SELECT COUNT(*) FROM transit_system.station_subscriptions';
            const subscriptionResult = await this.client.execute(subscriptionCountQuery);
            console.log('Current subscription count:', subscriptionResult.rows[0].count);

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
            return true;
        } catch (error) {
            console.error('Error storing event in Cassandra:', error);
            throw error;
        }
    }

    async addSubscription(email, station, line) {
        try {
            const params = [
                email,
                station,
                line,
                new Date()
            ];
            await this.client.execute(this.insertSubscriptionQuery, params, { prepare: true });
            return true;
        } catch (error) {
            console.error('Error adding subscription:', error);
            throw error;
        }
    }

    async getSubscriptionsForStation(station) {
        try {
            const query = 'SELECT * FROM transit_system.station_subscriptions WHERE station = ?';
            const result = await this.client.execute(query, [station], { prepare: true });
            return result.rows;
        } catch (error) {
            console.error('Error getting subscriptions for station:', error);
            throw error;
        }
    }

    async removeSubscription(email, station) {
        try {
            const query = 'DELETE FROM transit_system.station_subscriptions WHERE station = ? AND email = ?';
            await this.client.execute(query, [station, email], { prepare: true });
            return true;
        } catch (error) {
            console.error('Error removing subscription:', error);
            throw error;
        }
    }

    async getSubscription(email, station) {
        try {
            const query = 'SELECT * FROM transit_system.station_subscriptions WHERE station = ? AND email = ?';
            const result = await this.client.execute(query, [station, email], { prepare: true });
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting subscription:', error);
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