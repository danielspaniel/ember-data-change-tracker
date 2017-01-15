import Ember from 'ember';

export default Ember.Mixin.create({
  keepValue(record, key) {
    return record.get('isNew') || record.didAttributeChange(key);
  },

  serializeBelongsTo: function(snapshot, json, relationship) {
    if (this.keepValue(snapshot.record, relationship.key)) {
      return this._super(...arguments);
    }
  },

  _shouldSerializeHasMany: function() {
    //TODO:
    // look at 'trackHasMany' option? or should it have its own?
    return true;
  },

  //TODO:
  // not needed?
  // serializeHasMany: function(snapshot, json, relationship) {
  //   if (this.keepValue(snapshot.record, relationship.key)) {
  //     return this._super(...arguments);
  //   }
  // },

  serializeAttribute: function(snapshot, json, key) {
    if (this.keepValue(snapshot.record, key)) {
      return this._super(...arguments);
    }
  }
});
