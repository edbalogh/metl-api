const Ajv = require('ajv');
const schema = require('../schemas/executions.json');
const BaseModel = require('../lib/base.model');


class ExecutionsModel extends BaseModel {
    constructor(){
        super('executions', schema);
    }

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv.compile(schema);
    }


    // custom model logic goes here
}

module.exports = ExecutionsModel;
