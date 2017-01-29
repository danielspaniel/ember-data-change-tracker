import Ember from 'ember';
import FactoryGuy, {
  build, buildList, make, makeList, mockUpdate, mockFindRecord, mockReload,
  mockDelete, mockFindAll, manualSetup, mockSetup, mockTeardown
}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleForModel} from 'ember-qunit';
import Tracker, {ModelTrackerKey} from 'ember-data-change-tracker/tracker';
import sinon from 'sinon';

modelInitializer();

let forceTracking = (modelName, info) => {
  let Model = FactoryGuy.store.modelFor(modelName);
  let model = new Model();
  let constructor = model.constructor;
  constructor.alreadySetupTrackingMeta = false;
  constructor.trackerAutoSave = info.auto;
  sinon.stub(Tracker, 'modelConfig').returns({ only: info.keys, auto: info.auto, trackHasMany: info.hasMany });
};

moduleForModel('user', 'Unit | Model', {
  integration: true,

  beforeEach: function() {
    manualSetup(this.container);
  }
});

let setUser = (user, attr, value) => {
  Ember.run(() => user.set(attr, value));
};

test('sets alreadySetupTrackingMeta to true after setting trackingMeta', function(assert) {
  let user = this.subject();
  assert.ok(!user.constructor.alreadySetupTrackingMeta);
  Tracker.setupTracking(user);
  assert.ok(user.constructor.alreadySetupTrackingMeta);
});

//test('#extractExtraAtttibutes sets correct trackerKeys on constructor', function(assert) {
//  let user = make('user');
//  let extraChecks = user.constructor.trackerKeys;

//  assert.deepEqual(Object.keys(extraChecks), 'info json company profile projects pets'.split(' '));
//
//  assert.equal(extraChecks.info && extraChecks.info.type, 'attribute');
//  assert.equal(typeof extraChecks.info.transform.serialize, 'function');
//  assert.equal(typeof extraChecks.info.transform.deserialize, 'function');

//  assert.equal(extraChecks.json && extraChecks.json.type, 'attribute');
//  assert.equal(typeof extraChecks.json.transform.serialize, 'function');
//  assert.equal(typeof extraChecks.json.transform.deserialize, 'function');

//  assert.deepEqual(extraChecks.company, { type: 'belongsTo' });

//  assert.deepEqual(extraChecks.projects, { type: 'hasMany' });
//  assert.deepEqual(extraChecks.pets, { type: 'hasMany' });
//});

test('#saveChanges saves attributes/assocations when model is ready on ajax load', function(assert) {
  let done = assert.async();

  forceTracking('user', {
    keys: Ember.String.w('info company profile projects pets'),
    auto: true,
    hasMany: true,
  });

  mockSetup({ logLevel: 0 });

  let info = { dude: 1 };
  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 1);

  console.log([{ id: pets[0].id, type: 'cat' }]);
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
      Tracker.modelConfig.restore();
      done();
    });
  });
});

test('#saveChanges saves attributes/assocations when model is ready on model reload', function(assert) {
  let done = assert.async();
  mockSetup({ logLevel: 0 });

  forceTracking('user', {
    keys: Ember.String.w('info company profile projects pets'),
    auto: true,
    hasMany: true,
  });

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
      Tracker.modelConfig.restore();
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

  forceTracking('user', {
    keys: Ember.String.w('info company profile projects pets'),
    auto: true,
    hasMany: true,
  });

  let userJson = build('user', {
    info,
    profile: profile.get('id'),
    company: { id: company.get('id'), type: 'company' },
    projects,
    pets
  });

  let normalized = FactoryGuy.store.normalize('user', userJson.get());

  Ember.run(() => {
    let user = FactoryGuy.store.push(normalized);
    assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
    assert.deepEqual(user.savedTrackerValue('company'), { id: company.id, type: 'company' });
    assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
    assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
    assert.deepEqual(user.savedTrackerValue('pets'), [{ id: pets[0].id, type: 'pet' }]);

    Tracker.modelConfig.restore();
  });
});

