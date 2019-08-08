(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.directive:notAuthorized
   * @description
   * # notAuthorized
   * Directive of the neksoDashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .directive('notAuthorized', notAuthorized);

  function notAuthorized() {
    return {
      templateUrl: 'views/not-authorized.html',
      transclude: true,
      // replace: true,
      scope: {
        message:'='
      }
    };
  }
})();
