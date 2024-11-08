// frontend/components/pages/dashboard.js
import React from 'react';

const DashboardComponent = ({ fleetData }) => {
  return (
    <div>
      {fleetData.length === 0 ? (
        <p>Loading fleet data...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Status</th>
              <th>Location</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {fleetData.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicle.status}</td>
                <td>{vehicle.location}</td>
                <td>{vehicle.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardComponent;
