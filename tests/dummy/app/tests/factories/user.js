import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define('user', {

  default: {
    style: 'normal',
    name: (f)=>`User${f.id}`,
    info: (f)=> { return {foo: f.id}; }
  },

  traits: {
    silly: {
      style: 'silly'
    },
    withCompany: {
      company: {}
    },
    withProfile: {
      profile: {}
    },
    withProjects: {
//      projects: FactoryGuy.hasMany('project', 2)
    }
  }
});

