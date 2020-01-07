const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const MongoDb = require('../../lib/mongo');
const util = require('util');

describe('ClassPath API Mongo Tests', () => {
  let app;
  let server;
  let mock;
  let newClassPath = {
    name: 'common-steps',
    version: '1.4.0',
    link: 'https://myhost/jars/common-steps-1.4.0.jar'
  };
  const endPoint = '/api/v1/classpaths';

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
        config.set('databaseName', 'testDataClassPathsObjects');
        BaseModel.initialStorageParameters(config);
        MongoDb.init(config)
          .then(() => {
            next(null, config);
          })
          .catch(next);
      }
    }));
    mock = server.listen(1311);
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

  it('Should fail validation on insert', async () => {
    const response = await request(mock)
      .post(endPoint)
      .send({ name: 'missing version'})
      .expect('Content-Type', /json/)
      .expect(422);
    const apiResponse = JSON.parse(response.text);
    expect(apiResponse).to.exist;
    expect(apiResponse).to.have.property('errors').lengthOf(2);
    expect(apiResponse).to.have.property('body');
    const errors = apiResponse.errors;
    expect(errors.find(err => err.params.missingProperty === 'version')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'link')).to.exist;
    await request(mock).get(endPoint).expect(204);
  });


  it('Should not return a classpath', async () => {
    await request(mock).get(`${endPoint}/bad-id`).expect(204);
  });

  let returnClassPathObject;
  it('Should insert a single classpath', async () => {
    const response = await request(mock)
      .post(endPoint)
      .send(newClassPath)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpath');
    returnClassPathObject = resp.classpath;
    delete returnClassPathObject._id;
    verifyClassPathObject(resp['classpath'], newClassPath);
  });

  it('Should get the inserted classpath', async () => {
    const response = await request(mock)
      .get(`${endPoint}/${returnClassPathObject.id}`)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpath');
    verifyClassPathObject(resp['classpath'], returnClassPathObject);
  });

  it('Should get all classpaths', async () => {
    const response = await request(mock)
      .get(endPoint)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpaths').lengthOf(1);
    verifyClassPathObject(resp['classpaths'][0], returnClassPathObject)
  });

  it('Should update a classpath', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    returnClassPathObject.version = `2.0.0`;
    const response = await request(mock)
      .put(`${endPoint}/${returnClassPathObject.id}`)
      .send(returnClassPathObject)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpath');
    expect(resp.classpath).to.have.property('version').eq('2.0.0');
    verifyClassPathObject(resp['classpath'], returnClassPathObject);
  });

  it('Should update a single classpath using post', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    returnClassPathObject.version = '2.1.0';
    const response = await request(mock)
      .post(endPoint)
      .send(returnClassPathObject)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpath');
    expect(resp.classpath).to.have.property('version').eq('2.1.0');
    verifyClassPathObject(resp.classpath, returnClassPathObject);
  });

  it('Should upsert a single classPath', async () => {
    returnClassPathObject.version = '2.2.0';
    const response = await request(mock)
      .put(`${endPoint}/${returnClassPathObject.id}`)
      .send(returnClassPathObject)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpath');
    expect(resp.classpath).to.have.property('version').eq('2.2.0');
    verifyClassPathObject(resp.classpath, returnClassPathObject);
  });

  it('Should delete a classpath', async () => {
    // sleep to make sure archiveDate timestamp is unique
    await sleep(10);
    await request(mock).delete(`${endPoint}/${returnClassPathObject.id}`).expect(204);
    await request(mock).get(endPoint).expect(204);
  });

  it('Should insert multiple classpaths', async () => {
    const data = [
      { name: 'cp1', version: '1.0', link: 'http://mylink.com/cp1-1.0.jar' },
      { name: 'cp2', version: '2.0', link: 'http://mylink.com/cp2-2.0.jar' },
      { name: 'cp2', version: '2.1', link: 'http://mylink.com/cp2-2.1.jar' }
    ];

    let response = await request(mock)
      .post(endPoint)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpaths').lengthOf(data.length);
    resp['classpaths'].forEach(po => verifyClassPathObject(po, data.find(p => p.link === po.link)));
    response = await request(mock)
      .get(endPoint)
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('classpaths').lengthOf(data.length);
  });

  function verifyClassPathObject(cpObj, original) {
    expect(cpObj).to.have.property('id');
    if(original.hasOwnProperty('id')) {
      expect(cpObj).to.have.property('id').eq(original.id);
    }
    expect(cpObj).to.have.property('name').eq(original.name);
    expect(cpObj).to.have.property('version').eq(original.version);
    expect(cpObj).to.have.property('link').eq(original.link);
  }

  function sleep(ms){
    return new Promise(resolve => {
      setTimeout(resolve,ms)
    })
  }
});
