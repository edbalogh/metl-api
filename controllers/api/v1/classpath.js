const ClassPathModel = require('../../../models/classpath.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
    const baseRoutes = new BaseRoutes('classpath', 'classpath', ClassPathModel);
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
