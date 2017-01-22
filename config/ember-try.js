/*jshint node:true*/
module.exports = {
  scenarios: [
    {
      name: 'ember-data-2.5',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10'
        },
        resolutions: {
          'ember': '2.10'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#2.5'
        },
        resolutions: {
          'ember-data': '2.5'
        }
      }
    },
    {
      name: 'ember-data-2.8',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10'
        },
        resolutions: {
          'ember': '2.10'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#2.8'
        },
        resolutions: {
          'ember-data': '2.8'
        }
      }
    },
    {
      name: 'ember-data-2.10',
      bower: {
        devDependencies: {
          'ember': 'components/ember#2.10'
        },
        resolutions: {
          'ember': '2.10'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#2.10'
        },
        resolutions: {
          'ember-data': '2.10'
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
        },
        resolutions: {
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
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#beta'
        },
        resolutions: {
          'ember-data': 'beta'
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
        },
        resolutions: {
          'ember-data': 'canary'
        }
      }
    }
  ]
};
