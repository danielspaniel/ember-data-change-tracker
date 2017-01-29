import FactoryGuy from 'ember-data-factory-guy';
import './company';

FactoryGuy.define("big-company", {
  extends: 'company',

  default: {
    type: 'BigCompany',
    name: 'Big Corp'
  }
});
