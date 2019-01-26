import Ember from 'ember';

export const modelTransform = function(model, polymorphic) {
  if (polymorphic) {
    return { id: model.id, type: model.modelName || model.constructor.modelName };
  }
  return model.id;
};

export const relationShipTransform = {
  belongsTo: {
    serialize(model, key, options) {
      let relationship = model.belongsTo(key).belongsToRelationship;
      let value = relationship.hasOwnProperty('inverseRecordData') ? relationship.inverseRecordData: relationship.canonicalState;
      return value && modelTransform(value, options.polymorphic);
    },

    deserialize() {
    }
  },
  hasMany: {
    serialize(model, key, options) {
      let value = model.hasMany(key).value();
      return value && value.map(item => modelTransform(item, options.polymorphic));
    },

    deserialize() {
    }
  }
};

export const isEmpty = function(value) {
  if (Ember.typeOf(value) === 'object') {
    return Ember.$.isEmptyObject(value);
  }
  return Ember.isEmpty(value);
};

export const didSerializedModelChange = function(one, other, polymorphic) {
  if (polymorphic) {
    return one.id !== other.id || one.type !== other.type;
  }
  return one !== other;
};

export const didModelsChange = function(one, other, polymorphic) {
  if (isEmpty(one) && isEmpty(other)) {
    return false;
  }

  if ((one && one.length) !== (other && other.length)) {
    return true;
  }

  for (let i = 0, len = one.length; i < len; i++) {
    if (didSerializedModelChange(one[i], other[i], polymorphic)) {
      return true;
    }
  }

  return false;
};

export const didModelChange = function(one, other, polymorphic) {
  if (isEmpty(one) && isEmpty(other)) {
    return false;
  }

  if (!one && other || one && !other) {
    return true;
  }

  return didSerializedModelChange(one, other, polymorphic);
};
