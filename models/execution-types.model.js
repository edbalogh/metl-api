const Ajv = require('ajv');
const schema = require('../schemas/execution-types.json');
const BaseModel = require('../lib/base.model');


class ExecutionTypesModel extends BaseModel {
    constructor(){
        super('execution-types', schema);
    }

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv.compile(schema);
    }


    // custom model logic goes here
}

module.exports = ExecutionTypesModel;
