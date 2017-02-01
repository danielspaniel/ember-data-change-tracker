import Ember from 'ember';
import {valuesChanged, hasManyChanged, relationShipTransform} from './utilities';

const assign = Ember.assign || Ember.merge;
export const ModelTrackerKey = '-change-tracker';
const alreadyTrackedRegex = /^-mf-|string|boolean|date|^number$/;
const knownTrackerOpts = Ember.A(['only', 'auto', 'except', 'trackHasMany']);
const defaultOpts = { trackHasMany: true, auto: false };

/**
 * Helper class for change tracking models
 */
export default class Tracker {

  /**
   * Get Ember application container
   *
   * @param {DS.Model} model
   * @returns {*}
   */
  static container(model) {
    return Ember.getOwner ? Ember.getOwner(model.store) : model.store.container;
  }

  /**
   * Get tracker configuration from Ember application configuration
   *
   * @param {DS.Model} model
   * @returns {*|{}}
   */
  static envConfig(model) {
    let config = this.container(model).resolveRegistration('config:environment');
    // sometimes the config is not available ?? not sure why
    return config && config.changeTracker || {};
  }

  /**
   * Get tracker configuration that is set on the model
   *
   * @param {DS.Model} model
   * @returns {*|{}}
   */
  static modelConfig(model) {
    return model.changeTracker || {};
  }

  /**
   * Is this model in auto save mode?
   *
   * @param model
   * @returns {Boolean}
   */
  static autoSave(model) {
    if (model.constructor.trackerAutoSave === undefined) {
      let options = this.options(model);
      model.constructor.trackerAutoSave = options.auto;
    }
    return model.constructor.trackerAutoSave;
  }

  /**
   * A custom attribute should have a transform function associated with it.
   * If not, use object transform.
   *
   * A transform function is required for serializing and deserializing
   * the attribute in order to save past values and then renew them on rollback
   *
   * @param {DS.Model} model
   * @param {String} attributeType like: 'object', 'json' or could be undefined
   * @returns {*}
   */
  static transformFn(model, attributeType) {
    let transformType = attributeType || 'object';
    return model.store.serializerFor(model.constructor.modelName).transformFor(transformType);
  }

  /**
   * Find the meta data for all keys or a single key (attributes/association)
   * that tracker is tracking on this model
   *
   * @param {DS.Model} model
   * @param {string} [key] only this key's info and no other
   * @returns {*} all the meta info on this model that tracker is tracking
   */
  static metaInfo(model, key = null) {
    let info = (model.constructor.trackerKeys || {});
    if (key) {
      return info[key];
    }
    return info;
  }

  /**
   * On the model you can set options like:
   *
   *   changeTracker: {auto: true}
   *   changeTracker: {auto: true, only: ['info']}
   *   changeTracker: {except: ['info']}
   *   changeTracker: {except: ['info'], trackHasMany: true}
   *
   * In config environment you can set options like:
   *
   *   changeTracker: {auto: true, trackHasMany: false}
   *   // default is:  {auto: false, trackHasMany: true}
   *
   * @param {DS.Model} model
   * @returns {*}
   */
  static options(model) {
    let envConfig = this.envConfig(model);
    let modelConfig = this.modelConfig(model);
    let opts = assign({}, defaultOpts, envConfig, modelConfig);

    let unknownOpts = Object.keys(opts).filter((v) => !knownTrackerOpts.includes(v));
    Ember.assert(`[ember-data-change-tracker] changeTracker options can have
      'only', 'except' , 'auto', or 'trackHasMany' but you are declaring: ${unknownOpts}`,
      Ember.isEmpty(unknownOpts)
    );

    return opts;
  }

  /**
   * Serialize the value to be able to tell if the value changed.
   *
   * For attributes, using the transform function that each custom
   * attribute should have.
   *
   * For belongsTo, and hasMany using using custom transform
   *
   * @param {DS.Model} model
   * @param {String} key attribute/association name
   */
  static serialize(model, key) {
    let info = this.metaInfo(model, key);
    let value;
    if (info.type === 'attribute') {
      value = info.transform.serialize(model.get(key));
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
    } else {
      value = info.transform.serialize(model, key, info);
    }
    return value;
  }

  // has tracking already been setup on this model?
  static trackingIsSetup(model) {
    return model.constructor.alreadySetupTrackingMeta;
  }

