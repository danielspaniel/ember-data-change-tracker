import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("detail", {
  default: {
    name: (f)=> `Detail${f.id}`
  }
});
