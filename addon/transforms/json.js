import Transform from "ember-data/transform";
/**
 * This transform does not serializes to string,
 * with JSON.stringify, but leaves the object as is.
 *
 * The data often does not need to be stringified
 * so it's a valid case
 */
export default Transform.extend({
  serialize: function(value) {
    return value;
  },

  deserialize: function(json) {
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
    return json;
  }
});