test('#saveChanges saves attributes/assocations when model newly created', function(assert) {
  forceTracking('user', {
    keys: Ember.String.w('info company profile projects pets'),
    auto: true,
    hasMany: true,
  });

  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 1);
  let pets = makeList('pet', 1);
  let info = { dude: 1 };

  let user;
  Ember.run(()=> {
    user = FactoryGuy.store.createRecord('user', { info, profile, company, projects, pets });
  });

  assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
  assert.deepEqual(user.savedTrackerValue('company'), { id: company.id, type: 'company' });
  assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
  assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
  assert.deepEqual(user.savedTrackerValue('pets'), [{ id: pets[0].id, type: 'pet' }]);

  Tracker.modelConfig.restore();
});

test('#didChange', function(assert) {
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
    setUser(user, key, nextValue);
    assert.equal(user.didChange(key), expected);
  }
});

//test('#save method resets changed', function(assert) {
//  const done = assert.async();
//  mockSetup();
//  Ember.run(()=> {
//    let company = make('company');
//    let info = { dude: 1 };
//    let projects = makeList('project', 2);
//    let noPets = [];
//    let pets = makeList('pet', 2);
//    let user = make('user', { company, info, projects, noPets });
//
//    // change relationships and attribute
//    user.set('company', null);
//    user.set('projects', []);
//    user.set('pets', pets);
//    info.dude = 2;
//
//    mockUpdate(user);
//    user.save().then(()=> {
//      assert.ok(!user.changed().info, 'clears changed info after save');
//      assert.ok(!user.changed().company, 'clears changed company after save');
//      assert.ok(!user.changed().projects, 'clears changed projects after save');
//      assert.ok(!user.changed().pets, 'clears changed pets after save');
//      mockTeardown();
//      done();
//    });
//  });
//});
//
//test('modify attribute of type "object"', function(assert) {
//  let info = { dude: 1 };
//  let user = make('user', { info });
//  info.dude = 3;
//
//  let changed = (user.changed().info);
//
//  assert.deepEqual(changed[0], { dude: 1 }, 'shows last value at index 0 of changed array');
//  assert.deepEqual(changed[1], { dude: 3 }, 'shows current value at index 1 of changed array');
//});
//
//test('replace attribute of type "object"', function(assert) {
//  let info = { dude: 1 };
//  let info2 = { dude: 3 };
//
//  let tests = [
//    [undefined, null, [undefined, null]],
//    [undefined, info, [undefined, info]],
//    [null, info, [null, info]],
//    [info, null, [info, null]],
//    [info, info, undefined],
//    [info, info2, [info, info2]],
//  ];
//
//  for (let test of tests) {
//    let [firstValue, nextValue, expectedChanged] = test;
//    let user = make('user', { info: firstValue });
//    setUser(user, 'info', nextValue);
//    let changed = user.changed().info;
//    assert.deepEqual(changed, expectedChanged);
//  }
//});
//
//test('replace attribute of type undefined', function(assert) {
//  let user = make('user', { json: { foo: 1 } });
//  Ember.run(()=>user.set('json', { foo: 2 }));
//
//  let changed = user.changed().json;
//  assert.deepEqual(changed, [{ foo: 1 }, { foo: 2 }]);
//});
//
//test('modify attribute of type undefined', function(assert) {
//  let json = { foo: 1 };
//  let user = make('user', { json });
//  json.foo = 2;
//
//  let changed = user.changed().json;
//  assert.deepEqual(changed, [{ foo: 1 }, { foo: 2 }]);
//});
//
//test('#changed when replacing belongsTo async:false', function(assert) {
//  let company = make('company');
//  let company2 = make('company');
//
//  let tests = [
//    [null, company, [null, company]],
//    [company, company2, [company, company2]],
//    [company, null, [company, null]],
//    [company, company, undefined]
//  ];
//
//  Ember.run(()=> {
//    for (let test of tests) {
//      let [firstCompany, nextCompany, expectedChanged] = test;
//      let user = make('user', { company: firstCompany });
//      setUser(user, 'company', nextCompany);
//      let changed = user.changed().company;
//      if (expectedChanged) {
//        assert.deepEqual(changed, expectedChanged);
//      } else {
//        assert.ok(!changed);
//      }
//    }
//  });
//});
//
//test('#changed when replacing (polymorphic) belongsTo async:false', function(assert) {
//  let company = make('small-company');
//  let company2 = make('big-company');
//
//  let tests = [
//    [null, company, [null, company]],
//    [company, company2, [company, company2]],
//    [company, null, [company, null]],
//    [company, company, undefined],
//  ];
//
//  for (let test of tests) {
//    let [firstCompany, nextCompany, expectedChanged] = test;
//    let user = make('user', { company: firstCompany });
//    setUser(user, 'company', nextCompany);
//
//    let changed = user.changed().company;
//    if (expectedChanged) {
//      assert.deepEqual(changed, expectedChanged);
//    } else {
//      assert.ok(!changed);
//    }
//  }
//});
//
//test('#changed when replace hasMany async:false', function(assert) {
//  let projects1 = makeList('project', 2);
//  let projects2 = makeList('project', 2);
//
//  let tests = [
////    [[], projects1, [[], projects1]],
////    [projects1, projects2, [projects1, projects2]],
////    [projects1, [], [projects1, []]],
////    [projects1, projects1, undefined]
//  ];
//  let setUser = (user, projects)=> {
//    user.set('projects', projects);
//  };
//  Ember.run(()=> {
//    for (let test of tests) {
//      let [firstProjectList, nextProjectList, expectedChanged] = test;
//      let user = make('user', { projects: firstProjectList });
//      setUser(user, nextProjectList);
//      let changed = user.changed().projects;
//      if (expectedChanged) {
//        //TODO:
//        // Forced to convert to array for comparison,
//        // Perhaps the changed objects should hold only vanilla arrays.
//        // Right now it is a DS.ManyArray because relationship is {async: false}
//        let changeArray = changed.map((e)=> {
//          return e.toArray ? e.toArray() : e;
//        });
//        assert.deepEqual(changeArray, expectedChanged);
//      } else {
//        assert.ok(!changed);
//      }
//    }
//  });
//});
//
//
//test('#changed when replacing belongsTo async:true', function(assert) {
//  let done = assert.async();
//  mockSetup({ logLevel: 0 });
//  let profile1 = build('profile');
//  let profile2 = make('profile');
//  mockFindRecord('profile').returns({ json: profile1 });
//
//  let user = make('user', { profile: profile1.get('id') });
//
//  Ember.run(()=> {
//    user.get('profile').then(()=> {
//      user.set('profile', profile2);
//      assert.ok(user.changed().profile);
//      mockTeardown();
//      done();
//    });
//  });
//});
//
//test('#changed when replacing hasMany async:true', function(assert) {
//  let done = assert.async();
//  mockSetup({ logLevel: 0 });
//  let pets1 = buildList('pet', 2);
//  let pets2 = makeList('pet', 2);
//
//  mockFindAll('pet').returns({ json: pets1 });
//
//  let user = make('user');
//  Ember.run(()=> {
//    user.get('pets').then(()=> {
//      //TODO:
//      // Forced to convert to array for comparison,
//      // Perhaps the changed objects should hold only vanilla arrays.
//      // Right now it is a DS.PromiseManyArray because relationship is {async: true}
//      user.set('pets', pets2);
//      assert.ok(user.changed().pets);
//      mockTeardown();
//      done();
//    });
//  });
//});
//
//test('adding element to hasMany', function(assert) {
//  let projects = makeList('project', 2);
//  let newProject = make('project');
//  let user = make('user', { projects });
//
//  Ember.run(()=> {
////    user.get('projects').addObject(newProject);
////
////    let changed = user.changed().projects;
////    let changedArray = changed.map((e)=> {
////      return e.toArray ? e.toArray() : e;
////    });
////    let expectedChanged = [projects, projects.concat([newProject])];
////    assert.deepEqual(changedArray, expectedChanged);
//  });
//});
//
//test('removing element from hasMany', function(assert) {
//  let projects = makeList('project', 2);
//  let firstProject = projects[0];
//  let user = make('user', { projects });
//
//  Ember.run(()=> {
////    user.get('projects').removeObject(firstProject);
////
////    let changed = user.changed().projects;
////    let changedArray = changed.map((e)=> {
////      return e.toArray ? e.toArray() : e;
////    });
////    let expectedChanged = [projects, projects.slice(1)];
////    assert.deepEqual(changedArray, expectedChanged);
//  });
//});
//
//test('re-ordering elements in hasMany', function(assert) {
//  let projects = makeList('project', 2);
//  let user = make('user', { projects });
//
//  Ember.run(()=> {
//    user.set('projects', projects.reverse());
//
//    let changed = user.changed().projects;
//    assert.ok(!changed);
//  });
//});
//
//test('mutating attributes of elements in hasMany', function(assert) {
//  let projects = makeList('project', 2);
//  let user = make('user', { projects });
//
//  Ember.run(()=> {
//    let firstProject = user.get('projects.firstObject');
//    firstProject.set('title', 'New Shiny Project');
//
//    let changed = user.changed().projects;
//    assert.ok(!changed);
//  });
//});
//
//test('keepOnlyChanged serializer mixin', function(assert) {
//  let user = make('user');
//  let company = make('small-company');
//  //  let projects = makeList('project', 2);
//  let info = { dude: 1 };
//
//  let tests = [
//    ['info', null, true, 'undefined to null attribute is a change ( according to ember-data )'],
//    ['info', info, true, 'replace attribute'],
//    ['company', null, false, 'undefined to null relationship is NOT a change'],
//    ['company', company, true, 'change belongsTo'],
//    // hasMany are not serialized by default
//    //    ['projects', [], false, 'undefined to empty array is not a change in hasMany'],
//    //    ['projects', projects, true, 'change hasMany']
//  ];
//
//  for (let test of tests) {
//    let [key, value, expected, message] = test;
//    setUser(user, key, value);
//    let attributes = user.serialize();
//    assert.equal(attributes.hasOwnProperty(key), expected, message);
//  }
//});
//
//test('saves keys on create', sinon.test(function(assert) {
//  let company = make('company');
//  let projects = makeList('project', 2);
//
//  let envConfig = this.stub(Tracker, 'envConfig');
//  envConfig.returns({ changeTracker: { trackHasMany: true } });
//
//  let user;
//  Ember.run(()=> {
//    user = FactoryGuy.store.createRecord('user', { company, projects });
//  });
//  assert.equal(Ember.typeOf(user.savedTrackerValue('company')), "object");
//  assert.equal(Ember.typeOf(user.savedTrackerValue('projects')), "array");
//}));
//
//test('clears all saved keys on delete', function(assert) {
//  let done = assert.async();
//  let user = make('user', { info: { d: 2 } });
//
//  assert.ok(!!user.get(ModelTrackerKey));
//  mockDelete(user);
//  Ember.run(()=> {
//    user.destroyRecord().then(()=> {
//      assert.ok(!user.get(ModelTrackerKey));
//      done();
//    });
//  });
//});
//
//test('#rollback', function(assert) {
//  let company = make('company');
//  let user = make('user', { company })
//  let company2 = make('company');
//  let info = { dude: 1 };
//  let info2 = { dude: 3 };
//
//  let tests = [
//    ['company', null, company],
//    ['company', company, company2],
//    ['company', company, null],
//    // ['company', company, company] // change from same to same, test separately?
//    ['info', undefined, null],
//    ['info', undefined, info],
//    ['info', null, info],
//    ['info', info, null],
//    // ['info', info, info], // change from same to same, test separately?
//    ['info', info, info2],
//  ];
//
//  Ember.run(()=> {
//    for (let test of tests) {
//      let [key, from, to] = test;
//      var opts = {};
//      opts[key] = from;
//
//      let user = make('user', opts);
//      setUser(user, key, to);
//
//      assert.ok(user.changed()[key]);
//      assert.deepEqual(user.get(key), to);
//
//      user.rollbackTrackedChanges();
//
//      assert.ok(!user.changed()[key]);
//      assert.deepEqual(user.get(key), from);
//    }
//  });
//});
//
//test('#rollbackTrackedChanges for hasMany', sinon.test(function(assert) {
//  let projects = makeList('project', 2);
//  let projects2 = makeList('project', 2);
//
//  let envConfig = this.stub(Tracker, 'envConfig');
//  envConfig.returns({ changeTracker: { trackHasMany: true } });
//
//  let tests = [
//    // ['projects', undefined, []],
//    // ['projects', undefined, projects],
//    ['projects', projects, projects2],
//  ];
//
//  let user = make('user', { projects });
//  setUser(user, 'projects', projects2);
//
//  Ember.run(()=> {
//    for (let test of tests) {
//      let [key, from, to] = test;
//      var opts = {};
//      opts[key] = from;
//
//      let user = make('user', opts);
//      setUser(user, key, to);
//
//      assert.ok(user.changed()[key]);
//      assert.deepEqual(user.get(key).toArray(), to);
//
//      user.rollbackTrackedChanges();
//
//      console.log('user.changed()[key]', user.changed()[key]);
//      assert.ok(!user.changed()[key]);
//      // assert.deepEqual(user.get(key).toArray(), from);
//    }
//  });
//
//}));


