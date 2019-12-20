const ExecutionSettingsModel = require('../../../models/execution-settings.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {

  const baseRoutes = new BaseRoutes('execution-settings', 'execution-settings', ExecutionSettingsModel);
  baseRoutes.buildGetOneRoute(router);
  baseRoutes.buildGetAllRoute(router);
  baseRoutes.buildDeleteRoute(router);

  router.post('/', async (req, res) => {
    if (req.body && Array.isArray(req.body)) {
      const results = await this.model.createMany(req.body, req.app.kraken.get('executionTypes'));
      if (results.errorList.length === 0) {
        const returnObj = {};
        returnObj[this.pluralName] = results.successList;
        res.status(201).json(returnObj);
      } else {
        res.status(422).json({errors: results.errorList, successes: results.successList});
      }
    } else if(req.body && Object.keys(req.body).length > 0) {
      try {
        const record = await this.model.createOne(req.body, req.app.kraken.get('executionTypes'));
        const returnObj = {};
        returnObj[this.singleName] = record;
        res.status(201).json(returnObj);
      } catch(err) {
        res.status(422).json({ errors: err.getValidationErrors(), body: req.body });
      }
    } else {
      res.status(400).send({message: 'POST request missing body'});
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const record = await this.model.update(req.params.id, req.body, req.app.kraken.get('executionTypes'));
      const returnObj = {};
      returnObj[this.singleName] = record;
      res.json(returnObj);
    } catch(err) {
      res.status(500).json({ errors: err.message, body: req.body });
    }
  });

};
