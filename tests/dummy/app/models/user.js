import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
  changeTracker: {trackHasMany: true, auto: true},
  name: attr('string'),
  style: attr('string'),
  info: attr('object'),
  company: belongsTo('company', { async: true, polymorphic: true }),
  profile: belongsTo('profile', { async: false }),
  projects: hasMany('project', { async: true }),
  pets: hasMany('pet', { async: false, polymorphic: true })
});
