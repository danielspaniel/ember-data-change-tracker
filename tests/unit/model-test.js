import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import FactoryGuy, {
  build, buildList, make, makeList, mockUpdate, mockFindRecord, mockReload,
  mockDelete, manualSetup, mockCreate, mock
} from 'ember-data-factory-guy';
import { initializer as modelInitializer } from 'ember-data-change-tracker';
import Tracker, { ModelTrackerKey, RelationshipsKnownTrackerKey } from 'ember-data-change-tracker/tracker';
import sinon from 'sinon';
import EmberObject, { get, observer } from '@ember/object';

modelInitializer();

const setModel = (model, attr, value) => {
  run(() => model.set(attr, value));
};

const assertMetaKey = (data, expectedType, expectedName, assert) => {
  assert.equal(data.type, expectedType);
  assert.equal(data.name, expectedName);
  assert.equal(typeof data.transform.serialize, 'function');
  assert.equal(typeof data.transform.deserialize, 'function');
};

module('Unit | Model', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    manualSetup(this);
  });

  test('only sets up tracking meta data once on model type', function(assert) {
    sinon.stub(Tracker, 'options').returns({auto: true});
    let getTrackerInfo = sinon.stub(Tracker, 'getTrackerInfo').returns({autoSave: true});

    let dog = make('dog');
    assert.ok(dog.constructor.alreadySetupTrackingMeta, 'auto save set up metaData');

    Tracker.setupTracking(dog); // try and setup again
    dog.saveChanges();          // and again

    Tracker.getTrackerInfo.restore();
    Tracker.options.restore();

    assert.ok(getTrackerInfo.calledOnce);
  });

  test('clears all saved keys on delete', async function(assert) {
    let user = make('user', {info: {d: 2}});

    assert.ok(!!user.get(ModelTrackerKey));
    assert.ok(!!user.get(RelationshipsKnownTrackerKey));
    mockDelete(user);

    await run(async () => user.destroyRecord());
    assert.ok(!user.get(ModelTrackerKey));
    assert.ok(!user.get(RelationshipsKnownTrackerKey));
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

  module('#saveChanges', function() {

    test('when model is ready on ajax load', async function(assert) {
      let info     = {dude: 1},
          company  = make('company'),
          profile  = make('profile'),
          projects = makeList('project', 2),
          pets     = makeList('pet', 1);

      let json = build('user', {
        info,
        profile: profile.get('id'),
        company: {id: company.get('id'), type: 'company'},
        projects,
        pets
      });

      mockFindRecord('user').returns({json});

      let user = await run(async () => FactoryGuy.store.find('user', json.get('id')));
      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
      assert.deepEqual(user.savedTrackerValue('company'), {id: company.id, type: 'company'});
      assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
      assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
      assert.deepEqual(user.savedTrackerValue('pets'), [{id: pets[0].id, type: 'pet'}]);
    });

    test('when model is ready on model reload', async function(assert) {
      let info     = {dude: 1},
          company  = make('company'),
          profile  = make('profile'),
          projects = makeList('project', 2),
          pets     = makeList('pet', 1);

      let user = make('user', {
        info,
        profile: profile.get('id'),
        company: {id: company.get('id'), type: 'company'},
        projects,
        pets
      });

      let info2     = {dude: 2},
          company2  = make('company'),
          profile2  = make('profile'),
          projects2 = makeList('project', 2),
          pets2     = makeList('pet', 1);

      let newUserAttrs = build('user', {
        id: user.get('id'),
        info: info2,
        profile: profile2.get('id'),
        company: {id: company2.get('id'), type: 'company'},
        projects: projects2,
        pets: pets2
      });

      mockReload(user).returns({json: newUserAttrs});

      await run(async () => user.reload());
      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info2));
      assert.deepEqual(user.savedTrackerValue('company'), {id: company2.id, type: 'company'});
      assert.deepEqual(user.savedTrackerValue('profile'), profile2.id);
      assert.deepEqual(user.savedTrackerValue('projects'), projects2.map(v => v.id));
      assert.deepEqual(user.savedTrackerValue('pets'), [{id: pets2[0].id, type: 'pet'}]);
    });

    test('when model info is pushed to store', function(assert) {
      let company  = make('company'),
          profile  = make('profile'),
          projects = makeList('project', 1),
          pets     = makeList('pet', 1),
          info     = {dude: 1};

      let userJson = build('user', {
        info,
        profile: profile.get('id'),
        company: {id: company.get('id'), type: 'company'},
        projects,
        pets
      });

      let normalized = Tracker.normalize(make('user'), userJson.get());

      let user = run(() => FactoryGuy.store.push(normalized));
      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(info));
      assert.deepEqual(user.savedTrackerValue('company'), {id: company.id, type: 'company'});
      assert.deepEqual(user.savedTrackerValue('profile'), profile.id);
      assert.deepEqual(user.savedTrackerValue('projects'), projects.map(v => v.id));
      assert.deepEqual(user.savedTrackerValue('pets'), [{id: pets[0].id, type: 'pet'}]);
    });

    test('when model newly created', function(assert) {
      let company  = make('company'),
          profile  = make('profile'),
          projects = makeList('project', 1),
          pets     = makeList('pet', 1),
          info     = {dude: 1},
          params   = {info, profile, company, projects, pets},
          user     = run(() => FactoryGuy.store.createRecord('user', params));

      assert.deepEqual(user.savedTrackerValue('info'), undefined, 'sets object attr to undefined');
      assert.deepEqual(user.savedTrackerValue('company'), undefined, 'sets async belongsTo to undefined');
      assert.deepEqual(user.savedTrackerValue('profile'), undefined, 'sets non async belongsTo to undefined');
      assert.deepEqual(user.savedTrackerValue('projects'), undefined, 'sets async hasMany to undefined');
      assert.deepEqual(user.savedTrackerValue('pets'), undefined, 'sets non async hasMany to undefined');
    });

    test('when newly created model is saved', async function(assert) {
      let info   = {dude: 1},
          params = {info},
          user   = run(() => FactoryGuy.store.createRecord('user', params));

      mockCreate(user);
      assert.ok(user.get('isDirty'), 'object attribute causes model to be dirty');
      await run(async () => user.save());

      assert.notOk(user.get('isDirty'), 'resets isDirty');

      assert.notOk(Object.keys(user.modelChanges()).length, 'clears model changes');
    });

    test('with except keys', function(assert) {
      let [company1, company2] = makeList('company', 2),
          startInfo            = {e: 'Duck'},
          newInfo              = {f: 'Goose'},
          user                 = make('user', {info: startInfo, company: company1});

      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(startInfo), 'saveTrackerValue for info to start');
      assert.deepEqual(user.savedTrackerValue('company'), {id: company1.id, type: 'company'}, 'saveTrackerValue for company to start');

      run(() => user.setProperties({info: newInfo, company: company2}));

      user.saveTrackerChanges({except: ['company']});

      assert.deepEqual(user.savedTrackerValue('info'), JSON.stringify(newInfo), 'saveTrackerValue for info is updated');
      assert.deepEqual(user.savedTrackerValue('company'), {id: company1.id, type: 'company'}, 'saveTrackerValue for company does not change');

      assert.ok(user.get('isDirty'), 'user isDirty => true');
    });

    test('with observer on model.isDirty', async function(assert) {
      let [company1, company2] = makeList('company', 2),
          [detail1, detail2]   = makeList('detail', 2),
          project              = make('project', {details: [detail1], company: company1});

      project.startTrack();

      EmberObject.extend({
        record: null,
        init() {
          this._super(...arguments);
          this.isDirtyObserver();
        },
        isDirtyObserver: observer('record.isDirty', function() {
          this.get('record.isDirty');
        }),
      }).create({record: project});

      run(() => project.setProperties({title: 'Blob in Space', company: company2}));
      project.get('details').addObject(detail2);

      mockUpdate(project);

      await run(async () => project.save());
      assert.equal(project.get('isDirty'), false);
      assert.equal(project.get('hasDirtyAttributes'), false);
      assert.equal(project.get('hasDirtyRelations'), false);
    });
  });

  module('#didChange', function() {
    test('when setting properties on newly created model', function(assert) {
      let company  = make('company'),
          profile  = make('profile'),
          projects = makeList('project', 1),
          pets     = makeList('pet', 1),
          info     = {dude: 1};

      let params = {info, profile, company, projects, pets};
      let user = run(() => FactoryGuy.store.createRecord('user', params));

      assert.ok(user.didChange('info'));
      assert.ok(user.didChange('company'));
      assert.ok(user.didChange('profile'));
      assert.ok(user.didChange('projects'));
      assert.ok(user.didChange('pets'));
    });

    test('when replacing properties in existing model', function(assert) {
      let company  = make('small-company'),
          projects = makeList('project', 2),
          pets     = makeList('pet', 2),
          info     = {dude: 1};

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
        let user = make('user', {[key]: firstValue});
        user.saveChanges();
        setModel(user, key, nextValue);
        assert.equal(user.didChange(key), expected);
      }
    });
  });

  test('#save method resets changed if auto tracking', async function(assert) {
    let company  = make('company'),
        info     = {dude: 1},
        projects = makeList('project', 2),
        noPets   = [],
        pets     = makeList('pet', 2),
        user     = make('user', {company, info, projects, noPets});

    // change relationships and attribute
    run(() => {
      user.set('company', null);
      user.set('projects', []);
      user.set('pets', pets);
    });

    info.dude = 2;

    mockUpdate(user);

    await run(async () => user.save());
    assert.ok(!user.modelChanges().info, 'clears changed info after save');
    assert.ok(!user.modelChanges().company, 'clears changed company after save');
    assert.ok(!user.modelChanges().projects, 'clears changed projects after save');
    assert.ok(!user.modelChanges().pets, 'clears changed pets after save');
  });

  module('#modelChanges', function() {

    test('modifying attribute of type undefined', function(assert) {
      let blob    = {foo: 1},
          company = make('company', {blob});

      company.startTrack();

      blob.foo = 2;

      let changed = company.modelChanges().blob;
      assert.ok(changed);
    });

    test('modifying attribute of type that does not serialize to string', function(assert) {
      let blob = {foo: 1},
          user = make('user', {blob});

      blob.foo = 2;

      let changed = user.modelChanges().blob;
      assert.ok(changed);
    });

    test('modifying attribute of type "object"', function(assert) {
      let info = {dude: 1},
          user = make('user', {info});

      info.dude = 3;

      let changed = (user.modelChanges().info);
      assert.ok(changed);
    });

    test('replacing attributes or associations', function(assert) {
      let company    = make('small-company'),
          projects   = makeList('project', 2),
          pets       = makeList('pet', 2),
          [cat, dog] = pets,
          info       = {dude: 1};

      let tests = [
        ['info', undefined, null, true, 'undefined to null for an object attribute is not a change'],
        ['info', undefined, info, true, 'add item for an object attribute is a change'],
        ['info', info, null, true, 'remove value from object attribute is a change'],
        ['company', null, null, false, 'no item still no item in a belongsTo is not a change'],
        ['company', null, company, true, 'add item in a belongsTo is a change'],
        ['company', company, null, true, 'remove item in a belongsTo is a change'],
        ['company', company, company, false, 'same item in a belongsTo is not a change'],
        ['projects', [], [], false, 'empty staying empty in a hasMany is not a change'],
        ['projects', [], projects, true, 'adding many to a hasMany is a change'],
        ['projects', projects, [], true, 'removing all from a hasMany is a change'],
        ['projects', projects, projects, false, 'same items in a hasMany is not a change'],
        ['pets', [], [], false, 'from none to none in a polymorphic hasMany is not a change'],
        ['pets', [], [cat, dog], true, 'adding many to a polymorphic hasMany is a change'],
        ['pets', [cat, dog], [], true, 'removing all from a polymorphichasMany is a change'],
        ['pets', [cat, dog], [cat], true, 'removing one from a polymorphic hasMany is a change'],
        ['pets', [cat], [cat, dog], true, 'adding to a polymorphic hasMany is a change'],
        ['pets', [dog, cat], [cat, dog], true, 'change to the order of polymorphic hasMany is a change'],
      ];

      for (let test of tests) {
        let [key, firstValue, nextValue, expected, message] = test;
        let user = make('user', {[key]: firstValue});

        setModel(user, key, nextValue);
        assert.equal(!!user.modelChanges()[key], expected, message);
      }
    });

    test('loading lazy belongsTo association via Related Resource Links', async function (assert) {
      let json = build('project', {
        links: {
          company: "/projects/1/company"
        }
      });

      mockFindRecord('project').returns({json});

      let project = await run(async () => FactoryGuy.store.find('project', json.get('id')));
      assert.notOk(project.modelChanges().company, 'company has not been loaded, should not be considered to be changed');

      project.startTrack(); // Start tracking before the full relationship is loaded

      let companyJson = build('company', {id: '14', type: 'company', name: 'foo'});

      mock({
        type: 'GET',
        url: '/projects/1/company',
        responseText: companyJson
      });

      await project.get('company');

      assert.notOk(project.modelChanges().company, 'company has been loaded but not modified, should not be considered to be changed');

      let company    = make('small-company');
      setModel(project, 'company', company);

      assert.ok(project.modelChanges().company, 'company has been modified');
    });

    test('loading lazy hasMany association via Related Resource Links', async function (assert) {
      let json = build('project', {
        links: {
          details: "/projects/1/details"
        }
      });

      mockFindRecord('project').returns({json});

      let project = await run(async () => FactoryGuy.store.find('project', json.get('id')));
      assert.notOk(project.modelChanges().details, 'details have not been loaded, should not be considered to be changed');

      project.startTrack(); // Start tracking before the full relationship is loaded

      let detailsJson = buildList('detail', 2);

      mock({
        type: 'GET',
        url: '/projects/1/details',
        responseText: detailsJson
      });

      await project.get('details');

      assert.notOk(project.modelChanges().details, 'details has been loaded but not modified, should not be considered to be changed');

      let detail = make('detail');
      setModel(project, 'details', [detail]);

      assert.ok(project.modelChanges().details, 'details has been modified');
    });
  });

  module('when using keepOnlyChanged mixin', function() {

    test("touched but unchanged relationships should not serialize", async function(assert) {
      let json = build('project', {
        company: {
          data: {id: '1', type: 'company'}
        }
      });

      delete json.included; // We don't want to sideload (create) the company

      mockFindRecord('project').returns({json});

      let project = await run(async () => FactoryGuy.store.find('project', json.get('id')));
      assert.equal(project.belongsTo('company').value(), null, 'relationship should not be loaded');
      assert.equal(project.belongsTo('company').id(), '1', 'relationship record id should be set through linkage');

      project.startTrack(); // Start tracking before the full relationship is loaded

      let companyJson = build('company', {id: '1', type: 'company', name: 'foo'});
      run(() => FactoryGuy.store.pushPayload('company', companyJson));

      mockFindRecord('company').returns({json});

      let company = await run(async () => FactoryGuy.store.find('company', '1'));
      assert.equal(project.belongsTo('company').id(), company.get('id'), 'ids should match');

      project.setProperties({company, title: 'test'});

      assert.equal(project.belongsTo('company').id(), company.get('id'), 'ids should still match');

      let {data} = project.serialize();
      let relationships = data.relationships || {};
      let attributes = data.attributes || {};

      assert.ok(relationships.company == null, 'unchanged relationship should not be serialized');
      assert.ok(attributes.title != null, 'changed attribute should be serialized');
    });

    test('when', function(assert) {
      let company = make('company');
      let details = makeList('detail', 2);
      let blob = {dude: 1};
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
        project.startTrack();
        setModel(project, key, value);
        let attributes = project.serialize();
        let data = attributes.data[category];

        assert.equal(!!(data && data.hasOwnProperty(key)), expected, message);
      }
    });
  });

  module('#rollback', function() {

    test('from things to different things', function(assert) {
      run(() => {
        let info        = {foo: 1},
            blob        = {dude: 'A'},

            profile     = make('profile'),
            profile2    = make('profile'),

            projects    = makeList('project', 2),
            [project1]  = projects,

            pets        = makeList('cat', 4),
            [cat, cat2] = pets,

            company     = make('big-company'),
            company2    = make('small-company'),

            list        = [1, 2, 3, 4],
            location    = build('location', {place: 'home'}).get();

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
        assert.deepEqual(user.get('blob'), {dude: 'A'});
      });
    });

    test('hasMany to empty', function(assert) {

      let projects = makeList('project', 3),
          pets     = makeList('cat', 4),
          user     = make('user', 'empty');

      console.time('track');

      user.startTrack();

      run(() => user.setProperties({projects, pets}));

      run(() => user.rollback());

      console.timeEnd('track');

      assert.equal(user.get('currentState.stateName'), 'root.loaded.saved');
      assert.deepEqual(user.get('projects').mapBy('id'), []);
      assert.deepEqual(user.get('pets').mapBy('id'), []);
    });

    test('hasMany when have at least one and add some more', function(assert) {
      let [project1, project2] = makeList('project', 2),
          [pet1, pet2]         = makeList('cat', 2),

          user                 = make('user', 'empty', {pets: [pet1], projects: [project1]});

      console.time('track');

      user.startTrack();

      user.get('projects').addObject(project2);
      user.get('pets').addObject(pet2);

      run(() => user.rollback());

      console.timeEnd('track');

      assert.equal(user.get('currentState.stateName'), 'root.loaded.saved');
      assert.deepEqual(user.get('projects').mapBy('id'), [project1.id]);
      assert.deepEqual(user.get('pets').mapBy('id'), [pet1.id]);
    });

    test('value for object / array type attribute', function(assert) {
      let blob    = [1, 2, 3],
          company = make('company', {blob});

      company.startTrack();

      company.get('blob').push('4');

      run(() => company.rollback());

      assert.equal(company.get('currentState.stateName'), 'root.loaded.saved');
      assert.deepEqual(company.get('blob'), [1, 2, 3]);
    });
  });

  module('#isDirty', function() {

    test('is available when the option enableIsDirty is true', function(assert) {
      let company = make('company'),
          user    = make('user', 'empty');

      assert.equal(get(user, 'isDirty'), false);
      assert.equal(get(company, 'isDirty'), undefined);
    });

    module('with auto save model', function() {

      test('when changing standard attributes', function(assert) {
        let user = make('user', 'empty');

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyAttributes'), false);

        run(() => user.set('name', 'Michael'));

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyAttributes'), true);
      });

      test('when changing belongsTo relationship', function(assert) {
        let [profile1, profile2] = makeList('profile', 2),
            user                 = make('user', 'empty', {profile: profile1});

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyRelations'), false);

        run(() => user.set('profile', profile2));

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyRelations'), true);

      });

      test('when removing belongsTo (async false) relationship', function(assert) {
        let [profile1] = makeList('profile', 1),
            user       = make('user', 'empty', {profile: profile1});

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyRelations'), false);

        run(() => user.set('profile', null));

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyRelations'), true);
      });

      test('when removing belongsTo (async true) relationship', function(assert) {
        let [company1] = makeList('company', 1),
            user       = make('user', 'empty', {company: company1});

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyRelations'), false);

        run(() => user.set('company', null));

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyRelations'), true);
      });

      test('when adding to hasMany relationship', function(assert) {
        let [project1, project2] = makeList('project', 2),
            user                 = make('user', 'empty', {projects: [project1]});

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyRelations'), false);

        user.get('projects').addObject(project2);

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyRelations'), true);
      });

      test('when removing from hasMany (async true) relationship', function(assert) {
        let [project1, project2] = makeList('project', 2);

        let user = make('user', 'empty', {projects: [project1, project2]});

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyRelations'), false);

        user.get('projects').removeObject(project2);

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyRelations'), true);
      });

      test('when removing from hasMany (async false) relationship', function(assert) {
        let [pet1, pet2] = makeList('pet', 2);

        let user = make('user', 'empty', {pets: [pet1, pet2]});

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyRelations'), false);

        run(() => user.get('pets').removeObject(pet2));

        assert.equal(user.get('isDirty'), true);
        assert.equal(user.get('hasDirtyRelations'), true);
      });

      test('resets on rollback', function(assert) {
        let [project1, project2] = makeList('project', 2),
            [profile1, profile2] = makeList('profile', 2),
            user                 = make('user', 'empty', {profile: profile1, projects: [project1]});

        run(() => user.setProperties({name: 'Michael', profile: profile2}));
        user.get('projects').addObject(project2);

        user.rollback();

        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyAttributes'), false);
        assert.equal(user.get('hasDirtyRelations'), false);
      });

      test('resets on ajax update', async function(assert) {
        let [project1, project2] = makeList('project', 2),
            [profile1, profile2] = makeList('profile', 2),
            user                 = make('user', 'empty', {profile: profile1, projects: [project1]});

        run(() => user.setProperties({name: 'Michael', profile: profile2}));
        user.get('projects').addObject(project2);

        assert.equal(user.get('isDirty'), true);

        mockUpdate(user);

        await run(async () => user.save());
        assert.equal(user.get('isDirty'), false);
        assert.equal(user.get('hasDirtyAttributes'), false);
        assert.equal(user.get('hasDirtyRelations'), false);
      });

    });

    module('with NON auto save model', function() {

      test('when changing attributes or relationships', function(assert) {

        let [company1, company2] = makeList('company', 2),
            [detail1, detail2]   = makeList('detail', 2),
            project              = make('project', {details: [detail1], company: company1});

        project.startTrack();

        assert.equal(project.get('isDirty'), false);
        assert.equal(project.get('hasDirtyAttributes'), false);
        assert.equal(project.get('hasDirtyRelations'), false);

        run(() => project.setProperties({title: 'Blob in Space', company: company2}));
        project.get('details').addObject(detail2);

        assert.equal(project.get('isDirty'), true);
        assert.equal(project.get('hasDirtyAttributes'), true);
        assert.equal(project.get('hasDirtyRelations'), true);
      });

      test('resets on rollback', function(assert) {
        let [company1, company2] = makeList('company', 2),
            [detail1, detail2]   = makeList('detail', 2),
            project              = make('project', {details: [detail1], company: company1});

        project.startTrack();

        run(() => project.setProperties({title: 'Blob in Space', company: company2}));
        project.get('details').addObject(detail2);

        run(() => project.rollback());

        assert.equal(project.get('isDirty'), false);
        assert.equal(project.get('hasDirtyAttributes'), false);
        assert.equal(project.get('hasDirtyRelations'), false);
      });

      test('resets on update', async function(assert) {
        let [company1, company2] = makeList('company', 2),
            [detail1, detail2]   = makeList('detail', 2),
            project              = make('project', {details: [detail1], company: company1});

        project.startTrack();

        run(() => project.setProperties({title: 'Blob in Space', company: company2}));
        project.get('details').addObject(detail2);

        mockUpdate(project);

        await run(async () => project.save());
        assert.equal(project.get('isDirty'), false);
        assert.equal(project.get('hasDirtyAttributes'), false);
        assert.equal(project.get('hasDirtyRelations'), false);
      });
    });
  });
});
