/*jshint node:true*/
module.exports = {
  scenarios: [
    {
      name: 'ember-2.5',
      bower: {
        dependencies: {
          'ember': 'components/ember#2.5',
          'ember-data': 'components/ember-data#2.5'
        },
        resolutions: {
          'ember': '2.5',
          'ember-data': '2.5'
        }
      }
    },
    {
      name: 'ember-lts-2.8',
      bower: {
        dependencies: {
          'ember': 'components/ember#lts-2-8',
          'ember-data': 'components/ember-data#lts-2-8'
        },
        resolutions: {
          'ember': 'lts-2-8',
          'ember-data': 'lts-2-8'
        }
      }
    },
    {
      name: 'ember-release',
      bower: {
        dependencies: {
          'ember': 'components/ember#release',
          'ember': 'components/ember-data#release'
        },
        resolutions: {
          'ember': 'release',
          'ember-data': 'release'
        }
      }
    },
    {
      name: 'ember-beta',
      bower: {
        dependencies: {
          'ember': 'components/ember#beta',
          'ember-data': 'components/ember-data#beta'
        },
        resolutions: {
          'ember': 'beta',
          'ember-data': 'beta'
        }
      }
    },
    {
      name: 'ember-canary',
      bower: {
        dependencies: {
          'ember': 'components/ember#canary',
          'ember-data': 'components/ember-data#canary'
        },
        resolutions: {
          'ember': 'canary',
          'ember-data': 'canary'
        }
      }
    }
  ]
};
