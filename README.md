# ember-data-change-tracking

This addon aims to fill in the gaps in the change tracking that ember data does now. 
 - Currently ember-data tracks changes for numbers/strings/date/boolean attribute,
  and has a changeAttributes method to see what changed 
 
 - This addon tracks:
    - modifications in attributes that are object/json
    - replacement of belongsTo association models 
    
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
  let company = //=> company model 
  let company2 = //=> differnt company model 
  let info = {foo: 1) // some object
  let user = //=> user model where info => info  and company => company
```

#### changed() method added to models
  -  Shows you any changes in the info object 
    - whether modified or replacing type attribute  
  - Shows when you replace a belongsTo association
   
Example: ( modify attribute ) 
```javascript
  info.foo = 1                // or
  user.set('info.foo', 1);   // same idea
                      //    old value, new value      
  user.changed().info //=> [{foo: 1),  {foo: 2)] 
```

Example: ( replace attribute ) 
```javascript
  user.set('info', {foo: 2}); 
                      //    old value, new value      
  user.changed().info //=> [{foo: 1),  {foo: 2)] 
```

Example: ( replace belongTo ) 
```javascript
  user.set('company', company2);  
                        //    old value, new value      
  user.changed().company //=> [company,  company2] 
```
   
##### Serialize only changed attrbutes/associations 
  - Mixin is provided that will allow you to remove any attributes/associations
   that did not change from being serialized.
  - Useful when you want to reduce the size of a json payload 
   - removing unchanged values can be big reduction at times
   
 Usage: //file: app/serializers/user.js 
 
 ```javascript
  import DS from 'ember-data';
  import keepOnlyChanged from 'ember-data-change-tracker/mixins/keep-only-changed';
 
  export default DS.RESTSerializer.extend(keepOnlyChanged);
 ```

## Installation

* `ember install ember-data-change-tracking`

