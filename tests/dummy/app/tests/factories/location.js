import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("location", {
  default: {
    place: (f)=>`Place${f.id}`,
    number: (f)=> f.id *10
  }
});
