<template>
    <div>
      <h1>Real-Time Transit Updates</h1>
      <ul>
        <li v-for="event in events" :key="event.lineId">
          {{ event.eventType }} - {{ event.lineId }} at {{ event.stopId }}: {{ event.actualTime }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        events: [],
      };
    },
    mounted() {
      const socket = new WebSocket('ws://localhost:3000'); // Assuming WebSocket server runs on the backend
      socket.onmessage = (event) => {
        const transitEvent = JSON.parse(event.data);
        this.events.push(transitEvent);
      };
    },
  };
  </script>
  