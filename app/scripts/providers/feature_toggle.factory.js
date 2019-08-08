'use strict';

function featureToggleFactory() {

  var environment = "production";

  var featureToogle = {
    category: {
      alpha: true,
      beta: true,
      production: true
    },
    distance: {
      alpha: true,
      beta: true,
      production: true
    },
    specificSchedule: {
      alpha: true,
      beta: true,
      production: true
    },
    excludeArea: {
      alpha: false,
      beta: false,
      production: false
    }
  };

  return {
    isFeatureEnabled: function (key) {
      return (featureToogle[key]) ? featureToogle[key][environment] : false;
    }
  };
}

angular.module('neksoFeAdmindashboardApp')
  .factory('featureToggleFactory', featureToggleFactory);
