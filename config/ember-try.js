/* eslint-env node */
'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary'),
  ]).then(urls => {
    return {
      useYarn: true,
      scenarios: [
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-data': 'release',
              'ember-source': urls[0],
            }
          }
        },
        {
          name: 'ember-3.8',
          npm: {
            devDependencies: {
              'ember-data': '3.8.0',
              'ember-source': '3.8.0',
            }
          }
        },
        {
          name: 'ember-beta',
          npm: {
            devDependencies: {
              'ember-data': 'beta',
              'ember-source': urls[1],
            }
          }
        },
        {
          name: 'ember-canary',
          npm: {
            devDependencies: {
              'ember-data': 'canary',
              'ember-source': urls[2],
            }
          }
        }
      ]
    };
  });
};
