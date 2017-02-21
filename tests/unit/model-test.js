import Ember from 'ember';
import FactoryGuy, {
  build, make, makeList, mockUpdate, mockFindRecord, mockReload,
  mockDelete, manualSetup, mockSetup, mockTeardown
}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleForModel} from 'ember-qunit';
import Tracker, {ModelTrackerKey} from 'ember-data-change-tracker/tracker';
import sinon from 'sinon';

modelInitializer();

let assertMetaKey = function(data, expectedType, expectedName, assert) {
  assert.equal(data.type, expectedType);
  assert.equal(data.name, expectedName);
  assert.equal(typeof data.transform.serialize, 'function');
  assert.equal(typeof data.transform.deserialize, 'function');
};

moduleForModel('user', 'Unit | Model', {
  integration: true,

  beforeEach: function() {
    manualSetup(this.container);
  }
});

let setModel = (model, attr, value) => {
  Ember.run(() => model.set(attr, value));
};

test('only sets up tracking meta data once on model type', function(assert) {
  let Model = FactoryGuy.store.modelFor('dog');
  let model = new Model();

  assert.ok(!model.constructor.alreadySetupTrackingMeta);
  sinon.stub(Tracker, 'options').returns({ auto: true });
  let getTrackerInfo = sinon.stub(Tracker, 'getTrackerInfo').returns({ autoSave: true });

  let dog = make('dog');
  assert.ok(dog.constructor.alreadySetupTrackingMeta, 'auto save set up metaData');

  Tracker.setupTracking(dog); // try and setup again
  dog.saveChanges();          // and again

  Tracker.getTrackerInfo.restore();
  Tracker.options.restore();

  assert.ok(getTrackerInfo.calledOnce);
});

test('#setupTracking sets correct trackerKeys on constructor', function(assert) {
  let user = make('user');
  let metaData = Tracker.metaInfo(user);

  assert.deepEqual(Object.keys(metaData), 'info blob company profile projects pets'.split(' '));
  assertMetaKey(metaData.info, 'attribute', 'object', assert);
  assertMetaKey(metaData.company, 'belongsTo', undefined, assert);
  assertMetaKey(metaData.profile, 'belongsTo', undefined, assert);
  assertMetaKey(metaData.projects, 'hasMany', undefined, assert);
  assertMetaKey(metaData.pets, 'hasMany', undefined, assert);
});

test('#saveChanges saves attributes/assocations when model is ready on ajax load', function(assert) {
  let done = assert.async();

  mockSetup({ logLevel: 0 });

  let info = { dude: 1 };
  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 1);

  let json = build('user', {
    info,
    profile: profile.get('id'),
    company: { id: company.get('id'), type: 'company' },
    projects,
    pets
  });

  mockFindRecord('user').returns({ json });

  Ember.run(() => {
    FactoryGuy.store.find('user', json.get('id')).then((user) => {
      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
      assert.deepEqual(user.savedTrackerValue('company'), { id: company.id, type: 'company' });
      assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
      assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
      assert.deepEqual(user.savedTrackerValue('pets'), [{ id: pets[0].id, type: 'pet' }]);

      mockTeardown();
      done();
    });
  });
});

test('#saveChanges saves attributes/assocations when model is ready on model reload', function(assert) {
  let done = assert.async();
  mockSetup({ logLevel: 0 });

  let info = { dude: 1 };
  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 1);

  let user = make('user', {
    info,
    profile: profile.get('id'),
    company: { id: company.get('id'), type: 'company' },
    projects,
    pets
  });

  let info2 = { dude: 2 };
  let company2 = make('company');
  let profile2 = make('profile');
  let projects2 = makeList('project', 2);
  let pets2 = makeList('pet', 1);

  let newUserAttrs = build('user', {
    id: user.get('id'),
    info: info2,
    profile: profile2.get('id'),
    company: { id: company2.get('id'), type: 'company' },
    projects: projects2,
    pets: pets2
  });

  mockReload(user).returns({ json: newUserAttrs });

  Ember.run(() => {
    user.reload().then((user) => {
      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info2));
      assert.deepEqual(user.savedTrackerValue('company'), { id: company2.id, type: 'company' });
      assert.deepEqual(user.savedTrackerValue('profile'), profile2.id);
      assert.deepEqual(user.savedTrackerValue('projects'), projects2.map(v => v.id));
      assert.deepEqual(user.savedTrackerValue('pets'), [{ id: pets2[0].id, type: 'pet' }]);

      mockTeardown();
      done();
    });
  });
});

