const kafka = require('../kafka/producer'); // Ensure this path is correct

// Generate mock data every 10 seconds
setInterval(() => {
    const randomEvent = {
        eventType: ['ARRIVAL', 'DEPARTURE', 'DELAY', 'CANCELLATION'][Math.floor(Math.random() * 4)],
        lineId: 'Line ' + Math.ceil(Math.random() * 5),
        stopId: 'Stop ' + String.fromCharCode(65 + Math.floor(Math.random() * 6)), // Stop A to F
        scheduledTime: new Date().toISOString(),
        actualTime: new Date().toISOString(),
        delayReason: Math.random() > 0.5 ? 'Mechanical Issue' : 'Traffic',
    };

    kafka.sendEvent(randomEvent); // Call the sendEvent function
}, 10000); // Emit events every 10 seconds
