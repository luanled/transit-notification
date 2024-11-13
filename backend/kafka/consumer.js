const kafka = require('kafka-node');
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ 
    kafkaHost: 'kafka:29092', // Updated to match internal Docker network port
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

let consumer = null;

function initializeConsumer() {
    if (consumer) {
        try {
            consumer.close(() => {
                console.log('Existing consumer closed');
                createNewConsumer();
            });
        } catch (error) {
            console.error('Error closing existing consumer:', error);
            createNewConsumer();
        }
    } else {
        createNewConsumer();
    }
}

function createNewConsumer() {
    consumer = new Consumer(
        client,
        [{ 
            topic: 'transit-events',
            partition: 0,
            offset: -1
        }],
        {
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            fetchMaxWaitMs: 100,
            fetchMinBytes: 1,
            fetchMaxBytes: 1024 * 1024,
            groupId: 'transit-consumer-group',
            sessionTimeout: 15000,
            protocol: ['roundrobin'],
            fromOffset: 'latest',
            encoding: 'utf8',
            keyEncoding: 'utf8',
            commitOffsetsOnFirstJoin: true,
            outOfRangeOffset: 'earliest'
        }
    );

    consumer.on('ready', function () {
        console.log('Consumer is ready');
    });

    consumer.on('message', async function (message) {
        try {
            const event = JSON.parse(message.value);
            console.log('Received Event:', event);
            
            if (event.eventType === 'DELAY') {
                console.log(`Alert! ${event.lineId} delayed at ${event.stopId}`);
                // Add your event processing logic here
                await processEvent(event);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    consumer.on('error', function (err) {
        console.error('Consumer Error:', err);
        if (err.name === 'ConnectionError' || err.code === 'ECONNREFUSED') {
            console.log('Connection error, attempting to reconnect...');
            setTimeout(() => {
                console.log('Attempting reconnection...');
                initializeConsumer();
            }, 5000);
        }
    });

    consumer.on('offsetOutOfRange', function (err) {
        console.error('Offset out of range:', err);
        consumer.setOffset('transit-events', 0, 'earliest');
    });
}

// Example event processing function
async function processEvent(event) {
    try {
        // Add your business logic here
        // For example, saving to database, sending notifications, etc.
        console.log('Processing event:', event);
    } catch (error) {
        console.error('Error processing event:', error);
        throw error;
    }
}

// Graceful shutdown handling
function cleanup() {
    if (consumer) {
        try {
            consumer.close(true, () => {
                console.log('Consumer closed gracefully');
                client.close(() => {
                    console.log('Client closed gracefully');
                    process.exit(0);
                });
            });
        } catch (error) {
            console.error('Error during cleanup:', error);
            process.exit(1);
        }
    } else {
        process.exit(0);
    }
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Monitor client connection
client.on('ready', () => {
    console.log('Kafka client is ready');
});

client.on('error', (error) => {
    console.error('Kafka client error:', error);
});

// Start the consumer
async function start() {
    try {
        initializeConsumer();
    } catch (error) {
        console.error('Failed to start consumer:', error);
        process.exit(1);
    }
}

start();

module.exports = { start, cleanup };