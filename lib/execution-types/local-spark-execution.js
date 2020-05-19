const BaseExecutionType = require('./base-execution-type');
const Ajv = require('ajv');
const ValidationError = require('../ValidationError');

class LocalSparkExecution extends BaseExecutionType {
  constructor() {
    super();
    const ajv = new Ajv({ allErrors: true, extendRefs: true });
    this.validator = ajv.compile(this.getParameters());
  }

  getName() {
    return 'local-spark-executor';
  }

  // TODO: move to executions model
  // async getJarListFromClassPath() {
  //   return await Promise.all(_.map(this.execution.classPathList, async (id) => {
  //     let classpath = await this.classPathsModel.getByKey(id);
  //     return classpath.link;
  //   }));
  // }

  execute(execution) {
    return true;
    // const command = this.buildCommand(execution);
    // console.log(`command: ${command}`);
    // // TODO: update execution with new status and sparkUI link, etc..
    // // exec(command);

  }

  buildCommand(execution) {
    // this.validateExecution(execution);
    return true;
    // let command = `${this.execution.executionSettings.sparkSubmitPath}`;
    // command += ` --class ${this.execution.applicationClass}`;
    // command += ` --master local[${this.executionSettings.numberCores}]`;
    // command += ` --deploy-mode ${this.executionSettings.deployMode}`;
    // command += ` --jars ${this.execution.jarList.join(',')}`;
    // command += ` --name ${this.execution.applicationName}`;
    // this.execution.sparkParameters.forEach(p => { command += ` --${this.buildParameterWithOptionalValue(p, '=')}` } );
    // this.execution.confParameters.forEach(p => { command += ` --conf ${this.buildParameterWithOptionalValue(p, '=')}` } );
    // command += ` ${this.execution.applicationJar}`;
    // this.execution.applicationParameters.forEach(p => { command += ` ${this.buildParameterWithOptionalValue(p, '=')}` } );
    // return command;
  }

  validate(execution) {
    // TODO: add validations here...
    return true;
  }

  validateSettings(executionSettings) {
    // validate record
    const validation = this.validator(executionSettings);
    if (!validation) {
      throw new ValidationError('', this.validator.errors);
    } else {
      return this.validator;
    }
  }

  // validateExecution(execution) {
  //   // TODO: need to get the settings? or will they be directly on the object?
  //   this.validateSettings(execution.executionSettings);
  //   return execution;
  // }

  getParameters() { // return JSON schema?
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "execution-parameters",
      "$ref": "#/definitions/execution-parameters",
      "definitions": {
        "execution-parameters": {
          "type": "object",
          "required": [
            "sparkSubmitPath",
          ],
          "properties": {
            "sparkSubmitPath": {
              "title": "spark submit path",
              "description": "path to spark submit where executable",
              "type": "string"
            },
            "numberCores": {
              "title": "number of cores",
              "description": "port number for spark master (default: 2)",
              "type": "integer",
              "defaultValue": 2
            },
            "deployMode": {
              "title": "deploy mode",
              "description": "the deploy mode for spark-submit",
              "type": "string",
              "enum": ["cluster", "client"],
              "default": "client"
            }
          }
        }
      }
    }
  }
}

module.exports = LocalSparkExecution;
