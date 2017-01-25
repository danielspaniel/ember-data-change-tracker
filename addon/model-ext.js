import Ember from 'ember';
import Model from 'ember-data/model';
import Tracker from './tracker';

import ManyArray from "ember-data/-private/system/many-array";

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
          // this.printHasManyChangedSet(key, changed[key]);
        }
      }
    }
    // this.printHasManyChangedSet('RETURNING CHANGED', changed['projects']);
    return changed;
  },

  printHasManyChangedSet(key, changeSet) {
    console.log('***********', key, '**********');
    if (!changeSet) {
      console.log('no change set');
      return;
    }
    let last = changeSet[0];
    let current = changeSet[1];
    if (last) {
      console.log('last:', last.map((e)=>e.id).join(','));
    }
    if (current) {
      console.log('current:', current.toArray().mapBy('id').join(','));
    }
    console.log('******************************');
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
  }),

  /**
   * Rollback the changes that ember-data-change-tracker has been keeping track of
   */

   rollbackTrackedChanges() {
     let changed = this.changed();
     Object.keys(changed).forEach((key)=>this._rollbackChange(key, changed[key]));
   },

   /**
    * Rollback the changes for a specific key
    */
   _rollbackChange(key, changeSet) {
    //  this.set(key, changeSet[0]);
    //
    // OR
    //
    let info = Tracker.modelInfo(this, key);
     switch (info.type) {
       // TODO: -mf-array
       //      case '-mf-array':
       case 'attribute':
         console.log('rolling back attribute', key, changeSet);
         this.set(key, changeSet[0]);
         break;
       case 'belongsTo':
         console.log('rolling back belongsTo', key, changeSet);
         this.set(key, changeSet[0]);
         break;
       case 'hasMany':
         let lastArray = changeSet[0];
         let oldManyArray = this.getManyArray(key, lastArray);
         console.log('rolling back hasMany', key, lastArray, oldManyArray);
         this.set(key, oldManyArray);
     }
   },

   getManyArray(key, array) {
     let rel = this.hasMany(key).hasManyRelationship;
    //  return ManyArray.create({content: array});
     return ManyArray.create({
       canonicalState: array,
       store: rel.store,
       relationship: rel,
       type: rel.store.modelFor(rel.belongsToType),
       record: rel.record,
       meta: rel.meta,
       isPolymorphic: rel.isPolymorphic
     });
   }
});
