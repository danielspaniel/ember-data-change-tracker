import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  changeTracker: {trackHasMany: false, auto: false, enableIsDirty: false},
    
  name: attr('string'),
  propA: attr('string'),
  propB: attr('string'),
  propC: attr('string'),
  propD: attr('string'),
  propE: attr('string'),
  propF: attr('string'),
  propG: attr('string'),
  propH: attr('string'),
  propI: attr('string'),
  propJ: attr('string'),
  propK: attr('string'),
  propL: attr('string'),
  propM: attr('string'),
  propN: attr('string'),
  propO: attr('string'),
  propP: attr('string'),
  propQ: attr('string'),
  propR: attr('string'),
  propS: attr('string'),
  propT: attr('string'),
  propU: attr('string'),
  propV: attr('string'),
  propW: attr('string'),
  propX: attr('string'),
  propY: attr('string'),
  propZ: attr('string')
});
