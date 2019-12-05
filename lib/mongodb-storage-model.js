const MongoDb = require('./mongo');

class MongoDBModel {
  constructor(collectionName, config) {
    this.activeCollectionName = collectionName;
    this.archiveCollectionName = `${collectionName}__ARCHIVE__`;
    MongoDb.init(config);
  }

  getActiveCollection() {
    return MongoDb.getDatabase().collection(this.activeCollectionName);
  }

  getArchiveCollection() {
    return MongoDb.getDatabase().collection(this.archiveCollectionName);
  }

  async find(query, versionsAgo) {
    if (versionsAgo && versionsAgo > 0) {
      return await this.getArchiveCollection().find(query).sort({ archiveDate: -1 }).skip(versionsAgo -1).limit(1).toArray();
    } else {
      return await this.getActiveCollection().find(query).toArray();
    }
  }

  async addRecord(key, record) {
    // drop archiveDate in case this was a recovered record that is being re-activated
    delete record.archiveDate;
    // find record in the active collection
    const exists = await this.find(key, 0);
    // generate or update timestamps
    if (exists.length > 0) {
      record.creationDate = exists[0].creationDate;
    } else {
      record.creationDate = new Date();
    }
    record.modifiedDate = new Date();
    // update record
    return await this.updateRecord(key, record);
  }

  async updateRecord(key, record) {
    // drop archiveDate in case this was a recovered record that is being re-activated
    delete record.archiveDate;
    // find record in active collection
    const exists = await this.find(key, 0);
    // archive active record if it exists and generate timestamps
    if (exists.length > 0) {
      await this.sendRecordToArchive(key, exists[0]);
      record.creationDate = exists[0].creationDate;
    } else {
      record.creationDate = new Date();
    }
    record.modifiedDate = new Date();
    // update active collection
    const doc = await this.getActiveCollection().findOneAndUpdate(key, {$set: record}, {
      upsert: true,
      returnOriginal: false
    });
    return doc.value;
  }

  async deleteRecord(query) {
    // try to find the active record
    const exists = await this.find(query, 0);
    // archive active record if it exists
    if(exists.length > 0) {
      await this.sendRecordToArchive(query, exists[0]);
    }
    // remove record from active collection
    return await this.getActiveCollection().findOneAndDelete(query);
  }

  async sendRecordToArchive(key, record) {
    // add archiveDate timestamp to record and key
    record.archiveDate = new Date();
    key.archiveDate = record.archiveDate;

    // drop the existing _id if it exists
    delete record._id;

    // add to archive collection
    await this.getArchiveCollection().findOneAndUpdate(key, {$set: record}, {
      upsert: true,
      returnOriginal: false
    });

    // reset original record and key
    delete record.archiveDate;
    delete key.archiveDate;
  }
}

module.exports = MongoDBModel;
