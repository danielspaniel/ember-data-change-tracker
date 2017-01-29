import Ember from 'ember';

// EmberData does not serialize hasMany relationships by default
export default Ember.Mixin.create({
  keepValue(record, key) {
    return record.get('isNew') || record.didChange(key, null, {deeplyNested: false});
  },

  serializeAttribute: function(snapshot, json, key) {
    if (this.keepValue(snapshot.record, key)) {
      return this._super(...arguments);
    }
  },

  serializeBelongsTo: function(snapshot, json, relationship) {
    if (this.keepValue(snapshot.record, relationship.key)) {
      return this._super(...arguments);
    }
  }
});