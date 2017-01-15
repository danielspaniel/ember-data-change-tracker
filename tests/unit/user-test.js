import Ember from 'ember';
import FactoryGuy, {
  build, make, mockUpdate, mockFindRecord,
  mockDelete, manualSetup, mockSetup, mockTeardown
}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleForModel} from 'ember-qunit';
import {ModelTrackerKey} from 'ember-data-change-tracker/tracker';

modelInitializer();

moduleForModel('user', 'Unit | Model | user', {
  integration: true,

  beforeEach: function() {
    manualSetup(this.container);
  }
});

let setUser = (user, attr, value)=> {
  Ember.run(()=>user.set(attr, value));
};

test('sets alreadySetupExtraAttributes to true after extracting extraAttributes', function(assert) {
  let user = this.subject();
  assert.ok(user.constructor.alreadySetupExtraAttributes);
});

test('#extractExtraAtttibutes sets correct extraAttributeChecks on constructor', function(assert) {
  let user = make('user');
  let extraChecks = user.constructor.extraAttributeChecks;

  assert.deepEqual(Object.keys(extraChecks), 'info json company profile'.split(' '));

  assert.equal(extraChecks.info.type, 'attribute');
  assert.equal(typeof extraChecks.info.transform.serialize, 'function');
  assert.equal(typeof extraChecks.info.transform.deserialize, 'function');

  assert.equal(extraChecks.json.type, 'attribute');
  assert.equal(typeof extraChecks.json.transform.serialize, 'function');
  assert.equal(typeof extraChecks.json.transform.deserialize, 'function');

  assert.deepEqual(extraChecks.company, { type: 'belongsTo' });
});

test('#saveChanges saves belongsTo assocations when model is ready on ajax load', function(assert) {
  let done = assert.async();

  mockSetup({ logLevel: 1 });
  let company = make('company');
  let profile = make('profile');
  let user = build('user', { profile: profile.get('id'), company: { id: company.get('id'), type: 'company' } });
  mockFindRecord('user').returns({ json: user });

  Ember.run(()=> {
    FactoryGuy.store.find('user', user.get('id')).then((user)=> {
      assert.deepEqual(user.savedTrackerValue('company'), { id: company.get('id'), type: 'company' });
      assert.deepEqual(user.savedTrackerValue('profile'), { id: profile.get('id'), type: 'profile' });
      done();
      mockTeardown();
    });
  });
});

test('#saveChanges saves attributes/assocations assocations when model info is pushed to store', function(assert) {
  let company = make('company');
  let profile = make('profile');
  let info = { dude: 1 };
  let userJson = build('user', { info, profile: profile.get('id'), company: { id: company.get('id'), type: 'company' } });

  let normalized = FactoryGuy.store.normalize('user', userJson.get());

  Ember.run(()=> {
    let user = FactoryGuy.store.push(normalized);
    assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
    assert.deepEqual(user.savedTrackerValue('company'), { id: company.get('id'), type: 'company' });
    assert.deepEqual(user.savedTrackerValue('profile'), { id: profile.get('id'), type: 'profile' });
  });
});

test('#saveChanges saves attributes/assocations when model newly created', function(assert) {
  let company = make('company');
  let profile = make('profile');
  let info = { dude: 1 };
  let user;
  Ember.run(()=> {
    user = FactoryGuy.store.createRecord('user', { info, profile, company });
  });
  assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
  assert.deepEqual(user.savedTrackerValue('company'), { id: company.get('id'), type: 'company' });
  assert.deepEqual(user.savedTrackerValue('profile'), { id: profile.get('id'), type: 'profile' });

});

test('#didAttributeChange', function(assert) {
  let company = make('small-company');
  let info = { dude: 1 };

  let tests = [
    ['info', undefined, null, true],
    ['info', undefined, info, true],
    ['company', null, null, false],
    ['company', null, company, true],
  ];

  for (let test of tests) {
    let [key, firstValue, nextValue, expected] = test;
    let user = make('user', { [key]: firstValue });
    setUser(user, key, nextValue);
    assert.equal(user.didAttributeChange(key), expected);
  }
});

