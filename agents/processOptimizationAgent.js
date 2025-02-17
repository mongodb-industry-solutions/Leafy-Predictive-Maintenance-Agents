
const { cohereLLM } = require('../server/cohereLangChainSetup');
const sharedDataStore = require('../shared/sharedDataStore_1');
const predictiveModel = require('../models/predictiveModel');
const tools = require('./tools');
const { trim } = require('lodash');

async function execute(input) {
  const { input_data, maintenance_findings, quality_feedback } = input;
  const input_data_json = JSON.parse(input_data);
  const predictedImpact = predictiveModel.predict(parseFloat(input_data_json.spindleSpeed));
  // Prepare the tools description
  const toolsDescription = tools
    .map((tool) => `${tool.name}: ${tool.description}`)
    .join('\n');

  const system_message = `
  You are the **Process Optimization AI Agent**, a specialist in enhancing production efficiency within a smart factory environment.

  **Role and Responsibilities:**
  - **Analyze Production Processes:** Evaluate current manufacturing processes to identify inefficiencies and bottlenecks.
  - **Optimize Parameters:** Adjust production parameters such as spindle speed, feed rate, and temperature to maximize efficiency and output quality.
  - **Integrate Insights:** Incorporate findings from the Predictive Maintenance and Quality Assurance Agents to inform optimization strategies.
  - **Utilize Predictive Models:** Leverage predictive models to anticipate the impact of parameter changes on production outcomes.
  
  You have access to a search_documents tool which you must use


Given the following machine sensor data:
${input_data}

Maintenance findings from the Predictive Maintenance Agent:
${maintenance_findings || 'No maintenance findings'}

Quality feedback from the Quality Assurance Agent:
${quality_feedback || 'No feedback'}

Predicted impact from ML model:
${predictedImpact}

And use the search_documents tool


**Objective:**
As the optimization expert, analyze the provided data and maintenance findings and write down what tool you need to use and what do you need to search

**Output Requirements:**
Your function arguments should be the query you want to run in search_documents tool 
You must include query for the tool in your response.

**Example Output:**
spindle motor lubrication guidelines


`;


const response = await cohereLLM.chat(
  {
    model: "command-r",
    messages: [
      { 
        role: "user",
        content: system_message
      }
    ],
        tools: [
          {
            type:"function",
            function:{
                name:"search_documents",
                description:"Search through machine manuals and work orders for relevant information.",
                parameters: {
                    "type":"object"
                }
          }
        }
          
        ]
  }
)



  const toolRequests = response.message.toolCalls;


  const { toolName, toolInput } = extractToolDetails(toolRequests);
  const tool = tools.find((t) => t.name === toolName);
  const toolResult = await tool.func(toolInput);


  const newPrompt = `
  You previously requested to use the tool ${toolName} with input "${toolInput}" and received the following result:
  
  ${toolResult}
  
  Based on this information, provide the top 2 specific process optimization recommendations to enhance efficiency, in bullet points.
  
  Focus on production process adjustments only.
  `;


  const finalResponse = await cohereLLM.chat(
    {
      model: "command-r",
      messages: [
        { role: "user",
          content: newPrompt
        }
      ]
    }
  )

  trimResponse = finalResponse.message.content[0].text;
  






  const actualOutcome = parseFloat(input_data_json.surfaceFinish);
  predictiveModel.addDataPoint(parseFloat(input_data_json.spindleSpeed), actualOutcome);
  
  
  
  
  
  
  
  await sharedDataStore.write('optimizationData', trimResponse);

  await sharedDataStore.addHistory({
    timestamp: new Date(),
    inputData: input_data_json,
    agent: 'Process Optimization',
    output: trimResponse,
    surfaceFinish: actualOutcome,
  });

  return trimResponse;
}




function extractToolDetails(toolRequests) {
  // Check if the input is a valid array


  // Initialize variables to store tool name and inputs
  let toolName = '';
  const toolInputs = [];

  toolRequests.forEach(request => {
    // Validate the structure of each tool request object
    if (
      request &&
      request.function &&
      typeof request.function.name === 'string' &&
      typeof request.function.arguments === 'string'
    ) {
      // Extract the tool name
      const currentToolName = request.function.name;

      // Parse the JSON string in 'arguments' to get the tool input
      let args;
      try {
        args = request.function.arguments;
      } catch (error) {
        console.error(`Error parsing arguments for tool "${currentToolName}":`, error);

        return; // Skip this tool request if parsing fails
      }

      // Assuming the tool input is under the 'query' key
      const toolInput = args;

      if (!toolInput) {
        console.warn(`No 'query' found for tool "${currentToolName}".`);

        return; // Skip if 'query' is not present
      }

      // Assign the tool name (assuming all tools have the same name)
      if (!toolName) {
        toolName = currentToolName;
      } else if (toolName !== currentToolName) {
        console.log(`Multiple tool names detected. Current tool: "${toolName}", New tool: "${currentToolName}".`);
        // Optionally handle multiple tools if necessary
      }

      // Add the tool input to the array
      toolInputs.push(toolInput);
    } else {
      console.log('Invalid tool request object structure:', request);
    }
  });

  // Combine all tool inputs with ' and '
  const combinedToolInput = toolInputs.join(' and ');


  return {
    toolName: toolName,
    toolInput: combinedToolInput
  };
}



module.exports = { execute };
