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
          name: 'ember-data-2.7',
          npm: {
            devDependencies: {
              'ember-source': '2.11',
              'ember-data': '2.7.0',
              'ember-data-model-fragments': '2.11',
              'ember-inflector': '1.9.4'
            }
          }
        },
        {
          name: 'ember-data-2.8',
          npm: {
            devDependencies: {
              'ember-source': '2.11',
              'ember-data': 'v2.8.1',
              'ember-data-model-fragments': '2.11',
              'ember-inflector': '1.9.4'
            }
          }
        },
        {
          name: 'ember-data-2.10',
          npm: {
            devDependencies: {
              'ember-source': '2.11',
              'ember-data': '2.10.0',
              'ember-data-model-fragments': '2.11'
            }
          }
        },
        {
          name: 'ember-data-3.0',
          npm: {
            devDependencies: {
              'ember-source': '3.0',
              'ember-data': '3.0',
              'ember-data-model-fragments': '3.0.0-beta.1'
            }
          }
        },
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-data': 'emberjs/data#release',
              'ember-source': urls[0],
            }
          }
        },
        {
          name: 'ember-beta',
          npm: {
            devDependencies: {
              'ember-data': 'emberjs/data#beta',
              'ember-source': urls[1],
            }
          }
        },
        {
          name: 'ember-canary',
          npm: {
            devDependencies: {
              'ember-data': 'emberjs/data#canary',
              'ember-source': urls[2],
            }
          }
        }
      ]
    };
  });
};
