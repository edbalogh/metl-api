const schema = require('../schemas/execution-settings.json');
const BaseModel = require('../lib/base.model');
const uuid = require('uuid/v1');
const ValidationError = require('../lib/ValidationError');
const ExecutionTypesModel = require('../models/execution-types.model');


class ExecutionSettingsModel extends BaseModel {
  constructor(){
      super('execution-settings', schema);
  }

  // override getValidator to add dependent schemas
  getValidatorWithType(schema, executionTypes) {
    console.log(`executionTypes in settings.getValidator: ${executionTypes}`);
    const execType = new ExecutionTypesModel(executionTypes).getById(schema.executionTypeId);
    if(!execType) {
      throw new ValidationError(`no execution-type found in config for id ${schema.executionTypeId}`);
    }
    return execType.validateSettings(schema);
  }

  async createOne(record, executionTypes) {
    // assign uuid id when missing
    if (!record.id) {
      record.id = uuid();
    }

    // validate record
    const validation = await this.getValidatorWithType(record, executionTypes);
    console.log(`validation complete: ${JSON.stringify(validation)}`);
    if (validation) {
      return await this.storageModel.addRecord({id: record.id}, record);
    }
  }

  async createMany(records, executionTypes) {
    let errorList = [];
    let successList = [];
    if (records) {
      for await (const record of records) {
        try {
          const results = await this.createOne(record, executionTypes);
          successList.push(results);
        } catch (err) {
          errorList.push({error: err, record: record});
        }
      }
    }
    return {errorList: errorList, successList: successList};
  }

  async update(id, record, executionTypes) {
    const validation = await this.getValidatorWithType(record, executionTypes);
    if (!validation) {
      throw Error(this.validation.errors.join(','));
    } else if (id !== record.id) {
      throw Error(`update failed: id from object(${record.id}) does not match id from url(${id})`);
    } else {
      return await this.storageModel.updateRecord({id: id}, record);
    }
  }


    // custom model logic goes here
}

module.exports = ExecutionSettingsModel;
