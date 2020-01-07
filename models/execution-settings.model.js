const BaseModel = require('../lib/base.model');
const uuid = require('uuid/v1');
const ExecutionTypesModel = require('../models/execution-types.model');
const ValidationError = require('../lib/ValidationError');


class ExecutionSettingsModel extends BaseModel {
  constructor(){
      super('execution-settings', null);
  }

  // override getValidator to add dependent schemas
  validate(schema, executionTypes) {
    if(!schema.hasOwnProperty('executionTypeId')) {
      throw new ValidationError('', [{ keyword: 'required', params: { missingProperty: 'executionTypeId'}, message: 'should have required property \'executionTypeId\''}] );
    }
    const executionType = new ExecutionTypesModel(executionTypes).getExecutionClass(schema.executionTypeId);
    return executionType.validateSettings(schema);
  }

  getValidator(schema) {
    // this will not be used for execution settings since the schema to validate against is stored in the types
    return true;
  }

  async createOne(record, executionTypes) {
    // assign uuid id when missing
    if (!record.id) {
      record.id = uuid();
    }

    // validate record
    const validation = await this.validate(record, executionTypes);
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
    const validation = await this.validate(record, executionTypes);
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
