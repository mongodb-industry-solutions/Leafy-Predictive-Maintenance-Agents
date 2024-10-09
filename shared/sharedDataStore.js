

/*
const dataStore = {
  history: [],
};

function write(key, value) {
  dataStore[key] = value;
}

function read(key) {
  return dataStore[key];
}

function addHistory(entry) {
  dataStore.history.push(entry);
}

function getHistory() {
  return dataStore.history;
}

function calculateKPIs() {
  const { history } = dataStore;
  let totalSurfaceFinish = 0;
  let count = 0;

  history.forEach((entry) => {
    let inputData = entry.inputData;

    // Check if inputData is a string and parse it into an object
    if (typeof inputData === 'string') {
      try {
        inputData = JSON.parse(inputData);
      } catch (error) {
        console.error('Error parsing inputData:', error);
        return; // Skip this entry if parsing fails
      }
    }

    if (inputData && inputData.surfaceFinish !== undefined) {
      totalSurfaceFinish += parseFloat(inputData.surfaceFinish);
      count += 1;
    }
  });

  const averageSurfaceFinish = count > 0 ? (totalSurfaceFinish / count).toFixed(2) : 0;

  return {
    averageSurfaceFinish,
    // Add other KPIs as needed
  };
}


module.exports = {
  write,
  read,
  addHistory,
  getHistory,
  calculateKPIs,
};
 */