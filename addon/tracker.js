import Ember from 'ember';
import {valuesChanged, hasManyChanged, relationShipTransform} from './utilities';

const assign = Ember.assign || Ember.merge;
export const ModelTrackerKey = '-change-tracker';
const alreadyTrackedRegex    = /^-mf-|string|boolean|date|^number$/,
      knownTrackerOpts       = Ember.A(['only', 'auto', 'except', 'trackHasMany', 'enableIsDirty']),
      defaultOpts            = { trackHasMany: true, auto: false, enableIsDirty: false };

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
  static isAutoSaveEnabled(model) {
    if (model.constructor.trackerAutoSave === undefined) {
      let options = this.options(model);
      model.constructor.trackerAutoSave = options.auto;
    }
    return model.constructor.trackerAutoSave;
  }

  /**
   * Is this model have isDirty option enabled?
   *
   * @param model
   * @returns {Boolean}
   */
  static isIsDirtyEnabled(model) {
    if (model.constructor.trackerEnableIsDirty === undefined) {
      let options = this.options(model);
      model.constructor.trackerEnableIsDirty = options.enableIsDirty;
    }
    return model.constructor.trackerEnableIsDirty;
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
   * The rollback data will be an object with keys as attribute and relationship names
   * with values for those keys.
   *
   *    For example:
   *
   *    { id: 1, name: 'Acme Inc', company: 1, pets: [1,2] }
   *
   * Basically a REST style payload. So, convert that to JSONAPI so it can be
   * pushed to the store
   *
   * @param {DS.Model} model
   * @param {Object} data rollback data
   */
  static normalize(model, data) {
    let modelClass = model.store.modelFor(model.constructor.modelName);
    let container = this.container(model);
    let serializer = container.lookup('serializer:-rest');
    serializer.set('store', model.store);
    return serializer.normalize(modelClass, data);
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
   *   changeTracker: {auto: true, enableIsDirty: true}
   *   changeTracker: {auto: true, only: ['info']}
   *   changeTracker: {except: ['info']}
   *   changeTracker: {except: ['info'], trackHasMany: true}
   *
   * In config environment you can set options like:
   *
   *   changeTracker: {auto: true, trackHasMany: false, enableIsDirty: true}
   *   // default is:  {auto: false, trackHasMany: true, enableIsDirty: false}
   *
   * The default is set to trackHasMany but not auto track, since
   * that is the most do nothing approach and when you do call `model.startTrack()`
   * it is assumed you want to track everything.
   *
   * Also, by default the isDirty computed property is not setup. You have to enable
   * it globally or on a model
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
      'only', 'except' , 'auto', 'enableIsDirty' or 'trackHasMany' but you are declaring: ${unknownOpts}`,
      Ember.isEmpty(unknownOpts)
    );

    return opts;
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
      model.constructor.trackerEnableIsDirty = info.enableIsDirty;
    }
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

    let { enableIsDirty } = trackerOpts;
    return { autoSave: trackerOpts.auto, enableIsDirty, keyMeta };
  }

  /**
   * Go through the models attributes and relationships so see
   * which of these keys could be trackable
   *
   * @param {DS.Model} model
   * @returns {[*,*]} meta data about possible keys to track
   */
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
   * @param {Object} [changed] changed object
   * @param {Object} [info] model tracker meta data object
   * @returns {*}
   */
  static didChange(model, key, changed, info) {
    changed = changed || model.changedAttributes();
    if (changed[key]) {
      return true;
    }
    let keyInfo = info && info[key] || this.metaInfo(model, key);
    if (keyInfo) {
      let current = this.serialize(model, key, keyInfo);
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
  static serialize(model, key, keyInfo) {
    let info = keyInfo || this.metaInfo(model, key);
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

  /**
   * Set up the computed properties:
   *
   *  'isDirty', 'hasDirtyAttributes', 'hasDirtyRelations'
   *
   * only if the application or model configuration has opted into
   * enable these properties, with the enableIsDirty flag
   *
   * @param {DS.Model} model
   */
  static initializeDirtiness(model) {
    const relations = [];
    const relationsObserver = [];
    const attrs = [];

    model.eachRelationship((name, descriptor) => {
      if (descriptor.type === 'hasMany') {
        relations.push(descriptor.key);
        relationsObserver.push(descriptor.key + '.content.[]');
      } else {
        relations.push(descriptor.key);
        relationsObserver.push(descriptor.key + '.content');
      }
    });

    model.eachAttribute((name) => {
      return attrs.push(name);
    });

    const hasDirtyRelations = function() {
      const changed = model.changed();
      return !!relations.find(key => changed[key]);
    };

    const hasDirtyAttributes = function() {
      const changed = model.changed();
      return !!attrs.find(key => changed[key]);
    };

    const isDirty = function() {
      return model.get('hasDirtyAttributes') || model.get('hasDirtyRelations');
    };

    Ember.defineProperty(
      model,
      'hasDirtyAttributes',
      Ember.computed.apply(Ember, attrs.concat([hasDirtyAttributes]))
    );

    Ember.defineProperty(
      model,
      'hasDirtyRelations',
      Ember.computed.apply(Ember, relationsObserver.concat([hasDirtyRelations]))
    );

    Ember.defineProperty(
      model,
      'isDirty',
      Ember.computed.apply(Ember, ['hasDirtyAttributes', 'hasDirtyRelations', isDirty])
    );

  }

}