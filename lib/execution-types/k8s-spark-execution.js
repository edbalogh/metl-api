const ExternalSparkExecutionType = require('./external-spark-execution');


class k8sSparkExecutionType extends ExternalSparkExecutionType {
  constructor() {
    super();
  }

  execute(execution) {
    throw new Error("not implemented");
  }

  buildCommand(execution) {
    throw new Error("not implemented");
  }

  getParameters() { // return JSON schema?
    // pathToSparkSubmit, master, or host/port
    throw new Error("not implemented")
  }
}

module.exports = k8sSparkExecutionType;
