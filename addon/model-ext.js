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
  didChange(key, changed, options) {
    return Tracker.didChange(this, key, changed, options);
  },

  /**
   * Did any attribute/associations change?
   *
   * returns object with:
   *  {key: value} = {attribute: true}
   *
   * If the the attribute changed, it will be included in this object
   *
   * @returns {*}
   */
  changed() {
    let changed = Object.assign({}, this.changedAttributes());
    let trackerInfo = Tracker.modelInfo(this);
    for (let key in trackerInfo) {
      if (!changed[key] && trackerInfo.hasOwnProperty(key)) {
        if (this.didChange(key, changed)) {
          changed[key] = true;
        }
      }
    }
    return changed;
  },

  /**
   * Rollback the changes that ember-data-change-tracker has been keeping track of
   *
   * @param {String} [key] attribute/association name to rollback
   */
  rollback(key = null) {
    let trackerInfo = Tracker.modelInfo(this, key);
    this.rollbackAttributes();
    let props = { id: this.id };
    Object.keys(trackerInfo).forEach((key) => {
      if (this.didChange(key, null, trackerInfo)) {
        props[key] = Tracker.lastValue(this, key);
      }
    });
    let data = this.store.normalize(this.constructor.modelName, props);
    this.store.push(data);
  },

  startTrack() {
    this.saveChanges();
  },

  /**
   * Provide access to tracker's saveChanges method to allow you to
   * call this method manually
   *
   * NOTE: This is needed when manually pushing data
   * to the store and using Ember < 2.10
   */
  saveChanges() {
    if (!Tracker.trackingIsSetup(this)) {
      Tracker.setupTracking(this);
    }
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
    if (Tracker.autoSave(this)) {
      Tracker.setupTracking(this);
      this.saveChanges();
    }
  }),

  saveOnUpdate: Ember.on('didUpdate', function() {
    if (Tracker.autoSave(this)) {
      this.saveChanges();
    }
  }),

  // There is no didReload callback on models, so have to override reload
  reload() {
    let promise = this._super();
    promise.then(() => {
      if (Tracker.autoSave(this)) {
        this.saveChanges();
      }
    });
    return promise;
  },

  clearSavedAttributes: Ember.on('didDelete', function() {
    Tracker.clear(this);
  })

});