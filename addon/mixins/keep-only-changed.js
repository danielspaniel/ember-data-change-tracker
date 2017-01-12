import Ember from 'ember';

export default Ember.Mixin.create({
  keepValue(record, key) {
    return record.didAttributeChange(key) || record.get('isNew');
  },

  serializeBelongsTo: function(snapshot, json, relationship) {
    if (this.keepValue(snapshot.record, relationship.key)) {
      return this._super(...arguments);
    }
  },

  serializeAttribute: function(snapshot, json, key) {
    if (this.keepValue(snapshot.record, key)) {
      return this._super(...arguments);
    }
  }
});