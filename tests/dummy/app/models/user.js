import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo} from 'ember-data/relationships';

export default Model.extend({
  name: attr('string'),
  style: attr('string'),
  info: attr('object'),
  company: belongsTo('company', { async: false, inverse: 'users', polymorphic: true }),
//  company: belongsTo('company', { async: true, inverse: 'users', polymorphic: true }),
//  projects: hasMany('project', { async: false }),
});
