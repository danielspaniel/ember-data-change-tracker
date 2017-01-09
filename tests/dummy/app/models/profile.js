import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {belongsTo} from 'ember-data/relationships';

export default Model.extend({
  created_at: attr('date'),
  description: attr('string'),
  user: belongsTo('user', { async: true }),
});
