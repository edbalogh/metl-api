const ExecutionTypesModel = require('../../../models/execution-types.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
    const baseRoutes = new BaseRoutes('execution-type', 'execution-types', ExecutionTypesModel);
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
