import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {hasMany} from 'ember-data/relationships';

export default Model.extend({
  type: attr('string'),
  name: attr('string'),
  blob: attr(),

  users: hasMany('user', { async: true, inverse: 'company' }),
});
