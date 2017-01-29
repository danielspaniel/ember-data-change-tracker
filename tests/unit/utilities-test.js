import {valuesChanged, hasManyChanged} from 'ember-data-change-tracker/utilities';
import {test, module} from 'ember-qunit';

module('Unit | Utilities');

test('#valuesChanged', function(assert) {

  let tests = [
    [null, null, false, false, 'two nulls'],
    [null, 1, false, true, 'null and 0'],
    [1, 10, false, true, 'different numbers'],
    [null, 1, false, true, 'null and 1'],
    [null, { id: 1, type: 'user' }, true, true, 'null and object'],
    [{ id: 1, type: 'user' }, null, true, true, 'object and null'],
    [{ id: 1, type: 'user' }, { id: 2, type: 'user' }, true, true, 'different model objects'],
  ];

  for (let test of tests) {
    let [value1, value2, polymorphic, expected, message] = test;
    let result = valuesChanged(value1, value2, polymorphic);
    assert.equal(result, expected, message);
  }
});

test('#hasManyChanged', function(assert) {

  let tests = [
    [null, [], false, false, 'null and []'],
    [null, [0], false, true, 'null and [0]'],
    [[1], [10], false, true, 'different numbers'],
    [null, [1], false, true, 'null and [1]'],
    [null, [{ id: 1, type: 'user' }], true, true, 'null and [object]'],
    [[{ id: 1, type: 'user' }], null, true, true, '[object] and null'],
    [[{ id: 1, type: 'user' }], [{ id: 2, type: 'user' }], true, true, 'different model objects'],
  ];

  for (let test of tests) {
    let [value1, value2, polymorphic, expected, message] = test;
    let result = hasManyChanged(value1, value2, polymorphic);
    assert.equal(result, expected, message);
  }
});
