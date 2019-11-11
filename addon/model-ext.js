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
   * Did any attribute/association change?
   *
   * returns object with:
   *  {key: value} = {attribute: true}
   *
   * If the the attribute changed, it will be included in this object
   *
   * @returns {*}
   */
  modelChanges() {
    let changed = Ember.assign({}, this.changedAttributes());
    let trackerInfo = Tracker.metaInfo(this);
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
   * Rollback all the changes on this model, for the keys you are
   * tracking.
   *
   * NOTE: Be sure you understand what keys you are tracking.
   * By default, tracker will save all keys, but if you set up
   * a model to 'only' track a limited set of keys, then the rollback
   * will only be limited to those keys
   *
   */
  rollback() {
    const isNew = this.get('isNew');
    this.rollbackAttributes();
    if (isNew) { return; }
    let trackerInfo = Tracker.metaInfo(this);
    let rollbackData = Tracker.rollbackData(this, trackerInfo);
    let normalized = Tracker.normalize(this, rollbackData);
    this.store.push(normalized);
  },

  // alias for saveChanges method
  startTrack() {
    this.saveChanges();
  },

  /**
   * Save the current state of the model
   *
   * NOTE: This is needed when manually pushing data
   * to the store and ussing Ember < 2.10
   *
   * options like => {except: 'company'}
   *
   * @param {Object} options
   */
  saveChanges(options) {
    Tracker.setupTracking(this);
    Tracker.saveChanges(this, options);
    Tracker.triggerIsDirtyReset(this);
  },

  saveTrackerChanges(options) {
    this.saveChanges(options);
  },

  /**
   * Get value of the last known value tracker is saving for this key
   *
   * @param {String} key attribute/association name
   * @returns {*}
   */
  savedTrackerValue(key) {
    return Tracker.lastValue(this, key);
  },

  // save state when model is loaded or created if using auto save
  setupTrackerMetaData() {
    if (Tracker.isIsDirtyEnabled(this)) {
      // this is experimental
      Tracker.initializeDirtiness(this);
    }
    if (Tracker.isAutoSaveEnabled(this)) {
      this.saveChanges();
    }
  },

  // watch for relationships loaded with data via links
  setupUnknownRelationshipLoadObservers() {
    this.eachRelationship((key) => {
      this.addObserver(key, this, 'observeUnknownRelationshipLoaded');
    });
  },

  // when model updates, update the tracked state if using auto save
  saveOnUpdate() {
    if (Tracker.isAutoSaveEnabled(this) || Tracker.isIsDirtyEnabled(this)) {
      this.saveChanges();
    }
  },

  // when model creates, update the tracked state if using auto save
  saveOnCreate() {
    if (Tracker.isAutoSaveEnabled(this) || Tracker.isIsDirtyEnabled(this)) {
      this.saveChanges();
    }
  },

  // There is no didReload callback on models, so have to override reload
  reload() {
    let promise = this._super(...arguments);
    promise.then(() => {
      if (Tracker.isAutoSaveEnabled(this)) {
        this.saveChanges();
      }
    });
    return promise;
  },

  // when model deletes, remove any tracked state
  clearSavedAttributes() {
    Tracker.clear(this);
  },

  observeUnknownRelationshipLoaded(sender, key/*, value, rev*/) {
    if (Tracker.trackingIsSetup(this) && Tracker.isTracking(this, key)) {
      let saved = Tracker.saveLoadedRelationship(this, key);
      if (saved) {
        this.removeObserver(key, this, 'observeUnknownRelationshipLoaded');
      }
    }
  },

  // Ember Data DS.Model events
  // http://api.emberjs.com/ember-data/3.10/classes/DS.Model/events
  //
  // Replaces deprecated Ember.Evented usage:
  // https://github.com/emberjs/rfcs/blob/master/text/0329-deprecated-ember-evented-in-ember-data.md
  // Related: https://github.com/emberjs/rfcs/pull/329

  ready() {
    this._super(...arguments);
    this.setupTrackerMetaData();
    this.setupUnknownRelationshipLoadObservers();
  },

  didCreate() {
    this._super(...arguments);
    this.saveOnCreate();
  },

  didUpdate() {
    this._super(...arguments);
    this.saveOnUpdate();
  },

  didDelete() {
    this._super(...arguments);
    this.clearSavedAttributes();
  },
});