  /**
   * Setup tracking meta data for this model,
   * unless it's already been setup
   *
   * @param {DS.Model} model
   */
  static setupTracking(model) {
    if (!this.trackingIsSetup(model)) {
      model.constructor.alreadySetupTrackingMeta = true;
      let info = Tracker.getTrackerInfo(model);
      model.constructor.trackerKeys = info.keyMeta;
      model.constructor.trackerAutoSave = info.autoSave;
    }
  }

  static extractKeys(model) {
    let { constructor } = model;
    let trackerKeys = {};
    let hasManyList = [];

    constructor.eachAttribute((attribute, meta) => {
      if (!alreadyTrackedRegex.test(meta.type)) {
        trackerKeys[attribute] = { type: 'attribute', name: meta.type };
      }
    });

    constructor.eachRelationship((key, relationship) => {
      trackerKeys[key] = {
        type: relationship.kind,
        polymorphic: relationship.options.polymorphic
      };
      if (relationship.kind === 'hasMany') {
        hasManyList.push(key);
      }
    });

    return [trackerKeys, hasManyList];
  }

  /**
   * Get the tracker meta data associated with this model
   *
   * @param {DS.Model} model
   * @returns {{autoSave, keyMeta: {}}}
   */
  static getTrackerInfo(model) {
    let [trackableInfo, hasManyList] = this.extractKeys(model);
    let trackerOpts = this.options(model);
    let all = new Set(Object.keys(trackableInfo));
    let except = new Set(trackerOpts.except || []);
    let only = new Set(trackerOpts.only || [...all]);

    if (!trackerOpts.trackHasMany) {
      except = new Set([...except, ...hasManyList]);
    }

    all = new Set([...all].filter(a => !except.has(a)));
    all = new Set([...all].filter(a => only.has(a)));

    let keyMeta = {};
    Object.keys(trackableInfo).forEach(key => {
      if (all.has(key)) {
        let info = trackableInfo[key];
        info.transform = this.getTransform(model, key, info);
        keyMeta[key] = info;
      }
    });

    return { autoSave: trackerOpts.auto, keyMeta };
  }

  /**
   * Get the transform for an attribute or association.
   * The attribute transforms are held by ember-data, and
   * the tracker uses custom transform for relationships
   *
   * @param {DS.Model} model
   * @param {String} key attribute/association name
   * @param {Object} info tracker meta data for this key
   * @returns {*}
   */
  static getTransform(model, key, info) {
    let transform;

    if (info.type === 'attribute') {
      transform = this.transformFn(model, info.name);

      Ember.assert(`[ember-data-change-tracker] changeTracker could not find
      a ${info.name} transform function for the attribute '${key}' in
      model '${model.constructor.modelName}'.
      If you are in a unit test, be sure to include it in the list of needs`,
        transform
      );
    } else {
      transform = relationShipTransform[info.type];
    }

    return transform;
  }

  /**
   * Did the key change since the last time state was saved?
   *
   * @param {DS.Model} model
   * @param {String} key attribute/association name
   * @param {Boolean} changed
   * @returns {*}
   */
  static didChange(model, key, changed, info) {
    changed = changed || model.changedAttributes();
    if (changed[key]) {
      return true;
    }
    let keyInfo = info && info[key] || this.metaInfo(model, key);
    if (keyInfo) {
      let current = this.serialize(model, key);
      let last = this.lastValue(model, key);
      switch (keyInfo.type) {
        case 'attribute':
        case 'belongsTo':
          return valuesChanged(current, last, keyInfo.polymorphic);
        case 'hasMany':
          return hasManyChanged(current, last, keyInfo.polymorphic);
      }
    }
  }

  /**
   * Retrieve the last known value for this model key
   *
   * @param {DS.Model} model
   * @param {String} key attribute/association name
   * @returns {*}
   */
  static lastValue(model, key) {
    return (model.get(ModelTrackerKey) || {})[key];
  }

  /**
   * Save current model key value in model's tracker hash
   *
   * @param {DS.Model} model
   * @param {String} key attribute/association name
   */
  static saveKey(model, key) {
    let tracker = model.get(ModelTrackerKey) || {};
    tracker[key] = this.serialize(model, key);
    model.set(ModelTrackerKey, tracker);
  }

  /**
   * Remove tracker hash from the model's state
   *
   * @param {DS.Model} model
   */
  static clear(model) {
    model.set(ModelTrackerKey, undefined);
  }

  static startTrack(model) {
    model.saveChanges();
  }

  /**
   * Save change tracker attributes
   *
   * @param {DS.Model} model
   */
  static saveChanges(model) {
    let metaInfo = this.metaInfo(model);
    Object.keys(metaInfo).forEach((key) => {
      Tracker.saveKey(model, key);
    });
  }
}