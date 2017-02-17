import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define('user', {

  default: {
    style: 'normal',
    name: (f)=>`User${f.id}`,
    info: (f)=> { return {foo: f.id}; }
  },

  traits: {
    empty: {
      style: null,
      name: null,
      info: null,
      blob: null,
      list: null,
      location: null,
      things: null,
      projects: undefined,
      pets: undefined
    },
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

