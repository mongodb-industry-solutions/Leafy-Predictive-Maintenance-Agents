
const maintenanceAgent = require('./predictiveMaintenanceAgent');
const optimizationAgent = require('./processOptimizationAgent');
const qualityAgent = require('./qualityAssuranceAgent');

async function runAgents(dataPoint) {
  let qualityFeedback = null;
  let maintenanceOutput = null;
  let optimizationOutput = null;
  let qualityOutput = null;

  try {
    console.log('Running Predictive Maintenance Agent');
    maintenanceOutput = await maintenanceAgent.execute({
      input_data: JSON.stringify(dataPoint),
      quality_feedback: qualityFeedback,
    });
   // console.log('Maintenance Output:', maintenanceOutput);
  } catch (error) {
    console.error('Error in Predictive Maintenance Agent:', error);
  }

  try {
    console.log('Running Process Optimization Agent');
    optimizationOutput = await optimizationAgent.execute({
      input_data: JSON.stringify(dataPoint),
      maintenance_findings: maintenanceOutput,
      quality_feedback: qualityFeedback,
    });
   // console.log('Optimization Output:', optimizationOutput);
  } catch (error) {
    console.error('Error in Process Optimization Agent:', error);
  }

  try {
    console.log('Running Quality Assurance Agent');
    const qualityResult = await qualityAgent.execute({
      input_data: JSON.stringify(dataPoint),
      optimization_findings: optimizationOutput,
    });
    qualityOutput = qualityResult.output;
    qualityFeedback = qualityResult.feedback;
    //console.log('Quality Output:', qualityOutput);
  } catch (error) {
    console.error('Error in Quality Assurance Agent:', error);
  }

  // Bi-directional communication or feedback loops can be added here

  return {
    maintenance: maintenanceOutput,
    optimization: optimizationOutput,
    quality: qualityOutput,
  };
}

module.exports = runAgents;
