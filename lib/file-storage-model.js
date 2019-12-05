const fs = require('fs');
const mingo = require('mingo');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

class FileModel {
  constructor(name, params) {
    this.storageParameters = params;
    this.dataDir = `./${this.storageParameters.get('dataDir') || 'data'}`;
    this.activePath = `${this.dataDir}/${name}.json`;
    this.archivePath = `${this.dataDir}/${name}__ARCHIVE__.json`;

    // create data paths
    fs.promises.mkdir(this.dataDir, {recursive: true})
      .then(() => {
        return this.fileExists(this.activePath);
      })
      .then((res) => {
        if (!res) {
          return this.writeActiveFile([]);
        }
      })
      .then(() => {
        return this.fileExists(this.archivePath);
      })
      .then((res) => {
        if (!res) {
          return this.writeArchiveFile([]);
        }
      });
  }

  // get the active collection
  async getActiveCollection() {
    const data = await readFile(this.activePath, 'utf8');
    return JSON.parse(data);
  }

  // get the archive collection
  async getArchiveCollection() {
    const data = await readFile(this.archivePath, 'utf8');
    return JSON.parse(data);
  }

  // write to active collection
  async writeActiveFile(content) {
    await writeFile(this.activePath, JSON.stringify(content), 'utf8');
  }

  // write to archive collection
  async writeArchiveFile(content) {
    await writeFile(this.archivePath, JSON.stringify(content), 'utf8');
  }

  async fileExists(filepath) {
    try {
      await stat(filepath);
      return true;
    } catch (err) {
      return false;
    }
  }

  async find(query, versionsAgo) {
    if(versionsAgo && versionsAgo > 0) {
      return await this.findArchive(query, versionsAgo);
    }
    else {
      return await this.findActive(query);
    }
  }

  // find active record
  async findActive(query) {
    try {
      const collection = await this.getActiveCollection();
      return await mingo.find(collection, query).all();
    } catch (err) {
      throw Error(err);
    }
  }

  // find active record
  async findArchive(query, versionsAgo) {
    try {
      const collection = await this.getArchiveCollection();
      return await mingo.find(collection, query).sort({archiveDate: -1}).skip(versionsAgo - 1).limit(1).all();
    } catch (err) {
      throw Error(err);
    }
  }

  async addRecord(key, record) {
    // drop archiveDate in case this was a recovered record that is being re-activated
    delete record.archiveDate;
    // look for an existing record
    const results = await this.findActive(key);
    if (results.length > 0) {
      // if it exists, treat as an update
      record.creationDate = results[0].creationDate || new Date();
      return await this.updateRecord(key, record);
    } else {
      // generate timestamps
      record.creationDate = new Date();
      record.modifiedDate = new Date();
      // add record to active collection
      const collection = await this.getActiveCollection();
      collection.push(record);
      await this.writeActiveFile(collection);
      return record;
    }
  }

  async updateRecord(key, record) {
    // drop archiveDate in case this was a recovered record that is being re-activated
    delete record.archiveDate;
    // find the active record
    const stored = await this.findActive(key);
    if (stored.length === 0) {
      // add record to active collection if it doesn't exist
      return await this.addRecord(key, record);
    } else if (stored.length === 1) {
      // send existing record to archive collection
      await this.sendRecordToArchive(stored[0]);
      // delete active record
      await this.deleteRecord(key);
      // generate timestamps
      record.modifiedDate = new Date();
      record.creationDate = stored[0].creationDate;
      // add updated record to the active collection
      const collection = await this.getActiveCollection();
      collection.push(record);
      await this.writeActiveFile(collection);
      return record;
    } else {
      throw Error('multiple records found while attempting to update');
    }
  }

  async deleteRecord(query) {
    // find the active record
    const stored = this.findActive(query);
    // send existing record to archive
    if(stored.length > 0) {
      await this.sendRecordToArchive(stored[0]);
    }
    // delete record from active collection
    const collection = await this.getActiveCollection();
    const updatedCollection = mingo.remove(collection, query);
    await this.writeActiveFile(updatedCollection);
  }

  async sendRecordToArchive(record) {
    // set the archive date
    record.archiveDate = new Date();

    // add record to archive collection
    const collection = await this.getArchiveCollection();
    collection.push(record);
    await this.writeArchiveFile(collection);

    // reset record to original
    delete record.archiveDate;
  }
}

module.exports = FileModel;
