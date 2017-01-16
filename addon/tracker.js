import Ember from 'ember';
const { isEmpty } = Ember;

const assign = Ember.assign || Ember.merge;
export const ModelTrackerKey = '-change-tracker';
//const modelFragmentRegex = /^-mf-/;
const skipAttrRegex = /string|boolean|date|^number$/;
const knownTrackerOpts = Ember.A(['only', 'except', 'trackHasMany']);

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
   * Get Ember application configuration
   *
   * @param {DS.Model} model
   * @returns {*|{}}
   */
  static envConfig(model) {
    return this.container(model).resolveRegistration('config:environment') || {};
  }

  /**
   * A custom attribute should have a transform function associated with it.
   * If not, use object transform.
   * A transform function is required for serializing and deserializing
   * the attribute in order to save past values and also to retrieve
   * them for comparison with current.
   *
   * @param {DS.Model} model
   * @param {String} attributeType like: 'object', 'json' or could be undefined
   * @returns {*}
   */
  static transformFn(model, attributeType) {
    let transformType = attributeType || 'object';
    //    if (/-mf-array/.test(attributeType)) {
    //      transformType = 'array';
    //    }
    //    if (/-mf-fragment/.test(attributeType)) {
    //      transformType = 'fragment';
    //    }
    return model.store.serializerFor(model.constructor.modelName).transformFor(transformType);
  }

  /**
   * Find the extra attribute info for a key
   *
   * @param {DS.Model} model
   * @param {String} key attibute name
   * @returns {*}
   */
  static modelInfo(model, key) {
    return (model.constructor.extraAttributeChecks || {})[key];
  }

  /**
   * Should this attribute be tracked based on model options
   *
   * @param {String} key attribute name
   * @param {Object} opts model options
   * @returns {*}
   */
  static trackChangeKey(key, opts) {
    if (Ember.$.isEmptyObject(opts) ||
      Object.keys(opts).length === 1 && opts.hasOwnProperty('trackHasMany')
    ) {
      return true;
    }
    return (
      opts.only && opts.only.includes(key) ||
      opts.except && !opts.except.includes(key)
    );
  }

  /**
   * Should this attribute be tracked.
   *
   * Don't track types that ember-data already tracks, like
   * string, number, boolean and date types.
   *
   * @param {String} key attribute name
   * @param {Object} opts model options
   * @returns {*}
   */
  static trackAttribute(key, type, opts) {
    return !skipAttrRegex.test(type) && this.trackChangeKey(key, opts);
  }

  static valuesChanged(value1, value2) {
    let valuesBlank = isEmpty(value1) && isEmpty(value2);
    return !(valuesBlank || value1 === value2);
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

   * @param {DS.Model} model
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
   * Serialize the value to be able to tell if the value changed.
   *
   * For attributes, using the transform function that each custom
   * attribute should have.
   *
   * For belongsTo using object with {type, id}
   * For hasMany using array of objects with {type, id}
   *
   * @param {DS.Model} model
   * @param {String} key attribute or relationship key
   */
  static serialize(model, key) {
    let info = this.modelInfo(model, key);
    let value;
    switch (info.type) {
      //      case '-mf-array':
      case 'attribute':
        value = info.transform.serialize(model.get(key));
        // serializer transform might not stringify, and this value must be
        // a string in order to correctly track modifications
        return JSON.stringify(value);
      case 'belongsTo':
        value = model.belongsTo(key).value();
        return value && { type: value && value.constructor.modelName, id: value && value.id };
      case 'hasMany':
        let values = model.hasMany(key).value();
        return values && values.map((value)=> {
            return { type: value.constructor.modelName, id: value && value.id };
          });
    }
  }

  /**
   * Deserialze value
   *
   * @param {DS.Model} model
   * @param {String} key attibute name
   * @param {String|Object} value
   * @returns {*}
   */
  static deserialize(model, key, value) {
    let info = this.modelInfo(model, key);
    switch (info.type) {
      //      case '-mf-array':
      //        return info.transform.deserialize(JSON.parse(value));
      case 'attribute':
        return info.transform.deserialize(value);
      case 'belongsTo':
        return value && value.id ? model.store.peekRecord(value.type, value.id) : null;
      case 'hasMany':
        let values = value;
        return values && values.map((value)=> {
            return value.id ? model.store.peekRecord(value.type, value.id) : null;
          });
    }
  }

  static extractAtttibutes(model) {
    let { constructor } = model;
    constructor.alreadySetupExtraAttributes = true;
    let trackerOpts = this.options(model);
    let extraChecks = {};
    constructor.eachAttribute((attribute, meta)=> {
      if (this.trackAttribute(attribute, meta.type, trackerOpts)) {
        let transform = this.transformFn(model, meta.type);
        Ember.assert(`[ember-data-change-tracker] changeTracker could not find
          a ${meta.type} transform function for the attribute '${attribute}' in
          model '${model.constructor.modelName}'.
          If you are in a unit test, be sure to include it in the list of needs`,
          transform
        );
        let type = 'attribute';
        //        if (modelFragmentRegex.test(meta.type)) {
        //          type = meta.type.split('$')[0];
        //        }
        extraChecks[attribute] = { type, transform };
      }
    });
    constructor.eachRelationship(function(key, relationship) {
      if (relationship.kind === 'belongsTo' || relationship.kind === 'hasMany') {
        extraChecks[key] = { type: relationship.kind };
      }
    });
    //    console.log('extact', model.constructor.modelName, extraChecks);
    constructor.extraAttributeChecks = extraChecks;
  }

  /**
   *
   * @param model
   * @param key
   * @param changed
   * @returns {*}
   */
  static didChange(model, key, changed) {
    changed = changed || model.changedAttributes();
    if (changed[key]) {
      return true;
    }
    let info = this.modelInfo(model, key);
    if (info) {
      let current = this.serialize(model, key);
      let last = this.lastValue(model, key);
      switch (info.type) {
        case '-mf-array':
        case 'attribute':
          return this.valuesChanged(current, last);
        case 'belongsTo':
          if (!current && !last) {
            return false;
          }
          if (!current && last || current && !last) {
            return true;
          }
          return !(current.type === last.type && current.id === last.id);
        case 'hasMany':
          if (!current && !last) {
            return false;
          }
          if ((current && current.length) !== (last && last.length)) {
            return true;
          }
          let currentSorted = current.sortBy('id');
          let lastSorted = last.sortBy('id');
          return !!currentSorted.find((value, i)=> {
            return value.type !== lastSorted[i].type || value.id !== lastSorted[i].id;
          });
      }
    }
  }

  /**
   * Retrieve the last known value for this model key
   *
   * @param {DS.Model} model
   * @param {String} key attibute name
   * @returns {*}
   */
  static lastValue(model, key) {
    return (model.get(ModelTrackerKey) || {})[key];
  }

  /**
   *
   * @param {DS.Model} model
   * @param {String} key attibute name
   * @returns {*}
   */
  static deserializedlastValue(model, key) {
    return this.deserialize(model, key, this.lastValue(model, key));
  }

  /**
   * Save current model key value in model's tracker hash
   *
   * @param {DS.Model} model
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
   * @param {DS.Model} model
   */
  static clear(model) {
    model.set(ModelTrackerKey, undefined);
  }

  /**
   * Save change tracker attributes
   *
   * @param {DS.Model} model
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
