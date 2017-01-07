import {make, manualSetup}  from 'ember-data-factory-guy';
import {initializer} from 'ember-data-change-tracking';
import {test, moduleForModel} from 'ember-qunit';

moduleForModel('user', 'Unit | Model | user', {
  integration: true,

  setup: function() {
    manualSetup(this.container);
    initializer();
  }
});

test('has projects', function(assert) {
  let user = make('user', 'withCompany');
  console.log(user.saveObjectValueKey);
  console.log(user.get('company')+'');
  assert.ok(!!user.get('company'));
});