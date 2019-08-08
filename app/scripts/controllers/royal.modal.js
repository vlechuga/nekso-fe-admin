(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RoyalModalCtrl
   * @description
   * # RoyalModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RoyalModalCtrl', royalModalCtrl);

  function royalModalCtrl($scope, $modalInstance, driver, adminService) {

    var vm = this;

    vm.driver = driver;
    vm.close = closeFn;
    vm.getCarColor = getCarColorFn;

    function closeFn(){
      $modalInstance.dismiss();
    }

    function getCarColorFn(){
      if(!angular.isUndefined(driver.carInfo.color)){
        var color = adminService.findColor(driver.carInfo.color);
        if(!angular.isUndefined(color)){
          return color.colorEs;
        }else{
          return adminService.findColor('NONE').colorEs;
        }
      }
    }
  }
})();
