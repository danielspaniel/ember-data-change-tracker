import Ember from 'ember';
import FactoryGuy, {build, buildList, make, makeList, mockUpdate, mockFindRecord,
  mockFindAll, mockDelete, manualSetup, mockSetup, mockTeardown}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleForModel} from 'ember-qunit';
import Tracker, {ModelTrackerKey} from 'ember-data-change-tracker/tracker';

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

  assert.deepEqual(Object.keys(extraChecks), 'info json company profile projects pets'.split(' '));

  assert.equal(extraChecks.info.type, 'attribute');
  assert.equal(typeof extraChecks.info.transform.serialize, 'function');
  assert.equal(typeof extraChecks.info.transform.deserialize, 'function');

  assert.equal(extraChecks.json.type, 'attribute');
  assert.equal(typeof extraChecks.json.transform.serialize, 'function');
  assert.equal(typeof extraChecks.json.transform.deserialize, 'function');

  assert.deepEqual(extraChecks.company, { type: 'belongsTo' });

  assert.deepEqual(extraChecks.projects, { type: 'hasMany' });
  assert.deepEqual(extraChecks.pets, { type: 'hasMany' });
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
      assert.deepEqual(Tracker.lastValue(user, 'company'), { id: company.get('id'), type: 'company' });
      assert.deepEqual(Tracker.lastValue(user, 'profile'), { id: profile.get('id'), type: 'profile' });
      done();
      mockTeardown();
    });
  });
});

test('#saveChanges saves hasMany assocations when model is ready on ajax load', function(assert) {
  let done = assert.async();

  mockSetup({ logLevel: 1 });
  let projects = makeList('project', 2);
  let user = build('user', { projects } );
  mockFindRecord('user').returns({ json: user });

  Ember.run(()=> {
    FactoryGuy.store.find('user', user.get('id')).then((user)=> {
      let expected = projects.map((p)=> { return {id: p.id, type: p.constructor.modelName}; });
      assert.deepEqual(Tracker.lastValue(user, 'projects'), expected);
      done();
      mockTeardown();
    });
  });

});

test('#saveChanges saves belongsTo assocations when model info is pushed to store', function(assert) {
  let company = make('company');
  let profile = make('profile');
  let userJson = build('user', { profile: profile.get('id'), company: { id: company.get('id'), type: 'company' } });

  let normalized = FactoryGuy.store.normalize('user', userJson.get());

  Ember.run(()=> {
    let user = FactoryGuy.store.push(normalized);
    assert.deepEqual(Tracker.lastValue(user, 'company'), { id: company.get('id'), type: 'company' });
    assert.deepEqual(Tracker.lastValue(user, 'profile'), { id: profile.get('id'), type: 'profile' });
  });
});

test('#saveChanges saves hasMany assocations when model info is pushed to store', function(assert) {
  let projects = makeList('project', 2);
  let userJson = build('user', { projects });

  let normalized = FactoryGuy.store.normalize('user', userJson.get());

  Ember.run(()=> {
    let user = FactoryGuy.store.push(normalized);
    let expected = projects.map((p)=> { return {id: p.id, type: p.constructor.modelName}; });
    assert.deepEqual(Tracker.lastValue(user, 'projects'), expected);
  });
});

test('#didAttributeChange', function(assert) {
  let user = make('user');
  let company = make('small-company');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 2);

  let info = { dude: 1 };

  let tests = [
    ['info', null, true],
    ['info', info, true],
    ['company', null, false],
    ['company', company, true],
    ['projects', [], false],
    ['projects', projects, true],
    ['pets', [], false],
    ['pets', pets, true],
  ];

  let setUser = (user, attr, value)=> {
    Ember.run(()=>user.set(attr, value));
  };

  for (let test of tests) {
    let [key, value, expected] = test;
    setUser(user, key, value);
    assert.equal(user.didAttributeChange(key), expected);
  }

});

