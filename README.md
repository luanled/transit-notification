# Fleet Tracking Platform

A real-time fleet tracking and delivery optimization platform that allows users to visualize and interact with live fleet data. This platform uses a microservices-based backend with Kafka and MongoDB, alongside a Next.js frontend for dashboard and analytics.

## Project Structure

- Backend (Node.js, Kafka, MongoDB): Handles real-time data ingestion, processing, and analytics for fleet tracking and route optimization
- Frontend (Next.js): Provides a map-based dashboard for real-time tracking and data visualization
- Security: JWT authentication to secure backend APIs and frontend routes

## Features

- Real-time vehicle tracking on an interactive map
- Data visualizations and analytics insights (e.g., route optimization, ETAs)
- Secure login and user-specific data access

## Getting Started

### Prerequisites

- Node.js and npm (for both frontend and backend)
- Docker (for running Kafka and MongoDB)
- Google Maps API Key (for map integration in the frontend)

### Setup

#### Clone the Repository

```bash
git clone https://github.com/your-username/fleet-tracking-platform.git
cd fleet-tracking-platform
```

#### Environment Variables

Create `.env` files in both the backend and frontend directories and fill them in as required.

**Backend .env:**
```bash
MONGO_URI=mongodb://localhost:27017/fleetDB
JWT_SECRET=your_jwt_secret
```

**Frontend .env.local:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Backend Setup

#### Navigate to the Backend Directory
```bash
cd backend
```

#### Install Dependencies
```bash
npm install
```

#### Run Kafka and MongoDB
(using Docker Compose or individual containers as needed)
- Ensure Kafka is available at localhost:9092
- Ensure MongoDB is available at localhost:27017

#### Start the Backend Server
```bash
npm start
```

The backend will run on http://localhost:3000 and will handle real-time data ingestion, processing, and provide endpoints for the frontend.

### Frontend Setup

#### Navigate to the Frontend Directory
```bash
cd ../frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start the Frontend Server
```bash
npm run dev
```

The frontend will run on http://localhost:3000, providing a dashboard with a map and real-time data visualization.

## Running the Project

To run the entire platform, ensure both the backend and frontend are running simultaneously. Access the frontend at http://localhost:3000/dashboard for real-time tracking and analytics.

## Folder Structure

```
fleet-tracking-platform/
├── backend/                   # Node.js backend with Kafka and MongoDB
│   ├── config/               # Config files for Kafka and MongoDB
│   ├── src/                  # Source files for backend services
│   ├── .env                  # Environment variables for backend
│   └── package.json          # Backend dependencies
├── frontend/                 # Next.js frontend with map and analytics
│   ├── components/           # Reusable components
│   ├── pages/               # Pages and routes for the frontend
│   ├── .env.local           # Environment variables for frontend
│   └── package.json         # Frontend dependencies
└── README.md                # Project documentation
```
