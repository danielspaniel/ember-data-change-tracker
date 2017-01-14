import Ember from 'ember';
const { isEmpty } = Ember;
//const { dasherize } = Ember.String;

const assign = Ember.assign || Ember.merge;
export const ModelTrackerKey = '-change-tracker';
const skipAttrRegex = /string|boolean|date|number/;
const knownTrackerOpts = Ember.A(['only', 'except', 'trackHasMany']);
/**
 * Helper class for change tracking models
 */
export default class Tracker {

  static container(model) {
    return Ember.getOwner ? Ember.getOwner(model.store) : model.store.container;
  }

  static envConfig(model) {
    return this.container(model).resolveRegistration('config:environment') || {};
  }

  /**
   * A custom attribute should have a transform function associated with it.
   * If not, use object transform. A transform function is required for
   * serializing and deserializing the attribute in order to save past values
   * and then retrieve them for comparison with current.
   *
   * @param model
   * @param {String} attributeType 'object', 'json' or could be undefined
   * @returns {*}
   */
  static transformFn(model, attributeType) {
    return this.container(model).lookup(`transform:${attributeType || 'object'}`);
  }

  /**
   * Find the extra attribute info for a key
   *
   * @param model
   * @param key
   * @returns {*}
   */
  static modelInfo(model, key) {
    return (model.constructor.extraAttributeChecks || {})[key];
  }

  static includeChangeKey(key, opts) {
    return Ember.$.isEmptyObject(opts) ||
      opts.only && opts.only.includes(key) ||
      opts.except && !opts.except.includes(key);
  }

  static includeAttribute(key, type, opts) {
    return !skipAttrRegex.test(type) && this.includeChangeKey(key, opts);
  }

  static valuesChanged(value1, value2) {
    let valuesBlank = isEmpty(value1) && isEmpty(value2);
    return !(valuesBlank || value1.toString() === value2.toString());
  }

  /**
   * On the model you can set options like:
   *
   *   changeTracker: {only: ['info']}
   *   changeTracker: {except: ['info']}
   *   changeTracker: {except: ['info'], trackHasMany: true}
   *
   * In config environment you can set options like:
   *
   *   changeTracker: {trackHasMany: false}
   *
   * @returns {*}
   */
  static options(model) {
    let envConfig = this.envConfig(model).changeTracker || {};
    let modelConfig = model.changeTracker || {};

    let opts = assign(envConfig, modelConfig);
    Ember.assert(`[ember-data-change-tracker] changeTracker options can have 'only' 
      or 'except' but not user both together.`,
      !(opts.only && opts.except)
    );

    let unknownOpts = Object.keys(opts).filter((v)=>!knownTrackerOpts.includes(v));
    Ember.assert(`[ember-data-change-tracker] changeTracker options can have 
      'only' or 'except' or 'trackHasMany' but you are declaring: ${unknownOpts}`,
      Ember.isEmpty(unknownOpts)
    );

    return opts;
  }

  /**
   * Serializing the value to be able to tell if the value changed.
   * For attributes, using the transform function that each custom
   * attribute should have.
   *
   * For belongsTo using object with {type, id}
   * For hasMany using array of objects with {type, id}
   *
   * @param {String} key attribute or relationship key
   */
  static serialize(model, key) {
    let info = this.modelInfo(model, key);
    switch (info.type) {
      case 'belongsTo':
        let value = model.belongsTo(key).value();
        return { type: value && value.constructor.modelName, id: value && value.id };
      case 'attribute':
        return info.transform.serialize(model.get(key));
    }
  }

  /**
   * Deserialze value
   *
   * @param {DS.model} model
   * @param {String} key attibute name
   * @param {String|Object} value
   * @returns {*}
   */
  static deserialize(model, key, value) {
    let info = this.modelInfo(model, key);
    switch (info.type) {
      case 'belongsTo':
        return value.id ? model.store.peekRecord(value.type, value.id) : null;
      case 'attribute':
        return info.transform.deserialize(value);
    }
  }
  
  static extractAtttibutes(model) {
    let { constructor } = model;
    constructor.alreadySetupExtraAttributes = true;
    let trackerOpts = this.options(model);
    let extraChecks = {};
    constructor.eachAttribute((attribute, meta)=> {
      if (this.includeAttribute(attribute, meta.type, trackerOpts)) {
        let transform = this.transformFn(model, meta.type);
//        Ember.assert() nice transformer missing in test mode
        extraChecks[attribute] = { type: 'attribute', transform };
      }
    });
    constructor.eachRelationship(function(key, relationship) {
      if (relationship.kind === 'belongsTo') {
        extraChecks[key] = { type: relationship.kind };
      }
    });
    //    console.log('extact', this.constructor.modelName, extraChecks);
    constructor.extraAttributeChecks = extraChecks;
  }

  /**
   * Retrieve the last known value for this model key
   *
   * @param {DS.model} model
   * @param {String} key attibute name
   * @returns {*}
   */
  static lastValue(model, key) {
    return (model.get(ModelTrackerKey) || {})[key];
  }

  /**
   *
   * @param {DS.model} model
   * @param {String} key attibute name
   * @returns {*}
   */
  static deserializedlastValue(model, key) {
    return this.deserialize(model, key, this.lastValue(model, key));
  }

  /**
   * Save current model key value in model's tracker hash
   *
   * @param {DS.model} model
   * @param {String} key attibute name
   */
  static saveAttribute(model, key) {
    let currentValue = this.serialize(model, key);
    let tracker = model.get(ModelTrackerKey) || {};
    tracker[key] = currentValue;
    model.set(ModelTrackerKey, tracker);
  }

  /**
   * Remove tracker hash from the model's state
   *
   * @param {DS.model} model
   */
  static clear(model) {
    model.set(ModelTrackerKey, undefined);
  }

  /**
   * Save change tracker attributes
   *
   * @param {DS.model} model
   */
  static saveChanges(model) {
    let extraAttributeChecks = model.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (extraAttributeChecks.hasOwnProperty(key)) {
        Tracker.saveAttribute(model, key);
      }
    }
  }
}