require('dotenv').config();
const express = require('express');
const app = express();
const kafka = require('../config/kafka');
const connectDB = require('../config/mongo');

connectDB().then(() => {
  app.listen(3000, () => {
    console.log("Backend server running on port 3000");
  });
}).catch(console.error);