test('#saveChanges saves attributes/assocations when model info is pushed to store', function(assert) {
  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 1);
  let pets = makeList('pet', 1);
  let info = { dude: 1 };

  let userJson = build('user', {
    info,
    profile: profile.get('id'),
    company: { id: company.get('id'), type: 'company' },
    projects,
    pets
  });

  let Model = FactoryGuy.store.modelFor('user');
  let modelClass = new Model({ store: FactoryGuy.store });
  let normalized = Tracker.normalize(modelClass, userJson.get());

  Ember.run(() => {
    let user = FactoryGuy.store.push(normalized);
    assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
    assert.deepEqual(user.savedTrackerValue('company'), { id: company.id, type: 'company' });
    assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
    assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
    assert.deepEqual(user.savedTrackerValue('pets'), [{ id: pets[0].id, type: 'pet' }]);
  });
});

test('#saveChanges saves attributes/assocations when model newly created', function(assert) {
  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 1);
  let pets = makeList('pet', 1);
  let info = { dude: 1 };

  let user;
  Ember.run(() => {
    user = FactoryGuy.store.createRecord('user', { info, profile, company, projects, pets });
  });

  assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
  assert.deepEqual(user.savedTrackerValue('company'), { id: company.id, type: 'company' });
  assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
  assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
  assert.deepEqual(user.savedTrackerValue('pets'), [{ id: pets[0].id, type: 'pet' }]);
});

test('#didChange ( replacing )', function(assert) {
  let company = make('small-company');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 2);
  let info = { dude: 1 };

  let tests = [
    ['info', undefined, null, true],
    ['info', undefined, info, true],
    ['company', null, null, false],
    ['company', null, company, true],
    ['projects', [], [], false],
    ['projects', [], projects, true],
    ['pets', [], [], false],
    ['pets', [], pets, true],
  ];

  for (let test of tests) {
    let [key, firstValue, nextValue, expected] = test;
    let user = make('user', { [key]: firstValue });
    user.saveChanges();
    setModel(user, key, nextValue);
    assert.equal(user.didChange(key), expected);
  }
});

test('#save method resets changed if auto tracking', function(assert) {
  const done = assert.async();
  mockSetup();

  Ember.run(() => {
    let company = make('company');
    let info = { dude: 1 };
    let projects = makeList('project', 2);
    let noPets = [];
    let pets = makeList('pet', 2);
    let user = make('user', { company, info, projects, noPets });

    // change relationships and attribute
    user.set('company', null);
    user.set('projects', []);
    user.set('pets', pets);
    info.dude = 2;

    mockUpdate(user);

    user.save().then(() => {
      assert.ok(!user.changed().info, 'clears changed info after save');
      assert.ok(!user.changed().company, 'clears changed company after save');
      assert.ok(!user.changed().projects, 'clears changed projects after save');
      assert.ok(!user.changed().pets, 'clears changed pets after save');
      mockTeardown();
      done();
    });
  });
});

test('#changed ( modifying ) attribute of type undefined', function(assert) {
  let blob = { foo: 1 };
  let company = make('company', { blob });
  company.startTrack();

  blob.foo = 2;

  let changed = company.changed().blob;
  assert.ok(changed);
});

test('#changed ( modifying ) attribute of type that does not serialize to string', function(assert) {
  let blob = { foo: 1 };
  let user = make('user', { blob });

  blob.foo = 2;

  let changed = user.changed().blob;
  assert.ok(changed);
});

test('#changed ( modifying ) attribute of type "object"', function(assert) {
  let info = { dude: 1 };
  let user = make('user', { info });
  info.dude = 3;

  let changed = (user.changed().info);
  assert.ok(changed);
});

