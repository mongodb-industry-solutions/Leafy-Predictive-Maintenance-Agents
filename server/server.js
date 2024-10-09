
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const runAgents = require('../agents/orchestrator');
const sharedDataStore = require('../shared/sharedDataStore_1');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:4001', // Allow requests from this origin
    methods: ['GET', 'POST'],        // Allowed HTTP methods
  },
});

app.use('/graphs', express.static(path.join(__dirname, '../graphs')));

const uri = process.env.MONGODB_ATLAS_URI;
const client = new MongoClient(uri);
const db = process.env.MONGODB_ATLAS_DB;
const col = process.env.MONGODB_ATLAS_AGENTS_SENSORDATA_COLLECTION;

let isRunning = false; 
let isExecuting = false; 

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('startAgents', () => {
    console.log('Start command received');
    if (!isExecuting) {
      isRunning = true;
      isExecuting = true;
      startAgentExecution();
    }
  });

  socket.on('stopAgents', () => {
    console.log('Stop command received');
    isRunning = false;
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Agents should continue running even if clients disconnect
  });
});

async function startAgentExecution() {
  try {
    await client.connect();
    const database = client.db(db);
    const collection = database.collection(col);

    while (isRunning) {
      console.log('Starting agent execution loop');
      const cursor = collection.find().sort({ timestamp: 1 });
      const dataPoints = await cursor.toArray();

      for (const dataPoint of dataPoints) {
        if (!isRunning) {
          break;
        }


        try {
          const agentOutputs = await runAgents(dataPoint);

          const kpis = await sharedDataStore.calculateKPIs();
          console.log('Calculated KPIs:', kpis);

          // send to all connected clients
          io.emit('agentData', { inputData: dataPoint, ...agentOutputs, kpis });
        } catch (error) {
          console.error('Error during agent execution:', error);
        }

        // wait for 1 min before processing the next data point. This is a limitation of Cohere Trial API Key
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }

      if (!isRunning) {
        break;
      }

      console.log('Sensor data finished. Repeating...');
    }
  } catch (err) {
    console.error('Error in startAgentExecution:', err);
  } finally {
    await client.close();
    isExecuting = false; // reset execution flag when loop exits
    console.log('Agent execution completed');
  }
}

server.listen(4000, () => console.log('Server running on port 4000'));
