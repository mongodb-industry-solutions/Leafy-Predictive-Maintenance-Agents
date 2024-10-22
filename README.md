# AI Agents Demo with MongoDB Atlas

This demo demonstrates how multiple AI agents work together in a predictive maintenance scenario.

Each agent analyzes sensor data to perform the following tasks:

Predictive Maintenance Agent: Predicts equipment failures by analyzing machine sensor data.

Process Optimization Agent: Optimizes production parameters based on maintenance findings.

Quality Assurance Agent: Evaluates product quality and provides feedback for continuous improvement.

This demo leverages Langchain, Cohere Embed and LLM models and Atlas Vector Search.

Feedback is always welcome. Please provide your feedback to humza.akhtar@mongodb.com


To run the demo setup env variables as follows

Create an .env file in root folder and set the following variables

```
COHERE_API_KEY=<Your Cohere API Key>
MONGODB_ATLAS_URI=<Your MongoDB connection String>
MONGODB_ATLAS_DB=smart_factory
MONGODB_ATLAS_AGENTS_DOCUMENTS_COLLECTION=ai_agents_documents
MONGODB_ATLAS_AGENTS_HISTORY_COLLECTION=ai_agents_history
MONGODB_ATLAS_AGENTS_KEYVALUE_COLLECTION=ai_agents_keyValueStore
MONGODB_ATLAS_AGENTS_SENSORDATA_COLLECTION=ai_agents_sensor_data
```

Install dependencies
```
npm i
```

Generate sensor data and documents:
```
node data/syntheticDataGenerator.js
node data/generateDocuments.js
```
Vectorize and store Documents into MongoDB Atlas
```
node server/indexDocuments.js
```


Run backend server first
```
npm start
```
Then open another terminal and run front end server
```
cd frontend
npm start
```

view the appliction:

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

Click on Start Agents button to run the demo

Observe the output of the agents. The data will start flowing in after 10 seconds or so.

The data only refreshes once every 30 seconds giving you enough time to review the output.

You can change the frequency from 

```
agents/orchestrator.js
```