test('#changed ONE', function(assert) {
  Ember.run(() => {
    let location = build('location').get();
    let profile1 = make('profile');
    let profile2 = make('profile');
    let projects = makeList('project', 2);
    let [project1] = projects;
    //  let cat = make('cat');
    //  let dog = make('dog');
    let pets = makeList('cat', 400);
    let [cat, cat2] = pets;
    let bigCompany = make('big-company');
    let user = make('user', { profile: profile1, company: bigCompany, pets, projects });
    let smallCompany = make('small-company', { location });

    let savedUser = user.serialize();
    //    console.log('savedUser',savedUser);
    //    let savedCompany = bigCompany.serialize();
    //    let savedProfile = profile1.serialize();
    //    let savedProject = project.serialize();
    //    let savedCat = cat.serialize();
    console.time('track');

    user.startTrack();

//    console.log(user.savedTrackerValue('pets')[0]);
//    console.log('User Start state', user.get('currentState.stateName'), user.serialize());
    //  console.log(company.get('location')+'',company.serialize());
    //  console.log(cat.get('owner')+'',cat.serialize());
    //  console.log(user.get('profile')+'',profile.serialize());
    //  company.set('location.place', "nerverland");
    //  company.rollbackAttributes();
    //  console.log(company.get('location')+'',company.serialize());

    let changePet = () => {
      cat.setProperties({
        name: 'FidoII'
      });
    }

    let changeProfile = () => {
      profile1.setProperties({
        description: 'dude'
      });
    }

    let changeUser = () => {
      user.setProperties({
        'info.foo': 3,
        company: smallCompany,
        profile: profile2,
        projects: [project1],
        pets: [cat, cat2]
      });
    }

    //  let changeCompany = ()=> company.setProperties({info: {moo: 2}})
    //    changePet();
    //    changeProfile();
    changeUser();
    //  cat.rollback();
    user.rollback();
    //  user.rollback('profile');
    console.timeEnd('track');

    //    console.log(user.get('company')+'',user.get('pets')+'', user.get('currentState.stateName'), user.serialize());
    assert.equal(user.get('currentState.stateName'), 'root.loaded.saved');
    assert.deepEqual(savedUser, user.serialize());
    //    assert.equal(profile1.get('currentState.stateName'), 'root.loaded.saved');
    //    assert.deepEqual(savedProfile, profile1.serialize());
    //    assert.equal(cat.get('currentState.stateName'), 'root.loaded.saved');
    //    assert.deepEqual(savedCat, cat.serialize());

    //  console.log(Tracker.modelInfo(user));
    let tests = [
      //    [null, company, [null, company]],
      //    [company, company2, [company, company2]],
      //    [company, null, [company, null]],
      //    [company, company, undefined],
    ];

    for (let test of tests) {
      //    let [firstCompany, nextCompany, expectedChanged] = test;
      //    let user = make('user', { company: firstCompany });
      //    setUser(user, 'company', nextCompany);
      //
      //    let changed = user.changed().company;
      //    if (expectedChanged) {
      //      assert.deepEqual(changed, expectedChanged);
      //    } else {
      //      assert.ok(!changed);
      //    }
    }
  });
});

