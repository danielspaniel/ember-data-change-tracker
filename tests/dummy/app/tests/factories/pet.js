import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("pet", {
  sequences: {
    name: function(num) {return 'Fido' + num;}
  },

  // default values for 'pet' attributes
  default: {
    name: FactoryGuy.generate('name')
  }
});
