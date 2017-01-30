import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default Model.extend({
  changeTracker: {trackHasMany: true, auto: true},
  title: attr('string'),
  blob: attr(),
  company: belongsTo('company', { async: false })
});
