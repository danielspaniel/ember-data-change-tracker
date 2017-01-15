import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("project", {
  sequences: {
    title: function(num) {return 'Project' + num;}
  },

  // default values for 'project' attributes
  default: {
    title: FactoryGuy.generate('title')
  }
});
