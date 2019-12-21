class ExecutionTypesModel {
  constructor(executionTypes){
    this.executionTypes = executionTypes;
  }

  getById(id) {
    let results = [];
    this.executionTypes.forEach((t) => {
      if(t.id === id) results.push(t);
    });

    if(results.length > 1) {
      throw new Error('multiple execution types found with id')
    } else if(results.length === 0) {
      throw new Error(`no execution-type found in config with id ${id}`);
    } else {
      return results[0];
    }
  }

  // return the execution class
  getExecutionClass(id) {
    const details = this.getById(id);
    const ExecutionType = require(details.path);
    return new ExecutionType();
  }

  // called from UI to get the json schema representing parameters to build settings for a type
  getParameters(id) {
    this.getExecutionClass(id).getParameters();
  }

  // called from execution-settings endpoint to validate settings before insert or update
  validateSettings(id, settings) {
    this.getExecutionClass(id).validateSettings(settings);
  }

  // called from execution endpoint to generation a build command (but not run it)
  buildCommand(execution) {
    this.getExecutionClass(execution.executionTypeId).buildCommand(execution);
  }

  // called from execution endpoint to run the command
  execute(execution) {
    this.getExecutionClass(execution.executionTypeId).execute(execution);
  }

}

module.exports = ExecutionTypesModel;
