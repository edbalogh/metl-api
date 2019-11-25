const ExecutionSettingsModel = require('../../../models/execution-settings.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
    const baseRoutes = new BaseRoutes('execution-settings', 'execution-settings', ExecutionSettingsModel);
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
