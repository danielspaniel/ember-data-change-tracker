# ember-data-change-tracking

[![Build Status](https://secure.travis-ci.org/danielspaniel/ember-data-change-tracker.png?branch=master)](http://travis-ci.org/danielspaniel/ember-data-change-tracker) [![Ember Observer Score](http://emberobserver.com/badges/ember-data-change-tracker.svg)](http://emberobserver.com/addons/ember-data-change-tracker) [![npm version](https://badge.fury.io/js/ember-data-change-tracker.svg)](http://badge.fury.io/js/ember-data-change-tracker)

This addon aims to fill in the gaps in the change tracking that ember data does now.
 - Currently ember-data tracks changes for numbers/strings/date/boolean attributes
  - has a ```changeAttributes()``` method to see what changed

 - This addon:
    - tracks modifications in attributes that are object/json
    - tracks replacement of belongsTo associations
    - tracks replacement/changes in hasMany associations
    - adds a ```changed()``` method to DS.Model 
    - Only works with ember-data versions 2.5+

## Installation

* `ember install ember-data-change-tracker`

## Why?

    Say there is a user model like this:

```javascript
  export default Model.extend({
       name: attr('string'),  // ember-date tracks this already   
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
  let info = {foo: 1) // some object
  let projects = //=> collection of project models
  let user = //=> user model with info => info , company => company, and projects => projects 
```

### changed() method added to DS.Model instances
  -  Shows you any changes in an object attribute type
    - whether modified or replacing the value  
    - attr() will default to 'object' type 
    - works with any custom type you have created
  - Shows when you replace a belongsTo association
  - Shows when you add to a hasMany association
  - Shows when you delete from a hasMany association
  - Merges ember-data `changeAttribute()` information into one unified change object

Example: ( modify attribute )
```javascript
  info.foo = 2               // or
  user.set('info.foo', 2);   // same idea
                      //    old value, new value      
  user.changed().info //=> [{foo: 1),  {foo: 2)]
```

Example: ( replace attribute )
```javascript
  user.set('info', {foo: 3});
                      //    old value, new value      
  user.changed().info //=> [{foo: 1),  {foo: 3)]
```

Example: ( replace belongTo )
```javascript
  user.set('company', company2);  
                        //    old value, new value      
  user.changed().company //=> [company,  company2]
```

Example: ( add to a hasMany )
```javascript    
  user.get('projects').addObject(project3); // add project3
                          //    old value,             new value      
  user.changed().projects //=> [[project1, project2],  [project1, project2, project3]]
```

Example: ( remove from a hasMany )
```javascript      
  user.get('projects').removeObject(firstProject); // remove project1
                          //    old value,             new value      
  user.changed().projects //=> [[project1, project2],  [project2]]
```

### Configuration
  - By default tracking hasMany is turned off 
    - To turn it on globally:

```javascript
  // file config/environment.js
  var ENV = {
    modulePrefix: 'dummy',
    environment: environment,
    rootURL: '/',
    locationType: 'auto',
    changeTracker: { trackHasMany: true } // add this setting
    EmberENV: {
    ... rest of config
   
```
  - You can also set options on the model itself
    
```javascript
  // file app/models/user.js
  export default Model.extend({
    changeTracker: {only: ['info', 'company', 'pets']}, // settings for this model
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
  - You can use only or except and also override the global trackHasMany
    - for example: 
```javascript
  changeTracker: {trackHasMany: false} // global 
  changeTracker: {trackHasMany: true}, // in model 
  // will track project and pets
 ```    
```javascript 
  changeTracker: {trackHasMany: false} // global
  changeTracker: {only: ['pets']},
  // will track pets  
```   
```javascript 
  changeTracker: {trackHasMany: true} // global
  changeTracker: {except: ['pets']},
  // will track projects  
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

New addon for dirty tracking non standard attributes ( objects ) and associations
  - tracks modifications in attributes that are object/json
  - tracks replacement of belongsTo associations
  - tracks replacement/changes in hasMany associations
  - Only works with ember-data versions 2.5+

https://github.com/danielspaniel/ember-data-change-tracker


 