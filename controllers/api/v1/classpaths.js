const ClassPathsModel = require('../../../models/classpaths.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
    const baseRoutes = new BaseRoutes('classpath', 'classpaths', ClassPathsModel);
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
