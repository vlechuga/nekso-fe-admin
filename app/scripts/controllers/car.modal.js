(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CarModalCtrl
   * @description
   * # CarModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CarModalCtrl', carModalCtrl);

  function carModalCtrl($scope, $modalInstance, driver, adminService) {

    var vm = this;

    vm.carInfo = driver.carInfo;
    vm.carInfo.carImg = '';
    vm.close = closeFn;
    vm.getCarColor = getCarColorFn;

    if(!angular.isUndefined(driver.carInfo.pictureId)){
      vm.carInfo.carImg = adminService.getPictureUrl(driver.carInfo.pictureId, '100x100');
    }else{
      vm.carInfo.carImg = 'images/bg-profile-car.png';
    }

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
