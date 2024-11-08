const { Kafka } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'fleet-tracking-app',
  brokers: ['localhost:9092'],
});
module.exports = kafka;
