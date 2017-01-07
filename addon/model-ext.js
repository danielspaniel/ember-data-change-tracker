import Ember from 'ember';
import Model from 'ember-data/model';
const { isEmpty } = Ember;

Model.reopen({
  /**
   * Return string or undefined
   *
   * @param key
   */
  currentObjectAttibuteValue(key) {
    let value = this.get(key);
    if (value) {
      if (value instanceof Model) {
        return value;
      }
      value = value.toJSON ? value.toJSON() : value;
      return JSON.stringify(value);
    }
  },

  lastAttributeValue(key) {
    return this.get(this.saveObjectValueKey(key));
  },

  saveObjectValueKey(key) {
    return `last-${key.replace('.', '-').dasherize()}`;
  },

  saveRelationshipAttribute(key) {
    this.set(this.saveObjectValueKey(key), this.get(key));
  },

  saveObjectAttribute(key) {
    this.set(this.saveObjectValueKey(key), this.currentObjectAttibuteValue(key));
  },

  valuesEqual(value1, value2) {
    return (value1 && value1.toString()) === (value2 && value2.toString());
  },

  valuesChanged(value1, value2) {
    let valuesBlank = isEmpty(value1) && isEmpty(value2);
    return !(valuesBlank || this.valuesEqual(value1, value2));
  },

  didAttributeChange(key) {
    return this.valuesChanged(
      this.currentObjectAttibuteValue(key), 
      this.lastAttributeValue(key)
    );
  },
});