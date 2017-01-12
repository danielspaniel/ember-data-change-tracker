import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo} from 'ember-data/relationships';

export default Model.extend({
  name: attr('string'),
  style: attr('string'),
  info: attr('object'),
  json: attr(),
  company: belongsTo('company', { async: false, polymorphic: true }),
  profile: belongsTo('profile', { async: true }),
//  projects: hasMany('project', { async: false }),
});
