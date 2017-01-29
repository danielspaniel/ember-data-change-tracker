import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {hasMany} from 'ember-data/relationships';
import {array, fragment, fragmentArray} from 'model-fragments/attributes';

export default Model.extend({
  type: attr('string'),
  name: attr('string'),
//  blob: attr(),
  list: array('number'),
  location: fragment('location'),
  things: fragmentArray('things'),

  users: hasMany('user', { async: true, inverse: 'company' }),
//  projects: hasMany('project', { async: true })
});
