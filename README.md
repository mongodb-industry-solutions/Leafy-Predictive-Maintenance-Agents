# AI Agents Demo with MongoDB Atlas

To run the demo
setup env variables as

CReate an .env file in root folder and set the following variables

COHERE_API_KEY=<Your Cohere API Key>
MONGODB_ATLAS_URI=<Your MongoDB connection String>
MONGODB_ATLAS_DB=smart_factory
MONGODB_ATLAS_AGENTS_DOCUMENTS_COLLECTION=ai_agents_documents
MONGODB_ATLAS_AGENTS_HISTORY_COLLECTION=ai_agents_history
MONGODB_ATLAS_AGENTS_KEYVALUE_COLLECTION=ai_agents_keyValueStore
MONGODB_ATLAS_AGENTS_SENSORDATA_COLLECTION=ai_agents_sensor_data


Install dependencies

npm i


Generate sensor data and documents:

node data/syntheticDataGenerator.js
node data/generateDocuments.js

Vectorize and store Documents into MongoDB Atlas

node server/indexDocuments.js



Run backend server first

npm start

Then open another terminal and run front end server

cd frontend
npm start

view the appliction:

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

Click on Start Agents button to run the demo
Observe the output of the agents. It only changes once per min giving you enough time to review the output.
