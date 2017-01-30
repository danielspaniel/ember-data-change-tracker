/*jshint node:true*/
module.exports = {
  scenarios: [
    {
      name: 'ember-data-2.7',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10.2'
        },
        resolutions: {
          'ember': '2.10'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': '2.7.0'
        }
      }
    },
    {
      name: 'ember-data-2.8',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10.2'
        },
        resolutions: {
          'ember': '2.10'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'v2.8.1'
        }
      }
    },
    {
      name: 'ember-data-2.10',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10.2'
        },
        resolutions: {
          'ember': '2.10'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': '2.10.0'
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
