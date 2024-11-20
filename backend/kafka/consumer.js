const kafka = require('kafka-node');
const cassandraService = require('../database/cassandraService');

const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({
    kafkaHost: 'kafka:29092',
    connectTimeout: 10000,
    requestTimeout: 30000,
    autoConnect: true
});

let consumer = null;

const topicToCreate = [
    {
        topic: 'transit-events-BLUE',
        partitions: 1,
        replicationFactor: 1
    },
    {
        topic: 'transit-events-GREEN',
        partitions: 1,
        replicationFactor: 1
    },
    {
        topic: 'transit-events-ORANGE',
        partitions: 1,
        replicationFactor: 1
    }
];
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

async function processEvent(event) {
    try {
        await cassandraService.storeEvent(event);
    } catch (error) {
        console.error('Error processing event:', error);
        throw error;
    }
}

function createNewConsumer() {
    consumer = new Consumer(
        client,
        [
            {
                topic: 'transit-events-BLUE',
                partition: 0,
                offset: 0
            },
            {
                topic: 'transit-events-GREEN',
                partition: 0,
                offset: 0
            },
            {
                topic: 'transit-events-ORANGE',
                partition: 0,
                offset: 0
            }
        ],
        {
            groupId: 'transit-consumer-group-1',
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            fromOffset: true,
            fetchMaxBytes: 1024 * 1024
        }
    );

    // Add topic listener
    client.on('topic', (topics) => {
        console.log('Available topics:', topics);
    });

    consumer.on('ready', () => {
        console.log('Consumer is ready');
        // List topics
        client.loadMetadataForTopics([], (error, results) => {
            if (error) {
                console.error('Error loading topics:', error);
            } else {
                console.log('Available topics:', results[1].metadata);
            }
        });
    });

    consumer.on('message', async (message) => {
        try {
            const event = JSON.parse(message.value);

            await processEvent(event);

            // if (event.eventType === 'DELAY') {
            //     console.log(`Alert! ${event.lineName} delayed at ${event.stopId}`);
            // }
            // if (event.eventType === 'CANCELLATION') {
            //     console.log(`Alert! ${event.lineName} cancelled at ${event.stopId}`);
            // }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    consumer.on('error', (err) => {
        console.error('Consumer Error:', err);
    });

    consumer.on('offsetOutOfRange', (err) => {
        console.error('Offset out of range:', err);
        consumer.setOffset('transit-events', 0, 0);
    });
}

async function cleanup() {
    try {
        if (consumer) {
            await new Promise(resolve => consumer.close(resolve));
            await new Promise(resolve => client.close(resolve));
        }
        await cassandraService.shutdown();
        console.log('All connections closed gracefully');
    } catch (error) {
        console.error('Error during cleanup:', error);
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
        await cassandraService.setup();
        await createTopicIfNeeded();
        createNewConsumer();
        console.log('Consumer started successfully');
    } catch (error) {
        console.error('Failed to start consumer:', error);
        await cleanup();
        process.exit(1);
    }
}

module.exports = { start, cleanup };