(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RouteModalCtrl
   * @description
   * # RouteModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RouteModalCtrl', routeModalCtrl);

  function routeModalCtrl($modalInstance, url, ride, adminService, $timeout) {

    var vm = this;
    
    vm.url = url;
    vm.ride = ride;
    vm.close = closeFn;
    
    function closeFn(){
      $modalInstance.dismiss();
    }
  }
})();
