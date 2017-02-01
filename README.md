# ember-data-change-tracker

[![Build Status](https://secure.travis-ci.org/danielspaniel/ember-data-change-tracker.png?branch=master)](http://travis-ci.org/danielspaniel/ember-data-change-tracker) [![Ember Observer Score](http://emberobserver.com/badges/ember-data-change-tracker.svg)](http://emberobserver.com/addons/ember-data-change-tracker) [![npm version](https://badge.fury.io/js/ember-data-change-tracker.svg)](http://badge.fury.io/js/ember-data-change-tracker)

**New**  
  - By popular demand, added manual mode
    - Manual mode ( which is the default ) 
      - Auto tracking is turned off 
      - Nothing happens until you tell a model to start tracking
    - Auto track mode
      - Set up in [configuration](https://github.com/danielspaniel/ember-data-change-tracker#configuration) as { auto: true }    
   

This addon aims to fill in the gaps in the change tracking / rollback that ember data does now.
 
 - Currently ember-data 
  - tracks changes for numbers/strings/date/boolean attributes
  - has a ```changeAttributes()``` method to see what changed => [ last, current ]
  - has a ```rollbackAttributes()``` method to rollback attributes
  
 - This addon:
    - tracks modifications in attributes that are object/json/custom type
    - tracks replacement of belongsTo associations
    - tracks replacement/changes in hasMany associations
    - adds a ```changed()``` method to DS.Model
    - adds a ```rollback()``` method to DS.Model
    - Only works with 
      - ember-data versions 2.7+ ( if you have polymphic relationships )
      - ember-data versions 2.5+ ( if you don't )
    - Can be used in two modes 
      - auto track mode
      - manual track mode ( the default )
    - Uses no observers, and no computed properties
       
## Installation

* `ember install ember-data-change-tracker`

## Why?

  Say there is a user model like this:

```javascript
  export default Model.extend({
       name: attr('string'),  // ember-data tracks this already
       info: attr('object'),  // ember-data does not track modifications
       json: attr(),          // ember-data does not track modifications if this is object
       company: belongsTo('company', { async: false, polymorphic: true }),  // ember-data does not track replacement
       profile: belongsTo('profile', { async: true }), // ember-data does not track replacement
       projects: hasMany('project', { async: false }), // ember-data does not track additions/deletions
       pets: hasMany('pet', { async: true }) // ember-data does not track additions/deletions
   });
```

   And you have a user with attributes/associations:

```javascript
  let company = //=> company model
  let company2 = //=> different company model
  let info = {foo: 1} // some object
  let projects = //=> collection of project models
  let user = //=> user model with info => info , company => company, and projects => projects
```

### Changed
  
  - The method ```changed()``` is added to model
  - Shows you any changes in an object attribute type
    - whether modified or replacing the value
    - attr() will default to 'object' type
    - works with any custom type you have created
  - Shows when you replace a belongsTo association
  - Shows when you add to a hasMany association
  - Shows when you delete from a hasMany association
  - Merges ember-data `changeAttribute()` information into one unified change object
  - Unlike ember-data no last and current value is shown, just the boolean => true
    - Though you will see [last value, current value] for the attributes that ember-data tracks 

Example: ( remove from a hasMany )
```javascript
  user.get('projects').removeObject(firstProject); // remove project1
  user.changed() //=> {projects: true }
```


### Rollback

  - The method ```rollback()``` is added to model
  - If your not using auto track you have to call ```startTrack()``` before editing 
  - Performace wise, it's way faster than you think it should be. 
    - Tested on model with hundreds of items in a hasMany association.
    - Though you might want to think twice when tracking one with thousands 
    
Usage: 
  
- make and makeList are from [ember-data-factory-guy](https://github.com/danielspaniel/ember-data-factory-guy). 
  - they create and push models ( based on factories ) into the ember-data store
 
```javascript 
    let info = {foo: 1};
    let projects = makeList('project', 2);
    let pets = makeList('cat', 4);
    let [cat, cat2] = pets;
    let bigCompany = make('big-company');
    let smallCompany = make('small-company');

    let user = make('user', { profile: profile1, company: bigCompany, pets, projects });

    // manual tracking model means you have to explicitly call => startTrack
    // to save the current state of things before you edit
    user.startTrack();   

    // edit things  
    user.setProperties({
      'info.foo': 3,
      company: smallCompany,
      profile: profile2,
      projects: [project1],
      pets: [cat, cat2]
    });

    user.rollback();

    // it's all back to the way it was
    user.get('info') //=> {foo: 1}
    user.get('profile') //=> profile1
    user.get('company') //=> bigCompany
    user.get('pets') //=> back to 4 pets

```


### Configuration
  
  - Global configuration 
    - By default the global settings are: 
      - { trackHasMany: true, auto: false }
        - Essentially this says, track everything in the model but only when I tell you
        - Since this is manual mode you probably want to track everything 
          since you are focused on one edit at a time
    - The options available are: 
      - trackHasMany : ( true [default] / false)  => should hasMany associations be tracked
      - auto : ( true / false [default]) => should tracking be turned on my default
        - auto tracking means when any model is saved/updated/reloaded the tracker will save
          the current state, allowing you to rollback anytime 

  - Model configuration
    - Takes precedence over global
    - The options available are: 
       - trackHasMany : same as global trackHasMany  
       - auto : same as global auto  
       - only : limit the attributes/associations tracked on this model to just these
       - except : don't include these attributes/associations
       - You can use 'only' and 'except' at the same time, but you could also clean your nose with a pipe cleaner         

```javascript
  // file config/environment.js
  var ENV = {
    modulePrefix: 'dummy',
    environment: environment,
    rootURL: '/',
    locationType: 'auto',
    changeTracker: { trackHasMany: true, auto: true }, 
    EmberENV: {
    ... rest of config

```
  - Set options on the model

```javascript
  // file app/models/user.js
  export default Model.extend({
    changeTracker: {only: ['info', 'company', 'pets']}, // settings for user models
    name: attr('string'),
    style: attr('string'),
    info: attr('object'),
    json: attr(),
    company: belongsTo('company', { async: false, polymorphic: true }),
    profile: belongsTo('profile', { async: true }),
    projects: hasMany('project', { async: false }),
    pets: hasMany('pet', { async: true })
  });
```

### Serializer extras
  - Mixin is provided that will allow you to remove any attributes/associations
    that did not change from the serialized json
  - Useful when you want to reduce the size of a json payload
  - removing unchanged values can be big reduction at times

Example:

  Let's say you set up the user model's serializer with keep-only-changed mixin

```javascript
// file: app/serializers/user.js
import DS from 'ember-data';
import keepOnlyChanged from 'ember-data-change-tracker/mixins/keep-only-changed';

export default DS.RESTSerializer.extend(keepOnlyChanged);
```

Then when you are updating the user model

```javascript
user.set('info.foo', 1);
user.serialize(); //=> '{ info: {"foo:1"} }'

// without this mixin enabled the json would look like:
// '{ name: 'dude', info: {"foo:1"}, company: "1" companyType: "company"', profile: "1" }'
// where all the attributes and association are included whether they changed or not
```

## Extra's 
  - Adds a few more helpful methods to ember data model
    - ```didChange(key) ```
      - did the value on this key change?
    - ```savedTrackerValue(key)``` 
      - this is the value that the key had after it was created/saved and 
      before any modifications

Usage:
```javascript
  user.savedTrackerValue('info') //=> {foo: 1}  original value of info
  user.set('info.foo', 8)      
  user.didChange('info') //=> true
  user.savedTrackerValue('info') //=> {foo: 1}  original value of info still the same   
```
 
## Known Issues
  - Ember less than 2.10
   - When pushing data to the store directly to create a model ( usually done when using 
     websockets ) you need to call ```model.saveChanges()``` manually after creating that 
     new model
               