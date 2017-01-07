import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define('user', {
  sequences: {
    name: function(num) {return 'User' + num;}
  },
  // default values for 'user' attributes
  default: {
    style: 'normal',
    name: FactoryGuy.generate('name')
  },

  traits: {
    silly: {
      style: 'silly'
    },
    withCompany: {
      company: {}
    },
    withProjects: {
//      projects: FactoryGuy.hasMany('project', 2)
    }
  }
});