test('#save method resets changed', function(assert) {
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

test('modify attribute of type "object"', function(assert) {
  let info = { dude: 1 };
  let user = make('user', { info });
  info.dude = 3;

  let changed = (user.changed().info);

  assert.deepEqual(changed[0], { dude: 1 }, 'shows last value at index 0 of changed array');
  assert.deepEqual(changed[1], { dude: 3 }, 'shows current value at index 1 of changed array');
});

test('replace attribute of type "object"', function(assert) {
  let info = { dude: 1 };
  let info2 = { dude: 3 };

  let tests = [
    [undefined, null, [undefined, null]],
    [undefined, info, [undefined, info]],
    [null, info, [null, info]],
    [info, null, [info, null]],
    [info, info, undefined],
    [info, info2, [info, info2]],
  ];

  for (let test of tests) {
    let [firstValue, nextValue, expectedChanged] = test;
    let user = make('user', { info: firstValue });
    setUser(user, 'info', nextValue);
    let changed = user.changed().info;
    assert.deepEqual(changed, expectedChanged);
  }
});

test('replace attribute of type undefined', function(assert) {
  let user = make('user', { json: { foo: 1 } });
  Ember.run(()=>user.set('json', { foo: 2 }));

  let changed = user.changed().json;
  assert.deepEqual(changed, [{ foo: 1 }, { foo: 2 }]);
});

test('modify attribute of type undefined', function(assert) {
  let json = { foo: 1 };
  let user = make('user', { json });
  json.foo = 2;

  let changed = user.changed().json;
  assert.deepEqual(changed, [{ foo: 1 }, { foo: 2 }]);
});

test('replace belongsTo async:false', function(assert) {
  let company = make('company');
  let company2 = make('company');

  let tests = [
    [null, company, [null, company]],
    [company, company2, [company, company2]],
    [company, null, [company, null]],
    [company, company, undefined]
  ];

  Ember.run(()=> {
    for (let test of tests) {
      let [firstCompany, nextCompany, expectedChanged] = test;
      let user = make('user', { company: firstCompany });
      setUser(user, 'company', nextCompany);
      let changed = user.changed().company;
      if (expectedChanged) {
        assert.deepEqual(changed, expectedChanged);
      } else {
        assert.ok(!changed);
      }

    }
  });
});

test('replacing (polymorphic) belongsTo async:false', function(assert) {
  let company = make('small-company');
  let company2 = make('big-company');

  let tests = [
    [null, company, [null, company]],
    [company, company2, [company, company2]],
    [company, null, [company, null]],
    [company, company, undefined],
  ];

  for (let test of tests) {
    let [firstCompany, nextCompany, expectedChanged] = test;
    let user = make('user', { company: firstCompany });
    setUser(user, 'company', nextCompany);

    let changed = user.changed().company;
    if (expectedChanged) {
      assert.deepEqual(changed, expectedChanged);
    } else {
      assert.ok(!changed);
    }
  }
});

test('replacing belongsTo async:true', function(assert) {
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

test('keepOnlyChanged serializer', function(assert) {
  let user = make('user');
  let company = make('small-company');
  let info = { dude: 1 };

  let tests = [
    ['info', null, true, 'undefined to null attribute is a change ( according to ember-data )'],
    ['info', info, true, 'replace attribute'],
    ['company', null, false, 'undefined to null relationship is NOT a change'],
    ['company', company, true, 'change belongsTo'],
  ];

  for (let test of tests) {
    let [key, value, expected, message] = test;
    setUser(user, key, value);
    let attributes = user.serialize();
    assert.equal(attributes.hasOwnProperty(key), expected, message);
  }
});

test('includes attrs on create', function(assert) {
  let company = make('company');
  Ember.run(()=> {
    let user = FactoryGuy.store.createRecord('user', { company });
    let json = user.serialize();
    assert.equal(json['company'], company.get('id'));
  });
});

test('clears saved attributes on delete', function(assert) {
  let done = assert.async();
  let company = make('company', { info: { d: 2 } });
  assert.ok(!!company.get(ModelTrackerKey));
  mockDelete(company);
  Ember.run(()=> {
    company.destroyRecord().then(()=> {
      assert.ok(!company.get(ModelTrackerKey));
      done();
    });
  });
});

