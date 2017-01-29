import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define("company", {
  default: {
    type: 'Company',
    name: (f)=>`Company${f.id}`,
  },

  traits: {
    with_projects: {
//      projects: FactoryGuy.hasMany('project', 2)
    }
  }
});
