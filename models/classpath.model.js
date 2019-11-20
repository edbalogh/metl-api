const Ajv = require('ajv');
const schema = require('../schemas/classpath.json');
const BaseModel = require('../lib/base.model');


class ClassPathModel extends BaseModel {
    constructor(){
        super('classpath', schema);
    }

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv.compile(schema);
    }


    // custom model logic goes here
}

module.exports = ClassPathModel;
