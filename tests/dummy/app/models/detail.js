import Model from 'ember-data/model';
import attr from 'ember-data/attr';
//import { belongsTo } from 'ember-data/relationships';

export default Model.extend({
  name: attr('string'),
  // TODO: figure out why this declaration prevents the project serializer from
  // serializing details.
  //    project: belongsTo('project')
});
