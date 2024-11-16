const kafka = require('kafka-node');
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ 
    kafkaHost: 'kafka:29092',  // Changed to match your UI/producer port
    connectTimeout: 10000,
    requestTimeout: 30000,
    autoConnect: true
});

let consumer = null;

// First, create the topic with proper configs
const topicToCreate = [{
    topic: 'transit-events',
    partitions: 1,
    replicationFactor: 1
}];

async function createTopicIfNeeded() {
    return new Promise((resolve, reject) => {
        client.createTopics(topicToCreate, (error, result) => {
            if (error) {
                console.error('Error creating topic:', error);
                reject(error);
            } else {
                console.log('Topic created or exists:', result);
                resolve(result);
            }
        });
    });
}

function createNewConsumer() {
    consumer = new Consumer(
        client,
        [{ 
            topic: 'transit-events',
            partition: 0,
            offset: 0  // Start from beginning
        }],
        {
            groupId: 'transit-consumer-group-1',  // Unique group ID
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            fromOffset: true,  // Important for offset management
            fetchMaxBytes: 1024 * 1024
        }
    );

    consumer.on('ready', () => {
        console.log('Consumer is ready');
    });

    consumer.on('message', async (message) => {
        try {
            const event = JSON.parse(message.value);
            console.log('Received Event:', event);
            
            if (event.eventType === 'DELAY') {
                console.log(`Alert! ${event.lineName} delayed at ${event.stopId}`);
                await processEvent(event);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    consumer.on('error', (err) => {
        console.error('Consumer Error:', err);
    });

    consumer.on('offsetOutOfRange', (err) => {
        console.error('Offset out of range:', err);
        // Reset offset to earliest
        consumer.setOffset('transit-events', 0, 0);
    });
}

async function processEvent(event) {
    try {
        console.log('Processing event:', event);
    } catch (error) {
        console.error('Error processing event:', error);
    }
}

function cleanup() {
    if (consumer) {
        consumer.close(() => {
            console.log('Consumer closed gracefully');
            client.close(() => {
                console.log('Client closed gracefully');
            });
        });
    }
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

client.on('ready', () => {
    console.log('Kafka client is ready');
});

client.on('error', (error) => {
    console.error('Kafka client error:', error);
});

async function start() {
    try {
        await createTopicIfNeeded();
        createNewConsumer();
    } catch (error) {
        console.error('Failed to start consumer:', error);
        process.exit(1);
    }
}

module.exports = { start, cleanup };