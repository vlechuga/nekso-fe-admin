(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:ClubHistoryModalCtrl
   * @description
   * # ClubHistoryModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('ClubHistoryModalCtrl', ClubHistoryModalCtrl);

  function ClubHistoryModalCtrl($scope, $modalInstance, driver, adminService) {

    var vm = this;

    vm.close = closeFn;
    vm.driver = driver;
    vm.driverPictureUrl = adminService.getPictureUrl(driver.profilePictureId);
    vm.carPictureUrl = adminService.getPictureUrl(driver.carInfo.pictureId);
    vm.cancelledPercent = driver.cancelledPercentage;
    vm.pathSourceImageForCancelledPercent = getPathSourceImageForCancelledPercent(vm.cancelledPercent);
    vm.colorName = adminService.findColor(driver.carInfo.color).colorEn;

    adminService.getAchievementHistoryByDriverId(driver.id)
    .then(function(data) {
        vm.history = data;
    });

    adminService.getLiveDriverLastRide(driver.id, undefined, undefined)
      .then(function(data) {
        vm.lastRide = data;
    });

    function closeFn(){
      $modalInstance.dismiss();
    }

    function getPathSourceImageForCancelledPercent(cancelledPercentFromString){
      var cancelledPercent = parseInt(cancelledPercentFromString.replace('%',''));
      var normalizedPercent = 0;
      if(cancelledPercent > 0 && cancelledPercent <= 15) { normalizedPercent = 25; }
      if(cancelledPercent > 0 && cancelledPercent <= 15) { normalizedPercent = 25; }
      if(cancelledPercent > 15 && cancelledPercent <= 50) { normalizedPercent = 50; }
      if(cancelledPercent > 50 && cancelledPercent <= 75) { normalizedPercent = 75; }
      if(cancelledPercent > 75) { normalizedPercent = 100; }
      return '/images/icon-'+ normalizedPercent +'-percent-cancelled.svg';
    }

  }
})();
