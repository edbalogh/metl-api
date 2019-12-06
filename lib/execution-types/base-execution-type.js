const ClassPathsModel = require('../../models/classpaths.model');

class BaseExecutionType {
  // constructor(execution) {
  //   this.execution = execution;
  //   this.executionTypeDetails = execution.executionTypeDetails;
  //   this.classPathsModel = new ClassPathsModel();
  //   if(!this.validate()) throw new Error(`Execution validation failed`);
  // }

  execute(execution) {
    throw new Error("not implemented");
  }

  buildCommand(execution) {
    throw new Error("not implemented");
  }

  validate(execution) {
    throw new Error("not implemented");
  }

  getParameters() { // return JSON schema?
    // pathToSparkSubmit, master, or host/port
    throw new Error("not implemented")
  }

  buildParameterWithOptionalValue(parameterObject, separator) {
    if(parameterObject.hasOwnProperty('value')) {
      // combine the value with the parameter name and the separator
      return `${parameterObject.parameter}${separator}${parameterObject.value}`;
    } else {
      // just return the parameter name with no value or separator
      return parameterObject.parameter;
    }
  }
}

module.exports = BaseExecutionType;
