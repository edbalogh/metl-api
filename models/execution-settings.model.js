const Ajv = require('ajv');
const schema = require('../schemas/execution-settings.json');
const BaseModel = require('../lib/base.model');


class ExecutionSettingsModel extends BaseModel {
    constructor(){
        super('execution-settings', schema);
    }

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv.compile(schema);
    }


    // custom model logic goes here
}

module.exports = ExecutionSettingsModel;
