import Ember from 'ember';
import Model from 'ember-data/model';
const { isEmpty } = Ember;
const { dasherize } = Ember.String;

Model.reopen({

  /**
   * An custom attribute should have a transform function associated with it.
   * If not, use object transform
   *
   * @param key
   * @returns {*}
   * @private
   */
  _transformFn(key) {
    let container = Ember.getOwner ? Ember.getOwner(this.store) : this.store.container;
    return container.lookup('transform:' + key);
  },

  /**
   * Serializing the value to be able to tell if the value changed.
   * For attributes, using the transform function that each custom
   * attribute should have.
   * For belongsTo using object with {type, id}
   * For hasMany using array of objects with {type, id}
   *
   * @param key attribute or relationship key
   * @param info extra attribute or relationship information
   * @private
   */
  _serializedExtraAttributeValue(key, info) {
    let value;
    if (info.type === 'belongsTo') {
      value = this.belongsTo(key).value();
      return { type: value && value.constructor.modelName, id: value && value.id };
//      return { type: info.modelName, id: this.belongsTo(key).id() };
    }
    value = this.get(key);
    return info.transform.serialize(value);
  },

  _deserializedExtraAttributeValue(value, info) {
    if (info.type === 'belongsTo') {
      return value;
    }
    return info.transform.deserialize(value);
  },

  _lastExtraAttributeValue(key) {
    return this.get(this._saveValueKey(key));
  },

  _saveValueKey(key) {
    let keyName = dasherize(key.replace('.', '-'));
    return `last-${keyName}`;
  },

  saveExtraAttribute(key, info) {
    //    console.log('saveExtraAttribute', 'modelName:',this.constructor.modelName, 'key:',key, this._saveValueKey(key), this._serializedExtraAttributeValue(this.get(key), info));
    this.set(
      this._saveValueKey(key),
      this._serializedExtraAttributeValue(key, info)
    );
  },

  valuesEqual(value1, value2) {
    return (value1 && value1.toString()) === (value2 && value2.toString());
  },

  valuesChanged(value1, value2) {
    let valuesBlank = isEmpty(value1) && isEmpty(value2);
    return !(valuesBlank || this.valuesEqual(value1, value2));
  },

  didAttributeChange(key, info) {
//    console.log('didAttributeChange', key, 'info', info, "this._serializedExtraAttributeValue(key, info)", this._serializedExtraAttributeValue(key, info), "_lastExtraAttributeValue(key)", this._lastExtraAttributeValue(key));
    let current = this._serializedExtraAttributeValue(key, info);
    let last = this._lastExtraAttributeValue(key)

    if (info.type === 'belongsTo') {
      console.log('current', current, 'last', last);
      return !(current.type === last.type && current.id === last.id);
    }
    return this.valuesChanged(current, last);
  },

  changed() {
    let changed = this.changedAttributes();
    let extraAttributeChecks = this.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (extraAttributeChecks.hasOwnProperty(key)) {
        if (this.didAttributeChange(key, extraAttributeChecks[key])) {
          changed[key] = true;
          //          let last = this._deserializedExtraAttributeValue(this._lastExtraAttributeValue(key), extraAttributeChecks[key]);
          //          changed[key] = [this.get(key), last];
        }
      }
    }
    return changed;
  },

  saveChanges() {
    //    console.log('=> saveChanges', this.constructor.modelName);
    let extraAttributeChecks = this.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (extraAttributeChecks.hasOwnProperty(key)) {
        this.saveExtraAttribute(key, extraAttributeChecks[key]);
      }
    }
  },

  extractExtraAtttibutes() {
    //    console.log('extractExtraAtttibutes', this.constructor.modelName);
    this.constructor.alreadySetupExtraAttributes = true;
    let extraChecks = {};
    this.constructor.eachAttribute((attribute, meta)=> {
      //      console.log('attribute:',attribute, 'meta:',meta);
      if (!(/string|boolean|date|number/.test(meta.type))) {
        extraChecks[attribute] = { type: 'attribute', transform: this._transformFn(meta.type) };
      }
    });
    this.constructor.eachRelationship(function(key, relationship) {
      if (relationship.kind === 'belongsTo') {
        extraChecks[key] = { type: relationship.kind, modelName: relationship.type };
      }
    });
    console.log('extraChecks', this.constructor.modelName, extraChecks);
    this.constructor.extraAttributeChecks = extraChecks;
  },

  setupExtraAttributes: Ember.on('ready', function() {
    //    console.log('Top/ setupExtraAttributes', this.constructor.alreadySetupExtraAttributes, this.constructor.modelName+'');
    if (!this.constructor.alreadySetupExtraAttributes) {
      this.extractExtraAtttibutes();
      //      console.log('Done/ setupExtraAttributes', this.constructor.modelName);
    }
    this.saveChanges();
  }),

  //  saveIntialerChanges: Ember.on('didLoad', function() {
  //    console.log('didLoad');
  //  }),

  //  resetAttributes: Ember.on('didUpdate', function() {
  //    this.saveChanges();
  //  })

  // I think this is more efficient than the on.didUpdate
  save() {
    return this._super().then(this.saveChanges());
  }
});