test('#changed ( replacing )', function(assert) {
  let company = make('small-company');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 2);
  let [cat, dog] = pets;
  let pets3 = [dog, cat];
  let info = { dude: 1 };

  let tests = [
    ['info', undefined, null, true],
    ['info', undefined, info, true],
    ['info', info, null, true],
    ['company', null, null, false],
    ['company', null, company, true],
    ['company', company, null, true],
    ['company', company, company, false],
    ['projects', [], [], false],
    ['projects', [], projects, true],
    ['projects', projects, [], true],
    ['projects', projects, projects, false],
    ['pets', [], [], false],
    ['pets', [], pets, true],
    ['pets', pets, [], true],
    ['pets', pets, [cat], true],
    ['pets', [cat], [cat, dog], true],
    ['pets', pets, pets3, false],
  ];

  for (let test of tests) {
    let [key, firstValue, nextValue, expected] = test;
    let user = make('user', { [key]: firstValue });

    setModel(user, key, nextValue);
    assert.equal(!!user.changed()[key], expected);
  }
});

//test('#changed incremental saves', function(assert) {
//  let company = make('small-company');
////  let projects = makeList('project', 2);
////  let pets = makeList('pet', 2);
////  let [cat, dog] = pets;
////  let pets3 = [dog, cat];
//  let info = { dude: 1 };
//  let user = make('user', {info, company});
//
//  let tests = [
////    ['info', null, true],
////    ['info', info, true],
////    ['info', info, false],
////    ['company', null, null, false],
////    ['company', null, company, true],
////    ['company', company, null, true],
////    ['company', company, company, false],
////    ['projects', [], [], false],
////    ['projects', [], projects, true],
////    ['projects', projects, [], true],
////    ['projects', projects, projects, false],
////    ['pets', [], [], false],
////    ['pets', [], pets, true],
////    ['pets', pets, [], true],
////    ['pets', pets, [cat], true],
////    ['pets', [cat], [cat, dog], true],
////    ['pets', pets, pets3, false],
//  ];
//
//  for (let test of tests) {
//    let [key, newValue, expected] = test;
//    Ember.run(()=> user.set(key, newValue));
//    let obj = user.changed();
//    console.log(user.savedTrackerValue('options'), 'changed', obj);
//    assert.equal(obj.hasOwnProperty(key),expected);
//    user.saveChanges();
//
////    let [key, firstValue, nextValue, expected] = test;
////    let user = make('user', { [key]: firstValue });
////    setModel(user, key, nextValue);
////    assert.equal(!!user.changed()[key], expected);
//  }
//});

test('keepOnlyChanged serializer mixin', function(assert) {
  let company = make('company');
  let details = makeList('detail', 2);
  let blob = { dude: 1 };
  let project = make('project');

  let tests = [
    ['attributes', 'blob', null, true, 'undefined to null attribute is a change ( according to ember-data )'],
    ['attributes', 'blob', blob, true, 'replace attribute'],
    ['relationships', 'company', null, false, 'undefined to null belongsTo is NOT a change'],
    ['relationships', 'company', company, true, 'change belongsTo'],
    ['relationships', 'details', [], false, 'undefined to empty array hasMany is not a change'],
    ['relationships', 'details', details, true, 'change hasMany']
  ];

  for (let test of tests) {
    let [category, key, value, expected, message] = test;
    setModel(project, key, value);
    let attributes = project.serialize();
    let data = attributes.data[category];

    assert.equal(!!(data && data.hasOwnProperty(key)), expected, message);
  }
});

test('clears all saved keys on delete', function(assert) {
  let done = assert.async();
  let user = make('user', { info: { d: 2 } });

  assert.ok(!!user.get(ModelTrackerKey));
  mockDelete(user);
  Ember.run(() => {
    user.destroyRecord().then(() => {
      assert.ok(!user.get(ModelTrackerKey));
      done();
    });
  });
});

