import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("small-company", {
  extends: 'company',
  default: {
    type: 'SmallCompany',
    name: (f)=>`Small Corp${f.id}`,
    blob: (f)=> { return {num: f.id}; }
  }
});
