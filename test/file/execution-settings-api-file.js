const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf-promise');
const util = require('util');

describe('ExecutionSettings API File Tests', () => {
  let dataDir;
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
        config.set('dataDir', 'testDataExecutionSettings');
        config.set('executionTypes', executionTypes);
        dataDir = `./${config.get('dataDir') || 'data'}`;
        BaseModel.initialStorageParameters(config);
        next(null, config);
      }
    }));
    mock = server.listen(1314);
  });

  after(async () => {
    app.removeAllListeners('start');
    await rmdir(dataDir);
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

  it('Should fail validation on insert', async () => {
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
  //
  // it('Should get the inserted execution-settings', async () => {
  //   const response = await request(mock)
  //     .get(`/api/v1/execution-settings/${returnExecutionSettingsObject.id}`)
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   const resp = JSON.parse(response.text);
  //   expect(resp).to.exist;
  //   expect(resp).to.have.property('execution-settings');
  //   verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  // });
  //
  // it('Should get all execution-settings', async () => {
  //   const response = await request(mock)
  //     .get(endPoint)
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   const resp = JSON.parse(response.text);
  //   expect(resp).to.exist;
  //   expect(resp).to.have.property('execution-settings').lengthOf(1);
  //   verifyReturnObject(resp['execution-settings'][0], returnExecutionSettingsObject)
  // });
  //
  // it('Should update a execution-settings', async () => {
  //   returnExecutionSettingsObject.executionTypeId = `et1`;
  //   const response = await request(mock)
  //     .put(`${endPoint}/${returnExecutionSettingsObject.id}`)
  //     .send(returnExecutionSettingsObject)
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   const resp = JSON.parse(response.text);
  //   expect(resp).to.exist;
  //   expect(resp).to.have.property('execution-settings');
  //   expect(resp['execution-settings']).to.have.property('executionTypeId').eq('et1');
  //   verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  // });
  //
  // it('Should update a single execution-settings using post', async () => {
  //     returnExecutionSettingsObject.executionTypeId = 'et2';
  //     const response = await request(mock)
  //       .post(endPoint)
  //       .send(returnExecutionSettingsObject)
  //       .expect('Content-Type', /json/)
  //       .expect(201);
  //     const resp = JSON.parse(response.text);
  //     expect(resp).to.exist;
  //     expect(resp).to.have.property('execution-settings');
  //     expect(resp['execution-settings']).to.have.property('executionTypeId').eq('et2');
  //   verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  //   });
  //
  // it('Should upsert a single execution-settings', async () => {
  //   returnExecutionSettingsObject.executionTypeId = 'et3';
  //   const response = await request(mock)
  //     .put(`${endPoint}/${returnExecutionSettingsObject.id}`)
  //     .send(returnExecutionSettingsObject)
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   const resp = JSON.parse(response.text);
  //   expect(resp).to.exist;
  //   expect(resp).to.have.property('execution-settings');
  //   expect(resp['execution-settings']).to.have.property('executionTypeId').eq('et3');
  //   verifyReturnObject(resp['execution-settings'], returnExecutionSettingsObject);
  // });
  //
  // it('Should delete a execution-settings', async () => {
  //   await request(mock).delete(`${endPoint}/${returnExecutionSettingsObject.id}`).expect(204);
  //   await request(mock).get(endPoint).expect(204);
  // });
  //
  // it('Should insert multiple execution-settings', async () => {
  //   const data = [
  //     { name: 'local1', executionTypeId: 'exec-type-id-1', defaultSparkParameters: [ { parameter: 'p1', value: 'v1' } ] },
  //     { name: 'local2', executionTypeId: 'exec-type-id-2', defaultConfParameters: [ { parameter: 'p2' } ] },
  //     { name: 'local3', executionTypeId: 'exec-type-id-2' }
  //   ];
  //
  //   let response = await request(mock)
  //     .post(endPoint)
  //     .send(data)
  //     .expect('Content-Type', /json/)
  //     .expect(201);
  //   let resp = JSON.parse(response.text);
  //   expect(resp).to.exist;
  //   expect(resp).to.have.property('execution-settings').lengthOf(data.length);
  //   resp['execution-settings'].forEach(x => verifyReturnObject(x, data.find(y => x.name === y.name)));
  //   response = await request(mock)
  //     .get(endPoint)
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   resp = JSON.parse(response.text);
  //   expect(resp).to.exist;
  //   expect(resp).to.have.property('execution-settings').lengthOf(data.length);
  // });
  //
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
});
