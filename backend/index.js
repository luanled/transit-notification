require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const producer = require('./kafka/producer');
const consumer = require('./kafka/consumer');
const eventGenerator = require('./mock/generateEvent');
const streamProcessor = require('./kafka/streamProcessor');

const app = express();
const port = process.env.PORT || 3000;
const interval = 10000;

// Middleware setup remains the same...
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes remain the same...
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
      events: '/api/events'
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

app.get('/api/analytics', async (req, res) => {
  try {
      const analytics = streamProcessor.getAnalytics();
      
      // Format the response with additional metadata
      const response = {
          timestamp: new Date().toISOString(),
          messageCount: streamProcessor.messageCount,
          analytics: {
              delaysByLine: analytics.delaysByLine || {},
              incidentsByStop: analytics.incidentsByStop || {},
              serviceHealth: analytics.serviceHealth || {}
          },
          status: 'active',
          consumingTopics: streamProcessor.topics.map(t => t.topic)
      };

      res.json(response);
  } catch (error) {
      console.error('Failed to fetch analytics:', error);
      res.status(500).json({
          error: 'Failed to fetch analytics',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
});

// Error handling middleware remains the same...
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