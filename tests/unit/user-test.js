import Ember from 'ember';
import {build, make, mockUpdate, mockFindRecord, manualSetup, mockSetup, mockTeardown}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleForModel} from 'ember-qunit';

modelInitializer();

moduleForModel('user', 'Unit | Model | user', {
  integration: true,

  beforeEach: function() {
    manualSetup(this.container);
  }
});

test('sets alreadySetupExtraAttributes to true after extracting extraAttributes', function(assert) {
  let user = make('user');
  assert.ok(user.constructor.alreadySetupExtraAttributes);
});

test('extractExtraAtttibutes sets correct extraAttributeChecks on constructor', function(assert) {
  let user = make('user');
  let extraChecks = user.constructor.extraAttributeChecks;
  assert.deepEqual(Object.keys(extraChecks), ['info', 'company', 'profile']);
  assert.equal(extraChecks.info.type, 'attribute');
  assert.equal(typeof extraChecks.info.transform.serialize, 'function');
  assert.equal(typeof extraChecks.info.transform.deserialize, 'function');
  assert.deepEqual(extraChecks.company, { type: 'belongsTo', modelName: 'company' });
});

//test('_serializedtExtraAttibuteValue for object attribute', function(assert) {
//  let info = { dude: 1 };
//  let user = make('user', { info });
//  info.dude = 2;
//  let currentValue = user._serializedExtraAttributeValue(user.get('info'));
//  assert.equal(currentValue, '{"dude":2}');
//});

test('changing object attributes instance values', function(assert) {
  let info = { dude: 1 };
  let user = make('user', { info });
  info.dude = 3;
  assert.ok(user.changed().info);
  //  assert.deepEqual(changedInfo[0], { dude: 3 }, 'shows current value at index 0 of changed array');
  //  assert.deepEqual(changedInfo[1], { dude: 1 }, 'shows last value at index 1 of changed array');
});

test('changing object attribute entirely', function(assert) {
  let info = { dude: 1 };
  let info2 = { dude: 3 };
  let user = make('user', { info });
  Ember.run(()=>user.set('info', info2));
  //  let changedInfo = user.changed().info;
  assert.ok(user.changed().info);
  //  assert.deepEqual(changedInfo[0], info2);
  //  assert.deepEqual(changedInfo[1], info);
});

test('belongsTo async:false replacing model', function(assert) {
  let company = make('company');
  let company2 = make('company');


  let tests = [
    [null, company, true],
    [company, company2, true],
    [company, null, true],
    [company, company, undefined],
  ];

  for (let test of tests) {
    let [firstCompany, nextCompany, expectedChanged] = test;
    let user = make('user', { company: firstCompany });
    Ember.run(()=>user.set('company', nextCompany));
    assert.equal(user.changed().company, expectedChanged);
  }
});

test('save resets changed', function(assert) {
  const done = assert.async();
  mockSetup();
  Ember.run(()=> {
    let company = make('company');
    let info = { dude: 1 };
    let user = make('user', { company, info });

    // change relationship and attribute
    user.set('company', null);
    info.dude = 2;

    mockUpdate(user);
    user.save().then(()=> {
      assert.ok(!user.changed().info, 'clears changed info after save');
      assert.ok(!user.changed().company, 'clears changed company after save');
      done();
      mockTeardown();
    });
  });
});

test('belongsTo async:true replacing model', function(assert) {
  let done = assert.async();
  mockSetup({ logLevel: 1 });
  let user = make('user', 'withProfile');
  mockFindRecord('profile').returns({ json: build('profile') });

  Ember.run(()=> {
    user.belongsTo('profile').reload().then((profile)=> {
      console.log('profile', profile);
      console.log(user.belongsTo('profile').value());
      assert.ok(user.changed().profile);
      done();
      mockTeardown();
    });
  });


  //  const done = assert.async();
  //  let user = make('user');
  //  mockSetup({logLevel:1});
  //  mockFindRecord('profile').returns({model: make('profile')});
  //
  //  user.get('profile').then((profile)=> {
  //    console.log('profile', profile);
  //    console.log(user.get('profile')+'',user.belongsTo('profile').id());
  //    console.log(user.belongsTo('profile').value());
  //    assert.ok(user.changed().profile);
  //    done();
  //    mockTeardown();
  //  });
});
