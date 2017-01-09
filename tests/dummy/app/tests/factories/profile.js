import FactoryGuy from 'ember-data-factory-guy';

FactoryGuy.define('profile', {
  default: {
    description: (f)=> `Text for profile #${f.id}`
  },
  
  traits: {
    goofy_description: {
      description: 'goofy'
    }
  }
});
