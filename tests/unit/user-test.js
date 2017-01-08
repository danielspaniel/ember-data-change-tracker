import Ember from 'ember';
import {make, mockUpdate, manualSetup, mockSetup, mockTeardown}  from 'ember-data-factory-guy';
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
  assert.deepEqual(Object.keys(extraChecks), ['info', 'company']);
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
  let changedInfo = user.changed().info;
  assert.deepEqual(changedInfo[0], { dude: 3 }, 'shows current value at index 0 of changed array');
  assert.deepEqual(changedInfo[1], { dude: 1 }, 'shows last value at index 1 of changed array');
});

test('changing object attribute entirely', function(assert) {
  let info = { dude: 1 };
  let info2 = { dude: 3 };
  let user = make('user', { info });
  Ember.run(()=>user.set('info', info2));
  let changedInfo = user.changed().info;
  assert.deepEqual(changedInfo[0], info2);
  assert.deepEqual(changedInfo[1], info);
});

test('belongsTo async:false replacing model', function(assert) {
  const done = assert.async();
  mockSetup();
  Ember.run(()=> {
    let company = make('company');
    let company2 = make('company');
    let user = make('user', {company});

    user.set('company', company2);
    assert.ok(user.changed().company);
    user.set('company', null);
    assert.ok(user.changed().company);

    mockUpdate(user);
    user.save().then(()=> {
      assert.ok(!user.changed().company, 'clears changed company after save');
      done();
      mockTeardown();
    });
  });
});

test('belongsTo async:false change model attribute', function(assert) {
  const done = assert.async();
  mockSetup();
  Ember.run(()=> {
    let info = {style: 'ok'};
    let company = make('company',{info});
    let user = make('user', {company});

    info.style = 'good';
//    company.set('name', 'Duuuuude Co');
    assert.ok(user.changed().company);

    mockUpdate(user);
    user.save().then(()=> {
      assert.ok(!user.changed().company);
      done();
      mockTeardown();
    });
  });
});

//test('belongsTo async:true', function(assert) {
//  Ember.run(()=> {
////    const done = assert.async();
//    let user = make('user', 'withCompany');
//    console.log(user.get('company')+'',user.get('company').content+'')
//    user.set('company', null);
//    console.log(user.get('company')+'',user.get('company').content+'')
////    console.log('current',user.currentObjectAttibuteValue('company'));
////    console.log('last',user.lastAttributeValue('company'));
//    console.log('1 changed', user.changed());
//    assert.ok(user.changed().company);
//    mockUpdate(user);
//    user.save().then(()=> {
////      console.log('current',user.currentObjectAttibuteValue('company'));
////      console.log('last',user.lastAttributeValue('company'));
//      console.log('2 changed', user.changed());
//      assert.ok(!user.changed().company);
//      done();
//    });
//  });
//});