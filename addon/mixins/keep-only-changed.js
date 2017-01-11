import Ember from 'ember';

export default Ember.Mixin.create({
//  serializeBelongsTo: function(snapshot, json, relationship) {
//    let key = relationship.key;
//    if (snapshot.record.didExtraAttributeChange(key) || snapshot.record.get('isNew')) {
//      return this._super(snapshot, json, relationship);
//    }
//  },

  serializeAttribute: function(snapshot, json, key, attributes) {
    console.log('sa changed',key, snapshot.record.changed()[key]);
    if (snapshot.record.changed()[key] || snapshot.record.get('isNew')) {
      return this._super(snapshot, json, key, attributes);
    }
  }
});