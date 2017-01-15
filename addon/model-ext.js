import Ember from 'ember';
import Model from 'ember-data/model';
import Tracker from './tracker';

Model.reopen({
  /**
   * Did an attribute change?
   *
   * @param {String} key the attribute name
   * @param {Object} changed optional ember-data changedAttribute object
   * @returns {Boolean} true if value changed
   */
  didAttributeChange(key, changed) {
    changed = changed || this.changedAttributes();
    if (changed[key]) {
      return true;
    }
    let info = Tracker.modelInfo(this, key);
    if (info) {
      let current = Tracker.serialize(this, key);
      let last = Tracker.lastValue(this, key);
      switch (info.type) {
        case 'belongsTo':
          return !(current.type === last.type && current.id === last.id);
        case 'attribute':
          return Tracker.valuesChanged(current, last);
      }
    }
  },

  /**
   * Did any attributes change?
   *
   * returns object with:
   *  {key: value} = {attribute: [oldValue, newValue]}
   *
   * If the the attribute changed, it will be included in this object
   *
   * @returns {*}
   */
  changed() {
    let changed = Ember.assign({},this.changedAttributes());
    let extraAttributeChecks = this.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (!changed[key] && extraAttributeChecks.hasOwnProperty(key)) {
        if (this.didAttributeChange(key, changed)) {
          let last = Tracker.deserializedlastValue(this, key);
          changed[key] = [last, this.get(key)];
        }
      }
    }
    return changed;
  },

  /**
   * Provide access to tracker's save changes to model can
   * call this method manually => needed when manually pushing data
   * to the store and using Ember < 2.10
   */
  saveChanges() {
    Tracker.saveChanges(this);
  },

  /**
   * Get value the last known value tracker is saving for this attribute
   *
   * @param {String} key attribute name
   * @returns {*}
   */
  savedTrackerValue(key) {
    return Tracker.lastValue(this, key);
  },
  
  setupExtraAttributes: Ember.on('ready', function() {
    if (!this.constructor.alreadySetupExtraAttributes) {
      Tracker.extractAtttibutes(this);
    }
    this.saveChanges();
  }),

  resetAttributes: Ember.on('didUpdate', function() {
    this.saveChanges();
  }),

  clearSavedAttributes: Ember.on('didDelete', function() {
    Tracker.clear(this);
  })
});
