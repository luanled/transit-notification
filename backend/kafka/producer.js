const kafka = require('kafka-node');
const Producer = kafka.Producer;

// Use the Docker service name 'kafka' instead of localhost
const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' });
const producer = new Producer(client);

function sendEvent(event) {
  const payloads = [
    {
      topic: 'transit-events',
      messages: JSON.stringify(event),
    },
  ];

  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Error sending event:', err);
    } else {
      console.log('Event sent:', data);
    }
  });
}

module.exports = { sendEvent };
