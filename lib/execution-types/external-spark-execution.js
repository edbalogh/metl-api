const BaseExecutionType = require('./base-execution-type');

class ExternalSparkExecution extends BaseExecutionType {
  async constructor(execution) {
    super(execution);
    // need to go get the jars by id
    this.jarList = await this.getJarListFromClassPath();
  }

  async getJarListFromClassPath() {
    return await Promise.all(_.map(this.execution.classPathList, async (id) => {
      let classpath = await this.classPathsModel.getByKey(id);
      return classpath.link;
    }));
  }

  execute() {
    const command = this.buildCommand();
    console.log(`command: ${command}`);
    // TODO: update execution with new status and sparkUI link, etc..
    // exec(command);

  }

  buildCommand(execution) {
    let command = `${this.executionType.sparkSubmitPath}`;
    command += ` --class ${this.execution.applicationClass}`;
    command += ` --master ${this.executionTypeData.masterHost}:${this.executionTypeDetails.masterPort}`;
    command += ` --deploy-mode ${this.executionTypeDetails.deployMode}`;
    command += ` --jars ${this.execution.jarList.join(',')}`;
    command += ` --name ${this.execution.applicationName}`;
    this.execution.sparkParameters.forEach(p => { command += ` --${this.buildParameterWithOptionalValue(p, '=')}` } );
    this.execution.confParameters.forEach(p => { command += ` --conf ${this.buildParameterWithOptionalValue(p, '=')}` } );
    command += ` ${this.execution.applicationJar}`;
    this.execution.applicationParameters.forEach(p => { command += ` ${this.buildParameterWithOptionalValue(p, '=')}` } );
    return command;
  }

  validateSettings(executionSettings) {
    // TODO: add validations to the settings here...
    return true;
  }

  validateExecutions(executionSettings) {
    // TODO: add validations to the settings here...
    return true;
  }

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
            "masterHost": {
              "title": "spark master host name",
              "description": "host name for spark master (default: local)",
              "type": "string",
              "default": "local"
            },
            "masterPort": {
              "title": "spark master port",
              "description": "port number for spark master (optional)",
              "type": "integer"
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

module.exports = ExternalSparkExecution;
