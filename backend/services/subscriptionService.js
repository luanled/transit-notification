const nodemailer = require('nodemailer');
const cassandraService = require('../database/cassandraService');

class SubscriptionService {
    constructor() {
        this.mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async setup() {
        try {
            // Verify email connection
            await this.mailer.verify();
            console.log('Email service initialized');
        } catch (error) {
            console.error('Error setting up email service:', error);
            throw error;
        }
    }

    async addSubscription(email, station, line) {
        return cassandraService.addSubscription(email, station, line);
    }

    async sendNotification(email, station, line, event) {
        const subject = `Transit Alert: ${event.eventType} at ${station}`;
        let message = `A ${event.eventType.toLowerCase()} has been reported at ${station} on the ${line} Line.\n\n`;

        if (event.eventType === 'DELAY') {
            message += `Delay duration: ${event.delayMinutes} minutes\n`;
        }

        if (event.reason) {
            message += `Reason: ${event.reason}\n`;
        }

        message += `\nScheduled time: ${new Date(event.scheduledTime).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles'
        })}\n`;

        message += `Actual time: ${new Date(event.actualTime).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles'
        })}\n`;

        await this.mailer.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject,
            text: message
        });
    }

    async processEvent(event) {
        if (['DELAY', 'CANCELLATION'].includes(event.eventType)) {
            const subscribers = await cassandraService.getSubscriptionsForStation(event.stopId);

            const oneMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
            const eventTime = new Date(event.timestamp);
            
            if (eventTime < oneMinutesAgo) {
                return; // Skip old events
            }
            
            for (const subscriber of subscribers) {
                try {
                    await this.sendNotification(
                        subscriber.email,
                        event.stopId,
                        event.lineId,
                        event
                    );
                    console.log(`Notification sent to ${subscriber.email} for ${event.eventId}`);
                } catch (error) {
                    console.error(`Failed to send notification to ${subscriber.email}:`, error);
                }
            }
        }
    }

    async shutdown() {
        // Nothing to clean up for nodemailer
        console.log('Email service shut down');
    }
}

module.exports = new SubscriptionService();