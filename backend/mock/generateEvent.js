const producer = require('../kafka/producer');

// Transit line configurations
const TRANSIT_LINES = [
    { id: 'RED-LINE', name: 'Red Line', stops: ['A1', 'A2', 'A3', 'A4', 'A5'] },
    { id: 'BLUE-LINE', name: 'Blue Line', stops: ['B1', 'B2', 'B3', 'B4', 'B5'] },
    { id: 'GREEN-LINE', name: 'Green Line', stops: ['C1', 'C2', 'C3', 'C4'] }
];

const EVENT_TYPES = {
    ARRIVAL: {
        weight: 0.4,
        delays: [0, 1, 2, 3, 5],
        reasons: []
    },
    DEPARTURE: {
        weight: 0.4,
        delays: [0, 1, 2, 3, 5],
        reasons: []
    },
    DELAY: {
        weight: 0.15,
        delays: [5, 10, 15, 20, 30],
        reasons: [
            'Mechanical Issue',
            'Signal Problem',
            'Weather Conditions',
            'Track Maintenance',
            'Heavy Passenger Load',
            'Medical Emergency',
            'Security Incident'
        ]
    },
    CANCELLATION: {
        weight: 0.05,
        delays: null,
        reasons: [
            'Severe Weather',
            'Technical Failure',
            'Emergency Track Repairs',
            'Power Outage',
            'Staff Shortage'
        ]
    }
};

// Utility functions
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getWeightedEventType() {
    const random = Math.random();
    let sum = 0;
    for (const [type, config] of Object.entries(EVENT_TYPES)) {
        sum += config.weight;
        if (random <= sum) return type;
    }
    return 'ARRIVAL'; // fallback
}

function generateDelay(eventType) {
    const delays = EVENT_TYPES[eventType].delays;
    return delays ? getRandomItem(delays) : 0;
}

function generateReason(eventType) {
    const reasons = EVENT_TYPES[eventType].reasons;
    return reasons.length > 0 ? getRandomItem(reasons) : null;
}

function addMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

async function generateAndSendEvent() {
    try {
        const line = getRandomItem(TRANSIT_LINES);
        const eventType = getWeightedEventType();
        const delayMinutes = generateDelay(eventType);
        const scheduledTime = new Date();
        const actualTime = addMinutesToDate(scheduledTime, delayMinutes);

        const event = {
            eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            eventType,
            lineId: line.id,
            lineName: line.name,
            stopId: getRandomItem(line.stops),
            scheduledTime: scheduledTime.toISOString(),
            actualTime: actualTime.toISOString(),
            delayMinutes,
            status: eventType === 'CANCELLATION' ? 'CANCELLED' : 'ACTIVE',
            timestamp: new Date().toISOString()
        };

        // Add reason if applicable
        const reason = generateReason(eventType);
        if (reason) {
            event.reason = reason;
        }

        // Add weather info randomly
        if (Math.random() > 0.7) {
            event.weather = getRandomItem([
                'Rain', 'Snow', 'Clear', 'Foggy', 'Stormy'
            ]);
        }

        console.log('Generating event:', event);
        await producer.sendEvent(event);
        console.log('Event sent successfully');

    } catch (error) {
        console.error('Failed to generate and send event:', error);
    }
}

// Control variables for the generator
let generatorInterval;
const DEFAULT_INTERVAL = 10000; // 10 seconds
let isRunning = false;

// Generator control functions
function startGenerator(interval = DEFAULT_INTERVAL) {
    if (isRunning) {
        console.log('Generator is already running');
        return;
    }

    isRunning = true;
    console.log(`Starting event generator (interval: ${interval}ms)`);
    
    // Generate first event immediately
    generateAndSendEvent();
    
    // Set up interval for subsequent events
    generatorInterval = setInterval(generateAndSendEvent, interval);
}

function stopGenerator() {
    if (!isRunning) {
        console.log('Generator is not running');
        return;
    }

    clearInterval(generatorInterval);
    isRunning = false;
    console.log('Event generator stopped');
}

// Handle process termination
process.on('SIGTERM', stopGenerator);
process.on('SIGINT', stopGenerator);

// Export control functions
module.exports = {
    startGenerator,
    stopGenerator,
    isRunning: () => isRunning,
    updateInterval: (newInterval) => {
        stopGenerator();
        startGenerator(newInterval);
    }
};

// Start the generator if this file is run directly
if (require.main === module) {
    startGenerator();
}