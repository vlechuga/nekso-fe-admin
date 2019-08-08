(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.directive:loadScripts
   * @description
   * # loadScripts
   * Directive of the neksoDashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .directive('loadScripts', loadScriptsFn);

  function loadScriptsFn($timeout, GOOGLE_API_KEY){
    var injectScript = function(element) {
      var googleApisScriptTag = angular.element(document.createElement('script'));
      googleApisScriptTag.attr('src', 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_API_KEY + '&libraries=places,visualization');
      element.append(googleApisScriptTag);

      delay();
      function delay() {
        if (!window.google) {
          $timeout(delay, 100);
          return true;
        }
        var gmapsHeatmapScriptTag = angular.element(document.createElement('script'));
        gmapsHeatmapScriptTag.attr('src', 'scripts/gmaps-heatmap.js');
        element.append(gmapsHeatmapScriptTag);
      }
    };

    return {
      link: function(scope, element) {
        injectScript(element);
      }
    };
  }

})();
