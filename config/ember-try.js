/*jshint node:true*/
module.exports = {
  scenarios: [
    {
      name: 'ember-data-2.5',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10',
          'ember-data': 'components/ember-data#2.5'
        },
        resolutions: {
          'ember': '2.10',
          'ember-data': '2.5'
        }
      }
    },
    {
      name: 'ember-data-2.8',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10',
          'ember-data': 'components/ember-data#2.8'
        },
        resolutions: {
          'ember': '2.10',
          'ember-data': '2.8'
        }
      }
    },
    {
      name: 'ember-data-2.10',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10',
          'ember-data': 'components/ember-data#2.10'
        },
        resolutions: {
          'ember': '2.10',
          'ember-data': '2.10'
        }
      }
    },
    {
      name: 'ember-release',
      bower: {
        devDependencies: {
          'ember': 'components/ember#release',
          'ember-data': 'components/ember-data#release'
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
        devDependencies: {
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
        devDependencies: {
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
