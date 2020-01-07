const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const MongoDb = require('../../lib/mongo');
const util = require('util');

describe('ExecutionSettings API File Tests', () => {
  let app;
  let server;
  let mock;
  let newSettings = {
    name: 'my local settings',
    executionTypeId: 'local-spark-execution',
    sparkSubmitPath: '/usr/local/bin/',
    numberCores: 4,
    deployMode: 'cluster'
  };
  const executionTypes = [
    { name: 'local', id: 'local-spark-execution', path: '../lib/execution-types/local-spark-execution' },
    { name: 'kubernetes', id: 'k8s-spark-execution', path: '../lib/execution-types/k8s-spark-execution' }
  ];
  const endPoint = '/api/v1/execution-settings';

  before((done) => {
    app = express();
    server = http.createServer(app);
    app.on('start', () => {
      done();
    });
    app.use(kraken({
      basedir: process.cwd(),
      onconfig: (config, next) => {
        config.set('storageType', 'mongodb');
        config.set('databaseName', 'testDataExecutionSettingsObjects');
        config.set('executionTypes', executionTypes);
        BaseModel.initialStorageParameters(config);
        MongoDb.init(config)
          .then(() => {
            next(null, config);
          })
          .catch(next);
      }
    }));
    mock = server.listen(1315);
  });

  after(async () => {
    app.removeAllListeners('start');
    await MongoDb.getDatabase().dropDatabase();
    await MongoDb.disconnect();
    await util.promisify(mock.close.bind(mock))();
  });

  it('Should fail insert on missing body', async () => {
    const response = await request(mock)
      .post(endPoint)
      .expect('Content-Type', /json/)
      .expect(400);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('message').eq('POST request missing body');
    await request(mock).get(endPoint).expect(204);
  });

  it('Should fail validation on insert with executionTypeId', async () => {
    const response = await request(mock)
      .post(endPoint)
      .send({ name: 'missing executorTypeId', 'executionTypeId': 'local-spark-execution' })
      .expect('Content-Type', /json/)
      .expect(422);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('errors').lengthOf(1);
    expect(apiResponse).to.have.property('body');
    const errors = apiResponse.errors;
    expect(errors.find(err => err.params.missingProperty === 'sparkSubmitPath')).to.exist;
    await request(mock).get(endPoint).expect(204);
  });

  it('Should fail validation on insert without executionTypeId', async () => {
    const response = await request(mock)
      .post(endPoint)
      .send({ name: 'missing executorTypeId' })
      .expect('Content-Type', /json/)
      .expect(422);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('errors').lengthOf(1);
    expect(apiResponse).to.have.property('body');
    const errors = apiResponse.errors;
    expect(errors.find(err => err.params.missingProperty === 'executionTypeId')).to.exist;
    await request(mock).get(endPoint).expect(204);
  });


  it('Should not return a execution-settings', async () => {
    await request(mock).get(`${endPoint}/bad-id`).expect(204);
  });

  let returnExecutionSettingsObject;
  it('Should insert a single execution-settings', async () => {
    const response = await request(mock)
      .post(endPoint)
      .send(newSettings)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings');
    returnExecutionSettingsObject = resp['execution-settings'];
    verifyReturnObject(resp['execution-settings'], newSettings);
  });

  it('Should get the inserted execution-settings', async () => {
    const response = await request(mock)
      .get(`${endPoint}/${returnExecutionSettingsObject.id}`)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings');
    verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  });

  it('Should get all execution-settings', async () => {
    const response = await request(mock)
      .get(endPoint)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings').lengthOf(1);
    verifyReturnObject(resp['execution-settings'][0], returnExecutionSettingsObject)
  });

  it('Should update an execution-settings object', async () => {
    await sleep(10);
    returnExecutionSettingsObject.numberCores = 1;
    delete returnExecutionSettingsObject._id;
    const response = await request(mock)
      .put(`${endPoint}/${returnExecutionSettingsObject.id}`)
      .send(returnExecutionSettingsObject)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings');
    expect(resp['execution-settings']).to.have.property('numberCores').eq(1);
    verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  });

  it('Should update a single execution-settings using post', async () => {
    returnExecutionSettingsObject.numberCores = 2;
    delete returnExecutionSettingsObject._id;
    const response = await request(mock)
      .post(endPoint)
      .send(returnExecutionSettingsObject)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings');
    expect(resp['execution-settings']).to.have.property('numberCores').eq(2);
    verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  });

  it('Should upsert a single execution-settings', async () => {
    returnExecutionSettingsObject.numberCores = 3;
    delete returnExecutionSettingsObject._id;
    const response = await request(mock)
      .put(`${endPoint}/${returnExecutionSettingsObject.id}`)
      .send(returnExecutionSettingsObject)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings');
    expect(resp['execution-settings']).to.have.property('numberCores').eq(3);
    verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  });

  it('Should delete a execution-settings', async () => {
    await request(mock).delete(`${endPoint}/${returnExecutionSettingsObject.id}`).expect(204);
    await request(mock).get(endPoint).expect(204);
  });

  it('Should insert multiple execution-settings', async () => {
    const data = [
      { name: 'local1', executionTypeId: 'local-spark-execution', sparkSubmitPath: '/usr/local/bin/', numberCores: 4, deployMode: 'cluster' },
      { name: 'local2', executionTypeId: 'local-spark-execution', sparkSubmitPath: '/usr/bin/', numberCores: 3, deployMode: 'cluster' },
      { name: 'local3', executionTypeId: 'local-spark-execution', sparkSubmitPath: '/bin/', numberCores: 2, deployMode: 'cluster' }
    ];

    let response = await request(mock)
      .post(endPoint)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings').lengthOf(data.length);
    resp['execution-settings'].forEach(x => verifyReturnObject(x, data.find(y => x.name === y.name)));
    response = await request(mock)
      .get(endPoint)
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-settings').lengthOf(data.length);
  });

  function verifyReturnObject(inObj, original) {
    expect(inObj).to.have.property('id');
    if(original.hasOwnProperty('id')) {
      expect(inObj).to.have.property('id').eq(original.id);
    }
    expect(inObj).to.have.property('name').eq(original.name);
    expect(inObj).to.have.property('executionTypeId').eq(original.executionTypeId);
    if(original.hasOwnProperty('numberCores')) {
       expect(inObj).to.have.property('numberCores').eql(original.numberCores);
    }
    if(original.hasOwnProperty('deployMode')) {
      expect(inObj).to.have.property('deployMode').eql(original.deployMode);
    }
  }

  function sleep(ms){
    return new Promise(resolve => {
      setTimeout(resolve,ms)
    })
  }
});
