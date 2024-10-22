
const { cohereLLM } = require('../server/cohereLangChainSetup');
const sharedDataStore = require('../shared/sharedDataStore_1');
const tools = require('./tools');


async function execute(input) {
  const { input_data, optimization_findings } = input;

 // Prepare the tools description
 const toolsDescription = tools
 .map((tool) => `${tool.name}: ${tool.description}`)
 .join('\n');

const system_message = `
You are the **Quality Assurance AI Agent**, a specialist in product quality evaluation within a smart factory environment.

**Role and Responsibilities:**
- **Assess Product Quality:** Evaluate the quality of products based on machine sensor data and production parameters.
- **Identify Quality Concerns:** Detect potential quality issues that may arise from production inefficiencies or equipment malfunctions.
- **Provide Feedback:** Offer actionable feedback and recommendations to enhance product quality.
- **Collaboration:** Incorporate insights from the Process Optimization Agent to understand the impact of process changes on quality.

You have access to a search_documents tool which you must use

Given the following machine sensor data:
${input_data}

Optimization findings from the Process Optimization Agent:
${optimization_findings || 'No optimization findings'}

And use the search_documents tool

**Objective:**
As the quality expert, assess the provided data and optimization findings write down what tool you need to use and what do you need to search

**Output Requirements:**
Your function arguments should be the query you want to run in search_documents tool 
You must include query for the tool in your response.

**Example Output:**
spindle motor quality related guidelines


`;

  //const response = await cohereLLM.generate({ prompt });
    //const response = await cohereLLM.call(prompt);
    //console.log(prompt);
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
    console.log("this is toolCall for QA agent: ", JSON.stringify(response.message.toolCalls));


    const { toolName, toolInput } = extractToolDetails(toolRequests);
    const tool = tools.find((t) => t.name === toolName);
    const toolResult = await tool.func(toolInput);
  

    const newPrompt = `
    You previously requested to use the tool ${toolName} with input "${toolInput}" and received the following result:
    
    ${toolResult}
    
    Based on this information, provide the top 2 specific quality concerns and feedback, in bullet points. Make your answer concise. Dont go beyond two bullet points highlighting just the important quality concerns
    
    Focus on quality evaluation and necessary corrective actions.
    As a reminder, You are the **Quality Assurance AI Agent**, a specialist in product quality evaluation within a smart factory environment.
    
    **Role and Responsibilities:**
    - **Assess Product Quality:** Evaluate the quality of products based on machine sensor data and production parameters.
    - **Identify Quality Concerns:** Detect potential quality issues that may arise from production inefficiencies or equipment malfunctions.
    - **Provide Feedback:** Offer actionable feedback and recommendations to enhance product quality.
    - **Collaboration:** Incorporate insights from the Process Optimization Agent to understand the impact of process changes on quality.
    
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
    );

    trimResponse = finalResponse.message.content[0].text;





   feedback = {
    maintenance: 'Detected increased wear due to parameter changes.',
    optimization: 'Surface finish quality has decreased.',
  };
  await sharedDataStore.addHistory({
    timestamp: new Date(),
    inputData: JSON.parse(input_data),
    agent: 'Quality Assurance',
    output: trimResponse,
    feedback,
    qualityIssues: trimResponse,
  });

  return { output: trimResponse, feedback };
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
