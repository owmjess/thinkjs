'use strict';

import Base from './_base.js';

let MongoDb = think.adapter('db', 'mongo');

/**
 * mongodb model
 */
export default class extends Base {
  /**
   * get primary key
   * @return {Promise} []
   */
  getPk(){
    return '_id';
  }
  /**
   * parse options
   * @param  {Object} options []
   * @return promise         []
   */
  async parseOptions(oriOpts, extraOptions){
    let options = think.extend({}, this._options);
    if (think.isObject(oriOpts)) {
      options = think.extend(options, oriOpts, extraOptions);
    }
    //clear options
    this._options = {};
    //get table name
    options.table = options.table || this.getTableName();

    options.tablePrefix = this.tablePrefix;
    options.model = this.getModelName();

    if(!think.isObject(oriOpts)){
      options = think.extend(options, oriOpts, extraOptions);
    }
    return this._optionsFilter(options);
  }
  /**
   * parse data
   * @param  {Object} data []
   * @return {Object}      []
   */
  parseData(data){
    return data;
  }
  /**
   * get table connection
   * @return {Promise} []
   */
  collection(table){
    table = table || this.getTableName();
    return this.db().collection(table);
  }
  /**
   * add data
   * @param {Object} data    []
   * @param {Object} options []
   */
  async add(data, options){
    //copy data
    data = think.extend({}, this._data, data);
    //clear data
    this._data = {};
    if (think.isEmpty(data)) {
      let msg = new Error(think.locale('DATA_EMPTY'));
      return think.reject(msg);
    }
    options = await this.parseOptions(options);
    data = await this._beforeAdd(data, options);
    data = this.parseData(data);
    await this.db().add(data, options);
    await this._afterAdd(data, options);
    return this.db().getLastInsertId();
  }
  /**
   * if data not exist, then add. 
   * @param  {Object} data       []
   * @param  {Object} where      []
   * @param  {} returnType []
   * @return {}            []
   */
  thenAdd(data, where, returnType){

  }
  /**
   * add multi data
   * @param {Object} data    []
   * @param {} options []
   * @param {} replace []
   */
  async addMany(data, options){
    if (!think.isArray(data) || !think.isObject(data[0])) {
      let err = new Error(think.locale('DATA_MUST_BE_ARRAY'));
      return think.reject(err);
    }
    options = await this.parseOptions(options);
    data = await this._beforeAdd(data, options);
    await this.db().addMany(data, options);
    await this._afterAdd(data, options);
    return this.db().getLastInsertId();
  }
  /**
   * delete data
   * @return {} []
   */
  async delete(options){
    options = await this.parseOptions(options);
    let data = await this.db().delete(options);
    await this._afterDelete(options);
    return data.result.n || 0;
  }
  /**
   * update data
   * @return {Promise} []
   */
  async update(data, options){
    options = await this.parseOptions(options);
    let pk = await this.getPk();
    if(data[pk]){
      this.where({[pk]: data[pk]});
      delete data[pk];
    }
    let result = await this.db().update(data, options);
    await this._afterUpdate(data, options);
    return result.result.nModified || 0;
  }
  /**
   * update many data
   * @param  {Promise} dataList []
   * @return {Promise}          []
   */
  async updateMany(dataList, options){
    if (!think.isArray(dataList)) {
      return think.reject(new Error(think.locale('DATA_MUST_BE_ARRAY')));
    }
    let promises = dataList.map(data => {
      return this.update(data, options);
    });
    return Promise.all(promises).then(data => {
      return data.reduce((a, b) => a + b);
    });
  }
  /**
   * select data
   * @return {Promise} []
   */
  async select(options){
    options = await this.parseOptions(options);
    let data = await this.db().select(options);
    return this._afterSelect(data, options);
  }
  /**
   * select one row data
   * @param  {Object} options []
   * @return {Promise}         []
   */
  async find(options){
    options = await this.parseOptions(options, {limit: 1});
    let data = await this.db().select(options);
    return this._afterFind(data[0] || {}, options);
  }
  /**
   * increment field data
   * @param  {String} field []
   * @param  {Number} step  []
   * @return {Promise}       []
   */
  async increment(field, step = 1){
    let options = await this.parseOptions(options);
    return this.db().update({
      $inc: {
        [field]: step
      }
    }, options);
  }
  /**
   * decrement field data
   * @param  {String} field []
   * @param  {Number} step  []
   * @return {Promise}       []
   */
  async decrement(field, step = 1){
    let options = await this.parseOptions(options);
    return this.db().update({
      $inc: {
        [field]: 0 - step
      }
    }, options);
  }
  /**
   * get count 
   * @param  {String} field []
   * @return {Promise}       []
   */
  async count(field){
    this.field(field);
    let options = await this.parseOptions();
    return this.db().count(options);
  }
  /**
   * get sum
   * @param  {String} field []
   * @return {Promise}       []
   */
  async sum(field){
    this.field(field);
    let options = await this.parseOptions();
    return this.db().sum(options);
  }
  /**
   * aggregate
   * http://docs.mongodb.org/manual/reference/sql-aggregation-comparison/
   * @param  {} options []
   * @return {}         []
   */
  aggregate(options){
    return this.db().aggregate(this.getTableName(), options);
  }
  /**
   * create indexes
   * @param  {Object} indexes []
   * @return {Promise}         []
   */
  createIndex(indexes){
    return this.db().createIndex(this.getTableName(), indexes);
  }
}