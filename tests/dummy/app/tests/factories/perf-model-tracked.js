import FactoryGuy from 'ember-data-factory-guy';

const randomString = () => Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 15);

export const defaultTraits = {
  style: 'normal',
  name: (f)=>`User${f.id}`,
  propA: randomString,
  propB: randomString,
  propC: randomString,
  propD: randomString,
  propE: randomString,
  propF: randomString,
  propG: randomString,
  propH: randomString,
  propI: randomString,
  propJ: randomString,
  propK: randomString,
  propL: randomString,
  propM: randomString,
  propN: randomString,
  propO: randomString,
  propP: randomString,
  propQ: randomString,
  propR: randomString,
  propS: randomString,
  propT: randomString,
  propU: randomString,
  propV: randomString,
  propW: randomString,
  propX: randomString,
  propY: randomString,
  propZ: randomString
}

FactoryGuy.define('perf-model-tracked', {
  default: defaultTraits,
});

