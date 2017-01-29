import DS from 'ember-data';
import keepOnlyChanged from 'ember-data-change-tracker/mixins/keep-only-changed';

export default DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin,{
  attrs: {
    pets: { serialize: 'ids' }
  }
});
//export default DS.RESTSerializer.extend(keepOnlyChanged);