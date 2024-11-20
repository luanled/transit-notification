require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const producer = require('./kafka/producer');
const consumer = require('./kafka/consumer');
const eventGenerator = require('./mock/generateEvent');
const streamProcessor = require('./kafka/streamProcessor');
const cassandraService = require('./database/cassandraService');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const port = process.env.PORT || 3000;
const interval = 5000;

// Middleware setup
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api/events', eventRoutes);
// SSE endpoint for real-time analytics
app.get('/api/analytics/stream', (req, res) => {
  console.log('Client connected to SSE');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:8080'
  });

  // Send initial data immediately
  const initialData = streamProcessor.getAnalytics();
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // Function to send updates
  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to updates
  streamProcessor.on('dataUpdated', sendUpdate);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log('Client disconnected from SSE');
    streamProcessor.removeListener('dataUpdated', sendUpdate);
  });
});

// Regular routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'kafka-transit-notification-system'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Kafka Transit Notification System Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      events: '/api/events',
      analytics: '/api/analytics/stream',
      eventsByLine: '/api/events/line/:lineId',
      eventsByType: '/api/events/line/:lineId/type/:eventType',
      eventsByStation: '/api/events/station/:stopId',
      latestEvents: '/api/events/latest',
      statistics: '/api/events/stats'
    }
  });
});


app.post('/api/events', async (req, res) => {
  try {
    const event = req.body;
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

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    endpoint: req.originalUrl
  });
});



function gracefulShutdown() {
  console.log('Starting graceful shutdown...');

  const shutdownTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Shutdown timed out')), 10000);
  });

  const performShutdown = new Promise(async (resolve) => {
    try {
      if (eventGenerator.isRunning()) {
        eventGenerator.stopGenerator();
      }
      if (producer.cleanup) {
        await producer.cleanup();
      }
      if (consumer.cleanup) {
        await consumer.cleanup();
      }
      await streamProcessor.shutdown();
      server.close(() => {
        console.log('Express server closed');
        resolve();
      });
    } catch (error) {
      console.error('Error during shutdown:', error);
      resolve();
    }
  });

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

const server = app.listen(port, async () => {
  try {
    console.log(`Backend server running on port ${port}`);

    await producer.initializeProducer?.();
    console.log('Kafka producer initialized');

    await consumer.start?.();
    console.log('Kafka consumer started');

    await streamProcessor.start();
    console.log('Stream processor started');

    if (process.env.NODE_ENV === 'development') {
      eventGenerator.startGenerator(interval);
      console.log('Mock event generator started');
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

module.exports = app;