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
  let info = {foo: 1)
  let user = my user model where info => info  or { foo: 1 } 
```
  
  So when you do this: 
```javascript
  info.foo = 1                // or
  user.set('info.foo', 1);   // same idea
```
     
 - Ember data does not know that info attribute changed because it does not track the internal state of that info object

#### changed() method added to models
  -  Shows you any changes in the info object 
    - whether modified or replacing type attribute  

```javascript
                      //    old value, new value      
  user.changed().info //=> [{foo: 1),  {foo: 2)] 
```
   
  - This changed method merges what ember data does ( show changes if you replace the attribute ) 
   with changes when you 'modify' the attribute so either one will show up as a change  


## Installation

* `ember install ember-data-change-tracking`

