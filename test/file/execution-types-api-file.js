const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf-promise');
const util = require('util');

describe('ExecutionType API File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const executionTypes = [
    { name: 'local', id: 'local-id', path: '../lib/execution-types/local-spark-execution' },
    { name: 'kubernetes', id: 'k8s-id', path: '../lib/execution-types/k8s-spark-execution' }
  ];
  const endPoint = '/api/v1/execution-types';

  before((done) => {
    app = express();
    server = http.createServer(app);
    app.on('start', () => {
      done();
    });
    app.use(kraken({
      basedir: process.cwd(),
      onconfig: (config, next) => {
        config.set('dataDir', 'testDataExecutionTypes');
        config.set('executionTypes', executionTypes);
        dataDir = `./${config.get('dataDir') || 'data'}`;
        BaseModel.initialStorageParameters(config);
        next(null, config);
      }
    }));
    mock = server.listen(1312);
  });

  after(async () => {
    app.removeAllListeners('start');
    await rmdir(dataDir);
    await util.promisify(mock.close.bind(mock))();
  });

  it('Should get all execution types in config', async () => {
    const response = await request(mock)
      .get(`${endPoint}/`)
      .expect('Content-Type', /json/)
      .expect(200);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('execution-types').lengthOf(executionTypes.length);
    apiResponse['execution-types'].forEach(x => verifyReturnObject(x, executionTypes.find(y => x.name === y.name)));
  });

  it('Should get a single execution type from config', async () => {
    const response = await request(mock)
      .get(`${endPoint}/${executionTypes[0].id}`)
    .expect('Content-Type', /json/)
    .expect(200);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('execution-type');
    verifyReturnObject(apiResponse['execution-type'], executionTypes[0]);
  });

  it('Should return empty for invalid id', async () => {
    await request(mock)
      .get(`${endPoint}/bad-id`)
      .expect(204);
  });

  it('Should get a single execution type from config', async () => {
    const response = await request(mock)
      .get(`${endPoint}/${executionTypes[0].id}/parameters`)
      .expect('Content-Type', /json/)
      .expect(200);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('parameters');
  });

  function verifyReturnObject(inObj, original) {
    expect(inObj).to.have.property('id');
    if(original.hasOwnProperty('id')) {
      expect(inObj).to.have.property('id').eq(original.id);
    }
    expect(inObj).to.have.property('name').eq(original.name);
    expect(inObj).to.have.property('path').eq(original.path);
  }
});
