require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const producer = require('./kafka/producer');
const consumer = require('./kafka/consumer');

app.get('/', (req, res) => {
  res.send('Kafka Transit Notification System Backend');
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  // Optionally start the mock event generator
  require('./mock/generateEvent');
});
