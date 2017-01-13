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
    return container.lookup(`transform:${key}`);
  },

  _extraAttributeCheckInfo(key)  {
    return (this.constructor.extraAttributeChecks || {})[key];
  },

  /**
   * Serializing the value to be able to tell if the value changed.
   * For attributes, using the transform function that each custom
   * attribute should have.
   * For belongsTo using object with {type, id}
   * For hasMany using array of objects with {type, id}
   *
   * @param {String} key attribute or relationship key
   * @private
   */
  _serializedExtraAttributeValue(key) {
    let info = this._extraAttributeCheckInfo(key);
    switch (info.type) {
      case 'belongsTo':
        let value = this.belongsTo(key).value();
        return { type: value && value.constructor.modelName, id: value && value.id };
      case 'attribute':
        return info.transform.serialize(this.get(key));
    }
  },

  /**
   * Deserialze value
   *
   * @param {String} key
   * @param {String|Object} value
   * @returns {*}
   * @private
   */
  _deserializedExtraAttributeValue(key, value) {
    let info = this._extraAttributeCheckInfo(key);
    switch (info.type) {
      case 'belongsTo':
        return value.id ? this.store.peekRecord(value.type, value.id) : null;
      case 'attribute':
        return info.transform.deserialize(value);
    }
  },

  _lastExtraAttributeValue(key) {
    return this.get(this._saveValueKey(key));
  },

  _saveValueKey(key) {
    let keyName = dasherize(key.replace('.', '-'));
    return `last-${keyName}`;
  },

  _saveExtraAttribute(key) {
    let currentValue = this._serializedExtraAttributeValue(key);
    this.set(this._saveValueKey(key), currentValue);
  },

  _valuesChanged(value1, value2) {
    let valuesBlank = isEmpty(value1) && isEmpty(value2);
    return !(valuesBlank || value1 === value2);
  },

  didAttributeChange(key, changed) {
    changed = changed || this.changedAttributes();
    if (changed[key]) {
      return true;
    }
    if (this.constructor.extraAttributeChecks[key]) {
      let current = this._serializedExtraAttributeValue(key);
      let last = this._lastExtraAttributeValue(key);

      let info = this._extraAttributeCheckInfo(key);
      switch (info.type) {
        case 'belongsTo':
          return !(current.type === last.type && current.id === last.id);
        case 'attribute':
          return this._valuesChanged(current, last);
      }
    }
  },

  changed() {
    let changed = this.changedAttributes();
    let extraAttributeChecks = this.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (!changed[key] && extraAttributeChecks.hasOwnProperty(key)) {
        if (this.didAttributeChange(key, changed)) {
          //          console.log('this.didExtraAttributeChange(key)',key, this.didExtraAttributeChange(key));
          let last = this._deserializedExtraAttributeValue(key, this._lastExtraAttributeValue(key));
          changed[key] = [last, this.get(key)];
        }
      }
    }
    return changed;
  },

  saveChanges() {
    let extraAttributeChecks = this.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (extraAttributeChecks.hasOwnProperty(key)) {
        this._saveExtraAttribute(key);
      }
    }
  },

  _extractExtraAtttibutes() {
    this.constructor.alreadySetupExtraAttributes = true;
    let extraChecks = {};
    this.constructor.eachAttribute((attribute, meta)=> {
      if (!(/string|boolean|date|number/.test(meta.type))) {
        let transform = this._transformFn(meta.type || 'object');
        extraChecks[attribute] = { type: 'attribute', transform };
      }
    });
    this.constructor.eachRelationship(function(key, relationship) {
      if (relationship.kind === 'belongsTo') {
        extraChecks[key] = { type: relationship.kind };
      }
    });
    this.constructor.extraAttributeChecks = extraChecks;
  },

  setupExtraAttributes: Ember.on('ready', function() {
    if (!this.constructor.alreadySetupExtraAttributes) {
      this._extractExtraAtttibutes();
    }
    this.saveChanges();
  }),

  /**
   * Overriding save to reset saved attributes
   *
   * I think this is more efficient than using on.didUpdate:
   *
   *   resetAttributes: Ember.on('didUpdate', function() {
   *     this.saveChanges();
   *   })
   *
   * @returns {*}
   */
  save() {
    return this._super().then(this.saveChanges());
  }
});
