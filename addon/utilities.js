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
      let value = relationship.state.hasReceivedData ? relationship.localState: relationship.remoteState;
      return value && modelTransform(value, options.polymorphic);
    },

    deserialize() {
    }
  },
  hasMany: {
    serialize(model, key, options) {
      let relationship = model.hasMany(key).hasManyRelationship;
      let value = relationship.localState;
      return value && value.map(item => modelTransform(item, options.polymorphic));
    },

    deserialize() {
    }
  }
};

export const relationshipKnownState = {
  belongsTo: {
    isKnown(model, key) {
      let belongsTo = model.belongsTo(key);
      let relationship = belongsTo.belongsToRelationship;
      return !relationship.state.isStale;
    }
  },
  hasMany: {
    isKnown(model, key) {
      let hasMany = model.hasMany(key);
      let relationship = hasMany.hasManyRelationship;
      return !relationship.state.isStale;
    }
  }
};

export const isEmpty = function(value) {
  if (Ember.typeOf(value) === 'object') {
    return Object.keys(value).length === 0;
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
