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
  let user = this.subject();
  assert.ok(user.constructor.alreadySetupExtraAttributes);
});

test('extractExtraAtttibutes sets correct extraAttributeChecks on constructor', function(assert) {
  let user = make('user');
  let extraChecks = user.constructor.extraAttributeChecks;

  assert.deepEqual(Object.keys(extraChecks), ['info', 'company', 'profile']);

  assert.equal(extraChecks.info.type, 'attribute');
  assert.equal(typeof extraChecks.info.transform.serialize, 'function');
  assert.equal(typeof extraChecks.info.transform.deserialize, 'function');

  assert.deepEqual(extraChecks.company, { type: 'belongsTo' });
});

test('_serializedExtraAttributeValue for object attribute', function(assert) {
  let user = make('user');
  let company = make('small-company');

  let tests = [
    ['info', null, "{}"],
    ['info', { dude: 1 }, '{"dude":1}'],
    ['company', null, {id: null, type: null}],
    ['company', company, {id: company.id, type: company.constructor.modelName}],
  ];

  let setUser = (attr, value)=> {
    Ember.run(()=>user.set(attr, value));
  };

  for (let test of tests) {
    let [key, value, expected] = test;
    setUser(key, value);
    let serializedValue = user._serializedExtraAttributeValue(key);
    assert.deepEqual(serializedValue, expected);
  }
});

test('changing object attributes instance values', function(assert) {
  let info = { dude: 1 };
  let user = make('user', { info });
  info.dude = 3;

  let changed = (user.changed().info);

  assert.deepEqual(changed[0], { dude: 3 }, 'shows current value at index 0 of changed array');
  assert.deepEqual(changed[1], { dude: 1 }, 'shows last value at index 1 of changed array');
});

test('changing object attribute entirely', function(assert) {
  let info = { dude: 1 };
  let info2 = { dude: 3 };
  let user = make('user', { info });
  Ember.run(()=>user.set('info', info2));

  let changed = user.changed().info;

  assert.deepEqual(changed[0], info2);
  assert.deepEqual(changed[1], info);
});

test('belongsTo async:false replacing model', function(assert) {
  let company = make('company');
  let company2 = make('company');

  let tests = [
    [null, company, [company, null]],
    [company, company2, [company2, company]],
    [company, null, [null, company]],
    [company, company, undefined],
  ];

  let setUser = (user, nextCompany)=> {
    Ember.run(()=>user.set('company', nextCompany));
  };

  for (let test of tests) {
    let [firstCompany, nextCompany, expectedChanged] = test;
    let user = make('user', { company: firstCompany });
    setUser(user, nextCompany);
    let changed = user.changed().company;
    if (expectedChanged) {
      assert.deepEqual(changed[0], expectedChanged[0]);
      assert.deepEqual(changed[1], expectedChanged[1]);
    } else {
      assert.ok(!changed);
    }
  }
});

test('belongsTo async:false replacing (polymorphic) model', function(assert) {
  let company = make('small-company');
  let company2 = make('big-company');

  let tests = [
    [null, company, [company, null]],
    [company, company2, [company2, company]],
    [company, null, [null, company]],
    [company, company, undefined],
  ];

  let setUser = (user, nextCompany)=> {
    Ember.run(()=>user.set('company', nextCompany));
  };

  for (let test of tests) {
    let [firstCompany, nextCompany, expectedChanged] = test;
    let user = make('user', { company: firstCompany });
    setUser(user, nextCompany);

    let changed = user.changed().company;
    if (expectedChanged) {
      assert.deepEqual(changed[0], expectedChanged[0]);
      assert.deepEqual(changed[1], expectedChanged[1]);
    } else {
      assert.ok(!changed);
    }
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
  let profile1 = build('profile');
  let profile2 = make('profile');
  mockFindRecord('profile').returns({ json: profile1 });

  let user = make('user', { profile: profile1.get('id') });

  Ember.run(()=> {
    user.get('profile').then(()=> {
      user.set('profile', profile2);
      assert.ok(user.changed().profile);
      done();
      mockTeardown();
    });
  });
});
