const kafka = require('kafka-node');
const Producer = kafka.Producer;

// Create a client with retry options
const client = new kafka.KafkaClient({ 
    kafkaHost: 'kafka:29092',
    connectTimeout: 10000,
    requestTimeout: 30000,
    autoConnect: true,
    retry: {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        randomize: true,
    }
});

let producer = null;
let isInitialized = false;

function initializeProducer() {
    return new Promise((resolve, reject) => {
        if (isInitialized && producer) {
            resolve(producer);
            return;
        }

        producer = new Producer(client, {
            requireAcks: 1,
            ackTimeoutMs: 100,
            partitionerType: 2
        });

        producer.on('ready', () => {
            console.log('Producer is ready');
            isInitialized = true;
            resolve(producer);
        });

        producer.on('error', (error) => {
            console.error('Producer error:', error);
            isInitialized = false;
            reject(error);
        });
    });
}

async function sendEvent(event) {
    try {
        await initializeProducer();

        // Create topic name based on line ID
        const topicName = `transit-events-${event.lineId}`;

        return new Promise((resolve, reject) => {
            const payloads = [{
                topic: topicName,
                messages: JSON.stringify(event),
                timestamp: Date.now()
            }];

            producer.send(payloads, (err, data) => {
                if (err) {
                    console.error(`Error sending event to ${topicName}:`, err);
                    reject(err);
                } else {
                    // console.log(`Event sent successfully to ${topicName}:`, data);
                    resolve(data);
                }
            });
        });
    } catch (error) {
        console.error('Failed to initialize producer:', error);
        throw error;
    }
}

// Graceful shutdown handling
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

function cleanup() {
    if (producer) {
        console.log('Closing Kafka producer...');
        producer.close(() => {
            console.log('Producer closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

// Error handling for the client
client.on('error', (error) => {
    console.error('Kafka client error:', error);
});

client.on('connect', () => {
    console.log('Kafka client connected');
});

module.exports = { 
    sendEvent,
    initializeProducer // Exported for cases where you want to initialize during app startup
};