test('#rollback from things to different things', function(assert) {
  Ember.run(() => {
    let info = { foo: 1 };
    let blob = { dude: 'A' };

    let profile = make('profile');
    let profile2 = make('profile');

    let projects = makeList('project', 2);
    let [project1] = projects;

    let pets = makeList('cat', 4);
    let [cat, cat2] = pets;

    let company = make('big-company');
    let company2 = make('small-company');

    let list = [1, 2, 3, 4];
    let location = build('location', { place: 'home' }).get();

    let user = make('user', {
      info,
      blob,
      list,
      location,
      profile,
      company,
      pets,
      projects
    });

    let savedUser = user.serialize();
    // blob is speacial because it's serializer (json) does not stringify
    delete savedUser.data.attributes.blob;

    console.time('track');

    user.startTrack();

    user.setProperties({
      'info.foo': 3,
      'blob.dude': 'B',
      'location.place': 'zanzibar',
      company: company2,
      profile: profile2,
      projects: [project1],
      pets: [cat, cat2]
    });

    user.get('list').addObject(5);

    user.rollback();

    console.timeEnd('track');

    let afterRollbackUser = user.serialize();
    delete afterRollbackUser.data.attributes.blob;

    assert.equal(user.get('currentState.stateName'), 'root.loaded.saved');
    assert.deepEqual(savedUser, afterRollbackUser);
    assert.deepEqual(user.get('blob'), { dude: 'A' });
  });
});

test('#rollback hasMany to empty', function(assert) {
  Ember.run(() => {
    let projects = makeList('project', 3);
    let pets = makeList('cat', 4);

    let user = make('user', 'empty');

    console.time('track');

    user.startTrack();

    user.setProperties({ projects, pets });

    user.rollback();

    console.timeEnd('track');

    assert.equal(user.get('currentState.stateName'), 'root.loaded.saved');
    assert.deepEqual(user.get('projects').mapBy('id'), []);
    assert.deepEqual(user.get('pets').mapBy('id'), []);
  });
});

test('#rollback hasMany when have at least one and add some more', function(assert) {
  Ember.run(() => {
    let [project1, project2] = makeList('project', 2);
    let [pet1, pet2] = makeList('cat', 2);

    let user = make('user', 'empty', {pets: [pet1], projects: [project1]});

    console.time('track');

    user.startTrack();

    user.get('projects').addObject(project2);
    user.get('pets').addObject(pet2);

    user.rollback();

    console.timeEnd('track');

    assert.equal(user.get('currentState.stateName'), 'root.loaded.saved');
    assert.deepEqual(user.get('projects').mapBy('id'), [project1.id]);
    assert.deepEqual(user.get('pets').mapBy('id'), [pet1.id]);
  });
});


test('#dirtiness computed works properly', function(assert) {
  const done = assert.async();
  mockSetup();

  Ember.run(() => {

    // synchronous tests on client

    let [project1, project2] = makeList('project', 2);
    let [profile1, profile2] = makeList('profile', 2);

    let user = make('user', 'empty', {profile: profile1, projects: [project1]});

    assert.equal(user.get('isDirty'), false);
    assert.equal(user.get('hasDirtyAttributes'), false);
    assert.equal(user.get('hasDirtyRelations'), false);

    user.startTrack();

    user.set('name', 'Michael');
    assert.equal(user.get('isDirty'), true);
    assert.equal(user.get('hasDirtyAttributes'), true);
    assert.equal(user.get('hasDirtyRelations'), false);
    user.rollback();

    user.set('profile', profile2);
    assert.equal(user.get('isDirty'), true);
    assert.equal(user.get('hasDirtyAttributes'), false);
    assert.equal(user.get('hasDirtyRelations'), true);
    user.rollback();

    user.get('projects').addObject(project2);

    assert.equal(user.get('isDirty'), true);
    assert.equal(user.get('hasDirtyAttributes'), false);
    assert.equal(user.get('hasDirtyRelations'), true);

    // asynchronous tests with commit to server

    mockUpdate(user);
    user.get('projects').clear();
    user.set('name', 'Peter');
    user.set('profile', null);

    assert.equal(user.get('isDirty'), true);
    assert.equal(user.get('hasDirtyAttributes'), true);
    assert.equal(user.get('hasDirtyRelations'), true);

    user.save().then(() => {
      assert.equal(user.get('isDirty'), false);
      assert.equal(user.get('hasDirtyAttributes'), false);
      assert.equal(user.get('hasDirtyRelations'), false);

      mockTeardown();
      done();

    });

  });
});