test('#save method resets changed', function(assert) {
  const done = assert.async();
  mockSetup();
  Ember.run(()=> {
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
    user.save().then(()=> {
      assert.ok(!user.changed().info, 'clears changed info after save');
      assert.ok(!user.changed().company, 'clears changed company after save');
      assert.ok(!user.changed().projects, 'clears changed projects after save');
      assert.ok(!user.changed().pets, 'clears changed pets after save');
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

test('replace hasMany async:false', function(assert) {
  let projects1 = makeList('project', 2);
  let projects2 = makeList('project', 2);

  let tests = [
    [[], projects1, [[], projects1]],
    [projects1, projects2, [projects1, projects2]],
    [projects1, [], [projects1, []]],
    [projects1, projects1, undefined]
  ];
  let setUser = (user, projects)=> {
    user.set('projects', projects);
  };
  Ember.run(()=> {
    for (let test of tests) {
      let [firstProjectList, nextProjectList, expectedChanged] = test;
      let user = make('user', { projects: firstProjectList });
      setUser(user, nextProjectList);
      let changed = user.changed().projects;
      if (expectedChanged) {
        //TODO ok to convert to array for comparison or should the chaanged obj hold only vanilla arrays?
        // (internally it is a DS.ManyArray)
        let changeArray = changed.map((e)=>{return e.toArray ? e.toArray() : e;});
        assert.deepEqual(changeArray, expectedChanged);
      } else {
        assert.ok(!changed);
      }
    }
  });
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

test('replacing hasMany async:true', function(assert) {
  let done = assert.async();
  mockSetup({ logLevel: 1 });
  let pets1 = buildList('pet', 2);
  let pets2 = makeList('pet', 2);

  mockFindAll('pet').returns({ json: pets1 });

  let user = make('user');
  Ember.run(()=> {
    user.get('pets').then(()=> {
      //TODO: test passes but above call returns an empty array for pets - wrong mocking? useless test?
      user.set('pets', pets2);
      assert.ok(user.changed().pets);
      done();
      mockTeardown();
    });
  });
});

test('adding element to hasMany', function(assert) {
  let projects = makeList('project', 2);
  let newProject = make('project');
  let user = make('user', { projects });

  Ember.run(()=> {
    user.get('projects').addObject(newProject);

    let changed = user.changed().projects;
    let changedArray = changed.map((e)=>{return e.toArray ? e.toArray() : e;});
    let expectedChanged = [projects, projects.concat([newProject])];
    assert.deepEqual(changedArray, expectedChanged);
    });
});

test('removing element from hasMany', function(assert) {
  let projects = makeList('project', 2);
  let firstProject = projects[0];
  let user = make('user', { projects });

  Ember.run(()=> {
    user.get('projects').removeObject(firstProject);

    let changed = user.changed().projects;
    let changedArray = changed.map((e)=>{return e.toArray ? e.toArray() : e;});
    let expectedChanged = [projects, projects.slice(1)];
    assert.deepEqual(changedArray, expectedChanged);
    });
});

test('re-ordering elements in hasMany', function(assert) {
  let projects = makeList('project', 2);
  let user = make('user', { projects });

  Ember.run(()=> {
    user.set('projects', projects.reverse());

    let changed = user.changed().projects;
    assert.ok(!changed);
    });
});

test('mutating attributes of elements in hasMany', function(assert) {
  let projects = makeList('project', 2);
  let user = make('user', { projects });

  Ember.run(()=> {
    let firstProject = user.get('projects.firstObject');
    firstProject.set('title', 'New Shiny Project');

    let changed = user.changed().projects;
    assert.ok(!changed);
    });
});

test('keepOnlyChanged serializer', function(assert) {
  let user = make('user');
  let company = make('small-company');
  let projects = makeList('project', 2);
  let info = { dude: 1 };

  let tests = [
    ['info', null, true, 'undefined to null attribute is a change ( according to ember-data )'],
    ['info', info, true, 'replace attribute'],
    ['company', null, false, 'undefined to null relationship is NOT a change'],
    ['company', company, true, 'change belongsTo'],
    ['projects', [], false, 'undefined to empty array is not a change in hasMany'],
    ['projects', projects, true, 'change hasMany']
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
  let projects = makeList('project', 2);
  Ember.run(()=> {
    let user = FactoryGuy.store.createRecord('user', { company, projects });
    let json = user.serialize();

    assert.equal(json['company'], company.get('id'));
    assert.deepEqual(json['projects'], projects.map((p)=> p.id));
  });
});

test('clears belongsTo saved attributes on delete', function(assert) {
  let done = assert.async();
  let company = make('company', {info: {d:2}});

  assert.ok(!!company.get(ModelTrackerKey));
  mockDelete(company);
  Ember.run(()=> {
    company.destroyRecord().then(()=> {
      assert.ok(!company.get(ModelTrackerKey));
      done();
    });
  });
});

//TODO:
// proper place for done call?
// test('clears hasMany saved attributes on delete', function(assert) {
//   let done = assert.async();
//   let projects = makeList('project', 2);
//   projects.forEach((p)=> {
//     assert.ok(!!p.get(ModelTrackerKey));
//   });
//   projects.forEach((p)=> {
//     mockDelete(p);
//   });
//
//   Ember.run(()=> {
//     projects.forEach((p)=> {
//       p.destroyRecord()
//       .then(()=> {
//         assert.ok(!p.get(ModelTrackerKey));
//       })
//       .finally(()=> {
//         done();
//       });
//     });
//   });
//
// });
