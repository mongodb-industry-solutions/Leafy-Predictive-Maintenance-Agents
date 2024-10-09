
const { SimpleLinearRegression } = require('ml-regression');

class PredictiveModel {
  constructor() {
    this.model = null;
    this.dataX = [];
    this.dataY = [];
  }

  trainModel() {
    if (this.dataX.length > 1) {
      this.model = new SimpleLinearRegression(this.dataX, this.dataY);
    }
  }

  addDataPoint(input, output) {
    this.dataX.push(input);
    this.dataY.push(output);
    this.trainModel();
  }

  predict(input) {
    if (this.model) {
      return this.model.predict(input);
    }
    return null;
  }
}

module.exports = new PredictiveModel();
