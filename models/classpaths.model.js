const Ajv = require('ajv');
const schema = require('../schemas/classpaths.json');
const BaseModel = require('../lib/base.model');


class ClassPathsModel extends BaseModel {
    constructor(){
        super('classpaths', schema);
    }

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv.compile(schema);
    }


    // custom model logic goes here
}

module.exports = ClassPathsModel;
