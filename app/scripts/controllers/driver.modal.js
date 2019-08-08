(function () {

})();
'use strict';

/**
 * @ngdoc function
 * @name neksoFeAdmindashboardApp.controller:DriverModalCtrl
 * @description
 * # DriverModalCtrl
 * Controller of the neksoFeAdmindashboardApp
 */
angular.module('neksoFeAdmindashboardApp')
  .controller('DriverModalCtrl', driverModalCtrl);

function driverModalCtrl($modalInstance, adminService, utilService, blockUI, driver, addSuspicious, rideId) {

  var vm = this;
  vm.loading = false;
  vm.driver = undefined;
  vm.canToAddSuspicious = addSuspicious;
  vm.response = {
    message: undefined,
    icon: undefined
  };
  vm.royal = {
    message: undefined,
    icon: undefined,
    loading: false
  };
  vm.createdSuspicious = false;
  vm.close = closeFn;
  vm.addTag = addTagFn;
  vm.getUserPermission = getUserPermissionFn;
  vm.updateRoyalStatus = updateRoyalStatusFn;

  if (angular.isDefined(driver)) {
    vm.driverHasSuspiciousTag = (driver.tags && driver.tags.indexOf('SUSPICIOUS') === -1);
    getLiveDriverDetailFn(driver.id, rideId);
  }

  function closeFn() {
    if (vm.createdSuspicious) {
      $modalInstance.dismiss();
    } else {
      $modalInstance.close();
    }
  }

  function getLiveDriverDetailFn(driverId, rideId) {

    var myBlock = blockUI.instances.get('liveDriver');
    myBlock.start();
    adminService.getLiveDriverDetail(driverId).then(function (response) {
      vm.driver = response;
      if (angular.isDefined(vm.driver.profilePictureId)) {
        vm.driver.profileImg = adminService.getPictureUrl(vm.driver.profilePictureId, '100x100');
      }
      if (angular.isDefined(vm.driver.carInfo.pictureId)) {
        vm.driver.carInfo.carPictureUrl = adminService.getPictureUrl(vm.driver.carInfo.pictureId, '100x100');
      }
      //Club Nekso
      if (angular.isDefined(vm.driver.currentAchievementPictureId)) {
        vm.driver.clubNeksoImg = adminService.getPictureUrl(vm.driver.currentAchievementPictureId);
      } else {
        vm.driver.clubNeksoImg = 'images/opening_paths.svg';
      }
      vm.pathSourceImageForClubNeksoStar = getPathSourceImageForClubNeksoStarFn(vm.driver.currentAchievementStarCount, vm.driver.currentAchievementLevelCount);

      vm.driver.carInfo.colorName = adminService.findColor(vm.driver.carInfo.color).colorEn;
      if (angular.isDefined(vm.driver.bankAccountInfo)) {
        vm.driver.bankAccountInfo.account = vm.driver.bankAccountInfo.number + ' / ' + vm.driver.bankAccountInfo.typeDescription;
        vm.driver.bankAccountInfo.identification = vm.driver.bankAccountInfo.nationalIdType + '.: ' + vm.driver.bankAccountInfo.nationalIdNumber;
      }
      vm.pathSourceImageForCancelledPercent = utilService.getPathSourceImageForCancelledPercent(vm.driver.cancelledPercentage);
      responseRoyalFn(vm.driver.royalStatus);
      adminService.getLiveDriverLastRide(vm.driver.id, undefined, rideId)
        .then(function (data) {
          vm.lastRide = data;
        });
      myBlock.stop();
    }, function (error) {
      myBlock.stop();
    });
  }

  function getPathSourceImageForClubNeksoStarFn(currentAchievementStarCount, currentAchievementLevelCount) {
    if (angular.isDefined(currentAchievementStarCount) && currentAchievementStarCount > 0 && angular.isDefined(currentAchievementLevelCount)) {
      var level = (currentAchievementLevelCount === 0) ? '_green.svg' : '_red.svg';
      return '/images/star_' + currentAchievementStarCount + level;
    }
    return '';
  }

  function addTagFn() {
    vm.loading = true;
    vm.response = {
      message: undefined,
      icon: undefined
    };
    adminService.addTag(vm.driver.id, 'DRIVER', 'SUSPICIOUS', true).then(function (response) {
      if(angular.isDefined(response)) {
        vm.response.class = 'text-success';
        vm.response.icon = 'check_circle';
        vm.response.message = 'The suspicious behavior tag was added to the user';
        vm.createdSuspicious = true;
      }
      vm.loading = false;
    }, function (error) {
      vm.response.class = 'text-danger';
      vm.response.icon = 'error';
      vm.response.message = "The suspicious behavior tag can't added to the user";
      vm.loading = false;
    });
  }

  function updateRoyalStatusFn() {
    vm.royal = {
      message: undefined,
      icon: undefined,
      loading: true
    };
    var status = 'APPROVED';
    if (angular.isDefined(vm.driver.royalStatus) && vm.driver.royalStatus === 'APPROVED') {
      status = 'SUSPENDED'
    }
    adminService.updateRoyalStatus(vm.driver.id, status).then(function (response) {
      if(angular.isDefined(response)) {
        responseRoyalFn(status);
      }
      vm.royal.loading = false;
      vm.driver.royalStatus = status;
    }, function (error) {
      vm.royal.class = 'text-danger';
      vm.royal.icon = 'error';
      vm.royal.message = "Error";
      vm.royal.loading = false;
    });
  }

  function responseRoyalFn(status) {
    if (status === 'APPROVED') {
      vm.royal.class = 'text-success';
      vm.royal.icon = 'check_circle';
    } else {
      vm.royal.class = 'text-danger';
      vm.royal.icon = 'remove_circle_outline';
    }
    vm.royal.message = status;
  }

  function getUserPermissionFn(code){
    return utilService.getUserPermission(code);
  }
}
