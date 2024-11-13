require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const producer = require('./kafka/producer');
const consumer = require('./kafka/consumer');
const eventGenerator = require('./mock/generateEvent');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging middleware

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'kafka-transit-notification-system'
  });
});

// Main route
app.get('/', (req, res) => {
  res.json({
    message: 'Kafka Transit Notification System Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      events: '/api/events'
    }
  });
});

// API routes
app.post('/api/events', async (req, res) => {
  try {
    const event = req.body;
    // Basic validation
    if (!event.eventType || !event.lineId || !event.stopId) {
      return res.status(400).json({
        error: 'Missing required fields: eventType, lineId, stopId'
      });
    }

    await producer.sendEvent(event);
    res.status(200).json({
      message: 'Event sent successfully',
      event
    });
  } catch (error) {
    console.error('Failed to send event:', error);
    res.status(500).json({
      error: 'Failed to send event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    endpoint: req.originalUrl
  });
});

// Graceful shutdown function
function gracefulShutdown() {
  console.log('Starting graceful shutdown...');
  
  // Create a promise that rejects after a timeout
  const shutdownTimeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Shutdown timed out'));
    }, 10000); // 10 seconds timeout
  });

  // Actual shutdown logic
  const performShutdown = new Promise(async (resolve) => {
    try {
      // Close Kafka producer
      if (producer.cleanup) {
        await producer.cleanup();
      }
      
      // Close Kafka consumer
      if (consumer.cleanup) {
        await consumer.cleanup();
      }
      
      // Close Express server
      server.close(() => {
        console.log('Express server closed');
        resolve();
      });
    } catch (error) {
      console.error('Error during shutdown:', error);
      resolve(); // Resolve anyway to ensure we exit
    }
  });

  // Race between timeout and clean shutdown
  Promise.race([performShutdown, shutdownTimeout])
    .then(() => {
      console.log('Graceful shutdown completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Shutdown error:', error);
      process.exit(1);
    });
}

// Start server and initialize Kafka
const server = app.listen(port, async () => {
  try {
    console.log(`Backend server running on port ${port}`);
    
    // Initialize Kafka producer
    if (producer.initializeProducer) {
      await producer.initializeProducer();
      console.log('Kafka producer initialized');
    }
    
    // Start Kafka consumer
    if (consumer.start) {
      await consumer.start();
      console.log('Kafka consumer started');
    }

    // Start mock event generator if in development mode
    if (process.env.NODE_ENV === 'development') {
      require('./mock/generateEvent');
      console.log('Mock event generator started');
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
});

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

eventGenerator.startGenerator(5000); // Every 5 seconds
// Check if running
console.log('Generator running:', eventGenerator.isRunning());

module.exports = app; // Export for testing