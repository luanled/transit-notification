const kafka = require('kafka-node');
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' }); // Adjust port if necessary
const consumer = new Consumer(client, [{ topic: 'transit-events', partition: 0 }], { autoCommit: true });

consumer.on('message', function (message) {
  const event = JSON.parse(message.value);
  console.log('Received Event:', event);
  
  // Example: If the event is a delay, log it or send a notification
  if (event.eventType === 'DELAY') {
    console.log(`Alert! ${event.lineId} delayed at ${event.stopId}`);
  }
});

consumer.on('error', function (err) {
  console.error('Consumer Error:', err);
});
