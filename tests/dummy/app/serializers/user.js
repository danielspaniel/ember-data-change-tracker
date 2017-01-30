import DS from 'ember-data';

export default DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
  // for testing need to serialize with hasMany ids so I can check if the
  // records are rolled back correctly
  attrs: {
    projects: { serialize: 'ids' },
    pets: { serialize: 'ids' }
  }
});
