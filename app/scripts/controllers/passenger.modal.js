(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PassengerModalCtrl
   * @description
   * # PassengerModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PassengerModalCtrl', passengerModalCtrl);

  function passengerModalCtrl($scope, $modalInstance, blockUI, adminService, utilService, passenger, addSuspicious, rideId) {

    var vm = this;
    vm.loading = false;
    vm.passenger = undefined;
    vm.canToAddSuspicious = addSuspicious;
    vm.response = {
      message: undefined,
      icon: undefined
    };
    vm.createdSuspicious = false;
    vm.close = closeFn;
    vm.addTag = addTagFn;
    vm.getUserPermission = getUserPermissionFn;

    if(angular.isDefined(passenger)) {
      vm.passengerHasSuspiciousTag = (passenger.tags && passenger.tags.indexOf('SUSPICIOUS') === -1);
      getLivePassengerDetailFn(passenger.id, rideId);
    }

    function closeFn() {
      if (vm.createdSuspicious) {
        $modalInstance.dismiss();
      } else {
        $modalInstance.close();
      }
    }

    function getLivePassengerDetailFn(passengerId, rideId) {
        var myBlock = blockUI.instances.get('livePassenger');
        myBlock.start();
        adminService.getLivePassengerDetail(passengerId).then(function (response) {
          vm.passenger = response;
          if (angular.isDefined(vm.passenger.profilePictureId)) {
            vm.passenger.profileImg = adminService.getPictureUrl(vm.passenger.profilePictureId, '100x100');
          }
          //Club Nekso
          if (angular.isDefined(vm.passenger.currentAchievementPictureId)) {
            vm.passenger.clubNeksoImg = adminService.getPictureUrl(vm.passenger.currentAchievementPictureId);
          } else {
            vm.passenger.clubNeksoImg = 'images/explorer.svg';
          }
          vm.pathSourceImageForClubNeksoStar = getPathSourceImageForClubNeksoStarFn(vm.passenger.currentAchievementStarCount, vm.passenger.currentAchievementLevelCount);

          vm.pathSourceImageForCancelledPercent = utilService.getPathSourceImageForCancelledPercent(vm.passenger.cancelledPercentage);
          adminService.getLivePassengerLastRide(vm.passenger.id, undefined, rideId)
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
      vm.loading=true;
      vm.response = {
        message: undefined,
        icon: undefined
      };
      adminService.addTag(vm.passenger.id, 'PASSENGER', 'SUSPICIOUS', true).then(function (response) {
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

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

  }
})();

