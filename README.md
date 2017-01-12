# ember-data-change-tracking

This addon aims to fill in the gaps in the change tracking that ember data does now. 
 - Currently ember-data tracks changes for numbers/strings/date/boolean attribute,
  and has a changeAttributes method to see what changed 
 
 - This addon tracks changes in attributes that are object/json such that if 
   the object/json changes this will flag the attribute as changed.
 
    Say there is a user model like this:

```javascript
  export default Model.extend({
       name: attr('string'),
       info: attr('object'),
       json: attr(),
       company: belongsTo('company', { async: false, polymorphic: true }),
       profile: belongsTo('profile', { async: true }),
   });
```

   And you have a user with an object attribute this:

```javascript
  let user = my user model where info => {foo:1} 
```
  So when you do this: 
```javascript
  user.set('info', {foo: 2); // or
  user.set('info.foo', 2);   // same idea
```
     
 - Ember data does not know that info attribute changed because it does not track the internal state of that info object
 - When using this addon you get a new method on models `changed`()`

  Using changed method shows you the change in info object:

```javascript
                      //    old value, new value      
  user.changed().info //=> [{foo: 1),  {foo: 2)] 
```
   
    
     
     

## Installation

* `ember install ember-data-change-tracking`

