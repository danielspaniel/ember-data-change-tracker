import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
import {array, fragment, fragmentArray} from 'model-fragments/attributes';

export default Model.extend({
  changeTracker: {trackHasMany: true, auto: true, enableIsDirty: true},
  name: attr('string'),
  style: attr('string'),
  // object type
  info: attr('object'),
  blob: attr('json'),
  // fragments
  list: array('number'),
  location: fragment('location'),
  things: fragmentArray('things'),
  // associations
  company: belongsTo('company', { async: true, polymorphic: true }),
  profile: belongsTo('profile', { async: false }),
  projects: hasMany('project', { async: true }),
  pets: hasMany('pet', { async: false, polymorphic: true })
});
