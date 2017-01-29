import attr from 'ember-data/attr';
import Fragment from 'model-fragments/fragment';

export default Fragment.extend({
  place : attr('string'),
  number  : attr('number')
});
