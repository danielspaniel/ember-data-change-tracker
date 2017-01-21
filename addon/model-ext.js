import Ember from 'ember';
import Model from 'ember-data/model';
import Tracker from './tracker';

Model.reopen({
  /**
   * Did an attribute/association change?
   *
   * @param {String} key the attribute/association name
   * @param {Object} changed optional ember-data changedAttribute object
   * @returns {Boolean} true if value changed
   */
  didChange(key, changed) {
    return Tracker.didChange(this, key, changed);
  },

  /**
   * Did any attribute/associations change?
   *
   * returns object with:
   *  {key: value} = {attribute: [oldValue, newValue]}
   *
   * If the the attribute changed, it will be included in this object
   *
   * @returns {*}
   */
  changed() {
    let changed = Ember.assign({}, this.changedAttributes());
    let extraAttributeChecks = this.constructor.extraAttributeChecks || {};
    for (let key in extraAttributeChecks) {
      if (!changed[key] && extraAttributeChecks.hasOwnProperty(key)) {
        if (this.didChange(key, changed)) {
          let last = Tracker.deserializedlastValue(this, key);
          changed[key] = [last, this.get(key)];
        }
      }
    }
    return changed;
  },

  /**
   * Provide access to tracker's saveChanges method to allow you to
   * call this method manually 
   * 
   * NOTE: This is needed when manually pushing data
   * to the store and using Ember < 2.10
   */
  saveChanges() {
    Tracker.saveChanges(this);
  },

  /**
   * Get value the last known value tracker is saving for this key
   *
   * @param {String} key attribute/association name
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

  saveOnUpdate: Ember.on('didUpdate', function() {
    this.saveChanges();
  }),
  
  // There is no didReload callback on models, so have to override reload
  reload() {
    let promise = this._super();
    promise.then(()=>this.saveChanges());
    return promise;
  },

  clearSavedAttributes: Ember.on('didDelete', function() {
    Tracker.clear(this);
  })
});
