/* eslint-env node */
module.exports = {
  scenarios: [
    {
      name: 'ember-data-2.7',
      bower: {
        devDependencies: {},
        resolutions: {}
      },
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
      bower: {
        devDependencies: {},
        resolutions: {}
      },
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
      bower: {
        devDependencies: {},
        resolutions: {}
      },
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
      bower: {
        devDependencies: {},
        resolutions: {}
      },
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
      bower: {
        devDependencies: {
          'ember': 'components/ember#release'
        },
        resolutions: {
          'ember': 'release'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#release'
        }
      }
    },
    {
      name: 'ember-beta',
      bower: {
        devDependencies: {
          'ember': 'components/ember#beta'
        },
        resolutions: {
          'ember': 'beta'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#beta'
        }
      }
    },
    {
      name: 'ember-canary',
      bower: {
        devDependencies: {
          'ember': 'components/ember#canary'
        },
        resolutions: {
          'ember': 'canary'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#canary'
        }
      }
    }
  ]
};
