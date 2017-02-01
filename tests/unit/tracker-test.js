import Ember from 'ember';
import Tracker from 'ember-data-change-tracker/tracker';
import {make, makeList, manualSetup}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleFor} from 'ember-qunit';
import sinon from 'sinon';
const { A } = Ember;
const { w } = Ember.String;
modelInitializer();

moduleFor('model:company', 'Unit | Tracker', {
  integration: true,

  beforeEach: function() {
    manualSetup(this.container);
  }
});

test('#envConfig returns the config for the application environment', function(assert) {
  let company = make('company');
  assert.deepEqual(Tracker.envConfig(company), {});
});

test('#options with valid options', sinon.test(function(assert) {
  let company = make('company');
  let envConfig = this.stub(Tracker, 'envConfig');
  let modelConfig = this.stub(Tracker, 'modelConfig');

  let tests = [
    [ {}, {}, { trackHasMany: true, auto: false}],
    [{ trackHasMany: false } , {}, { trackHasMany: false, auto: false }],
    [{ trackHasMany: true } , { only: ['info'] }, { auto: false, trackHasMany: true, only: ['info'] }],
    [{}, { only: ['info'] }, { only: ['info'], auto: false, trackHasMany: true }],
    [{}, { except: ['info'] }, { except: ['info'], auto: false, trackHasMany: true }],
  ];

  for (let test of tests) {
    let [envOpts, modelOpts, expectedOptions] = test;
    envConfig.returns(envOpts);
    modelConfig.returns(modelOpts);
    assert.deepEqual(Tracker.options(company), expectedOptions);
  }
}));

test('#options with invalid options', function(assert) {
  let company = make('company');

  company.set('changeTracker', { dude: "where's my car" });
  assert.throws(()=>Tracker.options(company), `[ember-data-change-tracker] 
    changeTracker options can have 'only', 'except' , 'auto', or 
    'trackHasMany' but you are declaring: dude`);
});

test('#getTrackerKeys', sinon.test(function(assert) {
  let user = make('user');
  let envConfig = this.stub(Tracker, 'envConfig');
  let modelConfig = this.stub(Tracker, 'modelConfig');

  let tests = [
    [ {}, {}, 'info blob company profile projects pets'],
    [{ trackHasMany: false } , {}, 'info blob company profile'],
    [{ trackHasMany: true } , { only: ['info'] }, 'info'],
    [{}, { only: ['info'] }, 'info'],
    [{}, { except: ['info'] }, 'blob company profile projects pets'],
    [{auto: true}, {}, 'info blob company profile projects pets', true],
  ];

  for (let test of tests) {
    let [envOpts, modelOpts, expectedKeys, expectedAutoSave=false] = test;
    envConfig.returns(envOpts);
    modelConfig.returns(modelOpts);
    let info = Tracker.getTrackerInfo(user);
    assert.deepEqual(Object.keys(info.keyMeta), w(expectedKeys), 'has correct keys');
    assert.equal(info.autoSave, expectedAutoSave, 'auto save setting');
  }
}));

test('#serialize, #deserialize values', sinon.test(function(assert) {
  let envConfig = this.stub(Tracker, 'envConfig');
  envConfig.returns({trackHasMany: true, auto: true});

  let company = make('company');
  let profile = make('profile');
  let projects = makeList('project', 2);
  let pets = makeList('pet', 2);

  let tests = [
    ['info', null, "null"],
    ['info', { dude: 1 }, '{"dude":1}'],
    ['profile', null, null],
    ['profile', profile, profile.id],
    ['company', null, null],
    ['company', company, { id: company.id, type: company.constructor.modelName }],
    ['projects', undefined, null],
    ['projects', projects, A(projects).mapBy('id')],
    ['pets', pets, pets.map((p)=> {return {id: p.id, type: p.constructor.modelName};})],
  ];

  for (let test of tests) {
    let [key, value, expectedSerialized] = test;
    let user = make('user', { [key]: value });

    let serializedValue = Tracker.serialize(user, key);
    assert.deepEqual(serializedValue, expectedSerialized);
  }
}));