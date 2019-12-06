const ExecutionTypesModel = require('../../../models/execution-types.model');

module.exports = function async (router) {
  router.get('/', (req, res) => {
    const etypes = req.app.kraken.get('executionTypes');
    if(etypes.length > 0) {
      res.status(200).json({ 'execution-types': etypes });
    } else {
      res.sendStatus(204);
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const eType = new ExecutionTypesModel(req.app.kraken.get('executionTypes')).getById(req.params.id);
      if(eType) {
        res.status(200).send({ 'execution-type': eType });
      } else {
        res.sendStatus(204);
      }
    } catch(e) {
      res.status(501).send({ error: e });
    }

  });

  router.get('/:id/parameters', (req, res) => {
    try {
      const parameterSchema = new ExecutionTypesModel(req.app.kraken.get('executionTypes')).getParameters(req.params.id);
      if(parameterSchema) {
        res.status(200).send({ 'parameters': parameterSchema });
      } else {
        res.sendStatus(204);
      }
    } catch(e) {
      res.status(501).send({ error: e });
    }
  });

  // req.app.kraken.get(req.param.id) to get the config1
  // POST executions/:id/command (execution is provided in body; returns command)
  // POST executions/:id/execute (execution is provided in body; runs command)

  // custom routes go here
};
