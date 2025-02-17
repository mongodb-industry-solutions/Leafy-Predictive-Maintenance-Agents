
const { cohereLLM } = require('../server/cohereLangChainSetup');
const sharedDataStore = require('../shared/sharedDataStore_1');
const tools = require('./tools');


async function execute(input) {
  const { input_data, quality_feedback } = input;

  const history = await sharedDataStore.getHistory();
  const recentIssues = history.slice(-5).map((h) => h.qualityIssues).join('; ');


  // Prepare the tools description
  const toolsDescription = tools
    .map((tool) => `${tool.name}: ${tool.description}`)
    .join('\n');


 

 const system_message = `
 You are the **Predictive Maintenance AI Agent**, a specialist in machinery maintenance within a smart factory environment.

 **Role and Responsibilities:**
 - **Monitor Equipment Health:** Continuously analyze machine sensor data to assess the current health status of equipment.
 - **Predict Failures:** Utilize historical data and real-time sensor readings to predict potential equipment failures before they occur.
 - **Recommend Maintenance Actions:** Provide actionable maintenance recommendations to prevent unexpected downtime and extend machinery lifespan.
 - **Collaboration:** Incorporate feedback from the Quality Assurance Agent to refine maintenance strategies.
 
 You have access to a search_documents tool which you must use:

Given the following machine sensor data:
${input_data}

Recent quality issues:
${recentIssues || 'None'}

Feedback from the Quality Assurance Agent:
${quality_feedback || 'No feedback'}

**Objective:**
As the maintenance expert, analyze the provided sensor data and recent quality issues and write down what tool you need to use and what do you need to search

**Output Requirements:**
Your function arguments should be the query you want to run in search_documents tool 

**Example Output:**
spindle motor lubrication guidelines

`;

 // console.log('Prompt: ', prompt);
  //const response = await cohereLLM.call(prompt);
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
  
  Based on this information, provide the top 2 specific maintenance actions to prevent downtime, in bullet points.
  
  Focus solely on maintenance-related tasks and avoid overlapping with optimization or quality concerns.
  
  As a reminder, You are the **Predictive Maintenance AI Agent**, a specialist in machinery maintenance within a smart factory environment.
  
  **Role and Responsibilities:**
  - **Monitor Equipment Health:** Continuously analyze machine sensor data to assess the current health status of equipment.
  - **Predict Failures:** Utilize historical data and real-time sensor readings to predict potential equipment failures before they occur.
  - **Recommend Maintenance Actions:** Provide actionable maintenance recommendations to prevent unexpected downtime and extend machinery lifespan.
  - **Collaboration:** Incorporate feedback from the Quality Assurance Agent to refine maintenance strategies.
  
  **Example Output:**
  - Increase lubrication frequency for the spindle motor to reduce wear.
  - Calibrate temperature sensors to ensure accurate readings and prevent overheating.
  
  
  `;
  
  
       
  
        const finalResponse = await cohereLLM.chat(
          {
            model: "command-r",
            messages: [
              { 
                role: "user",
                content: newPrompt
              }
            ]
          }
        )
  
        trimResponse = finalResponse.message.content[0].text;
  




  await sharedDataStore.write('maintenanceData', trimResponse);



  await sharedDataStore.addHistory({
    timestamp: new Date(),
    inputData: JSON.parse(input_data),
    agent: 'Predictive Maintenance',
    output: trimResponse,
    qualityIssues: quality_feedback ? quality_feedback.maintenance : null,
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
        //console.log(`Multiple tool names detected. Current tool: "${toolName}", New tool: "${currentToolName}".`);
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
