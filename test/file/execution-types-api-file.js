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
  let newExecutionType = {
    name: 'local spark',
    command: '/usr/bin/spark/bin/spark-submit',
    masterUrl: 'local[4]',
    deployMode: 'client'
  };
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
      .send({ name: 'missing version'})
      .expect('Content-Type', /json/)
      .expect(422);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('errors').lengthOf(3);
    expect(apiResponse).to.have.property('body');
    const errors = apiResponse.errors;
    console.log(`errors: ${JSON.stringify(errors)}`);
    expect(errors.find(err => err.params.missingProperty === 'command')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'masterUrl')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'deployMode')).to.exist;
    await request(mock).get(endPoint).expect(204);
  });


  it('Should not return a execution-type', async () => {
    await request(mock).get(`${endPoint}/bad-id`).expect(204);
  });

  let returnExecutionTypeObject;
  it('Should insert a single execution-type', async () => {
    const response = await request(mock)
      .post(endPoint)
      .send(newExecutionType)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-type');
    returnExecutionTypeObject = resp['execution-type'];
    verifyReturnObject(resp['execution-type'], newExecutionType);
  });

  it('Should get the inserted execution-type', async () => {
    console.log(`returnObject=${JSON.stringify(returnExecutionTypeObject)}`);
    const response = await request(mock)
      .get(`/api/v1/execution-types/${returnExecutionTypeObject.id}`)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-type');
    verifyReturnObject(resp['execution-type'], returnExecutionTypeObject);
  });

  it('Should get all execution-type', async () => {
    const response = await request(mock)
      .get(endPoint)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-types').lengthOf(1);
    verifyReturnObject(resp['execution-types'][0], returnExecutionTypeObject)
  });

  it('Should update a execution-type', async () => {
    returnExecutionTypeObject.masterUrl = `myUrl1`;
    const response = await request(mock)
      .put(`${endPoint}/${returnExecutionTypeObject.id}`)
      .send(returnExecutionTypeObject)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-type');
    expect(resp['execution-type']).to.have.property('masterUrl').eq('myUrl1');
    verifyReturnObject(resp['execution-type'], returnExecutionTypeObject);
  });

  it('Should update a single execution-type using post', async () => {
      returnExecutionTypeObject.masterUrl = 'myUrl2';
      const response = await request(mock)
        .post(endPoint)
        .send(returnExecutionTypeObject)
        .expect('Content-Type', /json/)
        .expect(201);
      const resp = JSON.parse(response.text);
      expect(resp).to.exist;
      expect(resp).to.have.property('execution-type');
      expect(resp['execution-type']).to.have.property('masterUrl').eq('myUrl2');
    verifyReturnObject(resp['execution-type'], returnExecutionTypeObject);
    });

  it('Should upsert a single execution-type', async () => {
    returnExecutionTypeObject.masterUrl = 'myUrl3';
    const response = await request(mock)
      .put(`${endPoint}/${returnExecutionTypeObject.id}`)
      .send(returnExecutionTypeObject)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-type');
    expect(resp['execution-type']).to.have.property('masterUrl').eq('myUrl3');
    verifyReturnObject(resp['execution-type'], returnExecutionTypeObject);
  });

  it('Should delete a execution-type', async () => {
    await request(mock).delete(`${endPoint}/${returnExecutionTypeObject.id}`).expect(204);
    await request(mock).get(endPoint).expect(204);
  });

  it('Should insert multiple execution-types', async () => {
    const data = [
      { name: 'local1', command: '/command/1/spark', masterUrl: 'local[4]', deployMode: 'client' },
      { name: 'local2', command: '/command/2/spark', masterUrl: 'myUrl4', deployMode: 'cluster' },
      { name: 'local3', command: '/command/3/spark', masterUrl: 'myUrl5', deployMode: 'client' }
    ];

    let response = await request(mock)
      .post(endPoint)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-types').lengthOf(data.length);
    resp['execution-types'].forEach(x => verifyReturnObject(x, data.find(y => x.name === y.name)));
    response = await request(mock)
      .get(endPoint)
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('execution-types').lengthOf(data.length);
  });

  function verifyReturnObject(inObj, original) {
    expect(inObj).to.have.property('id');
    if(original.hasOwnProperty('id')) {
      expect(inObj).to.have.property('id').eq(original.id);
    }
    expect(inObj).to.have.property('name').eq(original.name);
    expect(inObj).to.have.property('command').eq(original.command);
    expect(inObj).to.have.property('masterUrl').eq(original.masterUrl);
    expect(inObj).to.have.property('deployMode').eq(original.deployMode);
  }
});
