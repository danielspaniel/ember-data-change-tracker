import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {hasMany} from 'ember-data/relationships';

export default Model.extend({
  type: attr('string', { defaultValue: 'Company' }),
  name: attr('string'),
  info: attr('object'),
//  profile: belongsTo('profile', { async: false }),
  users: hasMany('user', { async: true, inverse: 'company' }),
//  projects: hasMany('project', { async: true })
});
