import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("dog", {
  default: {
    name: (f)=> `Dog${f.id}`
  }
});
