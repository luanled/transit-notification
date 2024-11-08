'use client'
import React, { useEffect, useState } from 'react';
import DashboardComponent from '../../../components/pages/dashboard';

const Dashboard = () => {
  const [fleetData, setFleetData] = useState([]);

  useEffect(() => {
    // Fetch data or set up WebSocket connection for real-time data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fleet-data'); // Replace with your backend endpoint
        const data = await response.json();
        setFleetData(data);
      } catch (error) {
        console.error('Error fetching fleet data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Fleet Tracking Dashboard</h1>
      <DashboardComponent fleetData={fleetData} />
    </div>
  );
};

export default Dashboard;
