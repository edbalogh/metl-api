const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf-promise');
const stepData = require('../data/steps');
const util = require('util');

describe('Steps API File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const body = JSON.parse(JSON.stringify(stepData.find(step => step.id === '87db259d-606e-46eb-b723-82923349640f')));

  before((done) => {
    app = express();
    server = http.createServer(app);
    app.on('start', () => {
      done();
    });
    app.use(kraken({
      basedir: process.cwd(),
      onconfig: (config, next) => {
        config.set('dataDir', 'testDataSimpleStepTests');
        dataDir = `./${config.get('dataDir') || 'data'}`;
        BaseModel.initialStorageParameters(config);
        next(null, config);
      }
    }));
    mock = server.listen(1303);
  });

  after(async () => {
    app.removeAllListeners('start');
    await rmdir(dataDir);
    await util.promisify(mock.close.bind(mock))();
  });

  it('Should insert a single step', async () => {
    const response = await request(mock)
      .post('/api/v1/steps/')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should get the inserted step', async () => {
    const response = await request(mock)
      .get(`/api/v1/steps/${body.id}`)
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should get all steps', async () => {
    const response = await request(mock)
      .get('/api/v1/steps')
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('steps').lengthOf(1);
    const step = stepResponse.steps[0];
    verifyStep(step, body);
  });

  it('Should update a step', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    body.displayName = 'Red on the head fred';
    const response = await request(mock)
      .put(`/api/v1/steps/${body.id}`)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should delete a step', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    await request(mock).delete(`/api/v1/steps/${body.id}`).expect(204);
    await request(mock).get('/api/v1/steps').expect(204);
  });

  it('Should upsert a single step', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    const response = await request(mock)
      .put(`/api/v1/steps/${body.id}`)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should update a single step using post', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    const response = await request(mock)
      .post('/api/v1/steps/')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should insert multiple steps', async () => {
    const stepIds = ['8daea683-ecde-44ce-988e-41630d251cb8', '0a296858-e8b7-43dd-9f55-88d00a7cd8fa', 'e4dad367-a506-5afd-86c0-82c2cf5cd15c'];
    const data = stepData.filter(step => stepIds.indexOf(step.id) !== -1);
    let response = await request(mock)
      .post('/api/v1/steps/')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('steps').lengthOf(3);
    stepResponse.steps.forEach(step => verifyStep(step, data.find(s => s.id === step.id)));
    response = await request(mock)
      .get('/api/v1/steps/')
      .expect('Content-Type', /json/)
      .expect(200);
    stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('steps').lengthOf(4);
  });

  it('Should get previous versions', async () => {
    const baseStep = JSON.parse(JSON.stringify(stepData.find(step => step.id === 'b034fe19-60d2-4b8c-a1f1-8048fffbed36')));
    baseStep.description = 'step version 1';

    // setup the post and 2 updates
    await request(mock)
      .post('/api/v1/steps/')
      .send(baseStep)
      .expect('Content-Type', /json/)
      .expect(201);

    baseStep.description = 'step version 2';
    await request(mock)
      .put(`/api/v1/steps/${baseStep.id}`)
      .send(baseStep)
      .expect('Content-Type', /json/)
      .expect(200);

    baseStep.description = 'step version 3';
    await request(mock)
      .put(`/api/v1/steps/${baseStep.id}`)
      .send(baseStep)
      .expect('Content-Type', /json/)
      .expect(200);

    // no versionsAgo specified should return the last update (version 3)
    const activeResponse = await request(mock)
      .get(`/api/v1/steps/${baseStep.id}`)
      .expect('Content-Type', /json/)
      .expect(200);

    const active = JSON.parse(activeResponse.text).step;
    expect(active).to.have.property('description').eq('step version 3');

    // versionsAgo 0 should also return active version (version 3)
    const activeResponse0 = await request(mock)
      .get(`/api/v1/steps/${baseStep.id}?versionsAgo=0`)
      .expect('Content-Type', /json/)
      .expect(200);

    const active0 = JSON.parse(activeResponse0.text).step;
    expect(active0).to.have.property('description').eq('step version 3');

    // one version ago should return 1st update (version 2)
    const versionAgo1Response = await request(mock)
      .get(`/api/v1/steps/${baseStep.id}?versionsAgo=1`)
      .expect('Content-Type', /json/)
      .expect(200);

    const versionsAgo1 = JSON.parse(versionAgo1Response.text).step;
    expect(versionsAgo1).to.have.property('description').eq('step version 2');

    // 2 versions ago should return original (version 1)
    const versionAgo2Response = await request(mock)
      .get(`/api/v1/steps/${baseStep.id}?versionsAgo=2`)
      .expect('Content-Type', /json/)
      .expect(200);

    const versionsAgo2 = JSON.parse(versionAgo2Response.text).step;
    expect(versionsAgo2).to.have.property('description').eq('step version 1');

    // requesting past earliest version should return empty results
    await request(mock)
      .get(`/api/v1/steps/${baseStep.id}?versionsAgo=9`)
      .expect(204);

  });

  function verifyStep(step, original) {
    expect(step).to.have.property('id').equal(original.id);
    expect(step).to.have.property('displayName').equal(original.displayName);
    expect(step).to.have.property('type').equal(original.type);
    expect(step).to.have.property('creationDate');
    expect(step).to.have.property('modifiedDate');
    expect(step).to.have.nested.property('engineMeta.spark').equal(original.engineMeta.spark);
    expect(step).to.have.property('params').lengthOf(original.params.length);
    expect(step.params).to.have.deep.members(original.params);
  }

  function sleep(ms){
    return new Promise(resolve => {
      setTimeout(resolve,ms)
    })
  }
});
