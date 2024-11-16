const producer = require('../kafka/producer');

// Transit line configurations
const TRANSIT_LINES = [
    {
        id: 'BLUE',
        name: 'Blue Line',
        stops: ['Santa Teresa', 'Cottle', 'Snell', 'Blossom Hill', 'Ohlone/Chynoweth', 'Branham', 'Capitol', 'Curtner', 'Tamien', 'Virginia', "Children's Discovery Museum", 'Convention Center', 'Paseo de San Antonio', 'Santa Clara', 'St. James', 'Japantown/Ayer', 'Civic Center', 'Gish', 'Metro/Airport', 'Karina', 'Component', 'Bonaventura', 'Orchard', 'River Oaks', 'Tasman',, 'Reamwood', 'Vienna', 'Fair Oaks', 'Crossman', 'Borregas', 'Lockheed Martin', 'Baypointe']
    },
    {
        id: 'GREEN',
        name: 'Green Line',
        stops: ['Winchester', 'Downtown Campbell', 'Hamilton', 'Bascom', 'Fruitdale', 'Race', 'San Jose Diridon', 'San Fernando', 'Paseo de San Antonio', 'Santa Clara', 'St. James', 'Japantown/Ayer', 'Civic Center', 'Gish', 'Metro/Airport', 'Karina', 'Component', 'Bonaventura', 'Orchard', 'River Oaks', 'Tasman', 'Champion', 'Great America', 'Old Ironsides']
    },
    {
        id: 'ORANGE',
        name: 'Orange Line',
        stops: ['Mountain View', 'Whisman', 'Middlefield', 'Bayshore/NASA', 'Moffett Park', 'Lockheed Martin', 'Borregas', 'Crossman', 'Fair Oaks', 'Vienna', 'Reamwood', 'Old Ironsides', 'Great America', 'Lick Mill', 'Champion', 'Baypointe', 'Cisco Way', 'Alder', 'Great Mall', 'Milpitas', 'Cropley', 'Hostetter', 'Berryessa', 'Penitencia Creek', 'McKee', 'Alum Rock']
    }
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