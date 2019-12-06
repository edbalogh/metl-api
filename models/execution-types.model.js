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
    } else {
      return results[0];
    }
  }

  getParameters(id) {
    const details = this.getById(id);
    const ExecutionType = require(details.path);
    return new ExecutionType().getParameters();
  }

  // override getValidator to add dependent schemas
  getValidator(schema) {
      const ajv = new Ajv({ allErrors: true, extendRefs: true });
      return ajv.compile(schema);
  }



  // custom model logic goes here
}

module.exports = ExecutionTypesModel;
