
import React, { useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import Graph from 'react-graph-vis';
import './App.css';

function App() {
  // State variables
  const [socket, setSocket] = useState(null);
  const [agentData, setAgentData] = useState({});
  const [kpis, setKpis] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const newSocket = socketIOClient('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('agentData', (data) => {
      setAgentData(data);
      setKpis(data.kpis);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); 

  const handleStart = () => {
    if (socket) {
      socket.emit('startAgents');
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('stopAgents');
      setIsRunning(false);
    }
  };

  const graphData = {
    nodes: [
      { id: 1, label: 'Predictive Maintenance Agent', color: '#ff9999' },
      { id: 2, label: 'Process Optimization Agent', color: '#99ff99' },
      { id: 3, label: 'Quality Assurance Agent', color: '#9999ff' },
    ],
    edges: [
      { id: 1, from: 1, to: 2, label: 'maintenance_findings' },
      { id: 2, from: 2, to: 3, label: 'optimization_findings' },
      { id: 3, from: 3, to: 1, label: 'quality_feedback' },
      { id: 4, from: 3, to: 2, label: 'quality_feedback' },
    ],
  };

  const options = {
    height: '500px',
    layout: {
      improvedLayout: true,
      hierarchical: false,
    },
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -100,
        centralGravity: 0.01,
        springLength: 230,
        springConstant: 0.08,
      },
      maxVelocity: 146,
      minVelocity: 0.1,
      timestep: 0.35,
      stabilization: {
        enabled: true,
        iterations: 1000,
        updateInterval: 25,
      },
    },
    nodes: {
      shape: 'box',
      size: 16,
      font: {
        size: 16,
        face: 'Arial',
      },
    },
    edges: {
      font: {
        size: 14,
        align: 'middle',
        face: 'Arial',
      },
      color: 'gray',
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 },
      },
      smooth: {
        type: 'dynamic',
      },
    },
  };

  const events = {
    select: ({ nodes }) => {
      if (nodes.length > 0) {
        setSelectedNode(nodes[0]);
      } else {
        setSelectedNode(null);
      }
    },
  };

  const nodeDetails = {
    1: agentData.maintenance,
    2: agentData.optimization,
    3: agentData.quality,
  };

  return (
    <div className="App">
      <h1>MongoDB AI Agents Collaboration Demo</h1>
      <div className="explanation">
        <p>
          This demo demonstrates how multiple AI agents work together in a predictive maintenance scenario.
          Each agent analyzes sensor data to perform the following tasks:
        </p>
        <ul>
          <li><strong>Predictive Maintenance Agent:</strong> Predicts equipment failures by analyzing machine sensor data.</li>
          <li><strong>Process Optimization Agent:</strong> Optimizes production parameters based on maintenance findings.</li>
          <li><strong>Quality Assurance Agent:</strong> Evaluates product quality and provides feedback for continuous improvement.</li>
        </ul>
        <p>
          This demo leverages Langchain, Cohere Embed and LLM models and Atlas Vector Search.
        </p>
        <p>
          Feedback is always welcome. Please provide your feedback to humza.akhtar@mongodb.com
        </p>
      </div>
      <div className="control-buttons">
        <button onClick={handleStart} disabled={isRunning}>
          Start AI Agents
        </button>
        <button onClick={handleStop} disabled={!isRunning}>
          Stop AI Agents
        </button>
      </div>
      <div className="graph-container">
        <Graph
          graph={graphData}
          options={options}
          events={events}
          getNetwork={(network) => {
            // Optional: access to vis.js network API for future purposes 
          }}
        />
      </div>
      <div className="data-display-container">
        <div className="data-section">
          <h2>Machine Data</h2>
          {agentData.inputData ? (
            <pre>{formatJSON(agentData.inputData)}</pre>
          ) : (
            <p>No data available</p>
          )}
        </div>
        <div className="agent-details-container">
          <div className="agent-details">
            <h2>Predictive Maintenance Agent</h2>
            {agentData.maintenance ? (
              <div dangerouslySetInnerHTML={{ __html: formatText(agentData.maintenance) }} />
            ) : (
              <p>No data available</p>
            )}
          </div>
          <div className="agent-details">
            <h2>Process Optimization Agent</h2>
            {agentData.optimization ? (
              <div dangerouslySetInnerHTML={{ __html: formatText(agentData.optimization) }} />
            ) : (
              <p>No data available</p>
            )}
          </div>
          <div className="agent-details">
            <h2>Quality Assurance Agent</h2>
            {agentData.quality ? (
              <div dangerouslySetInnerHTML={{ __html: formatText(agentData.quality) }} />
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      </div>
      <div className="kpi-container">
        <h2>Key Performance Indicators</h2>
        <ul>
          <li>Average Surface Finish: {kpis.averageSurfaceFinish}</li>
          {/* can add more KPIs here */}
        </ul>
      </div>
    </div>
  );
}

function formatText(text) {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const listItems = lines.map((line) => `<li>${line}</li>`).join('');
  return `<ul>${listItems}</ul>`;
}

function formatJSON(data) {
  return data ? JSON.stringify(data, null, 2) : 'No data available.';
}

export default App;
