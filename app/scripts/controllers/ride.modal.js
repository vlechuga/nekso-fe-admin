(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RideModalCtrl
   * @description
   * # RideModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RideModalCtrl', rideModalCtrl);

  function rideModalCtrl($modalInstance, ride, adminService, $timeout, utilService) {

    var vm = this;
    var map;
    var rideStates = {
      '': {
        'msg': '',
        'class': ''
      },
      'CANCELLED': {
        'msg': 'Cancelled',
        'class': 'ride-status-cancelled'
      },
      'COMPLETED': {
        'msg': 'Completed',
        'class': 'ride-status-completed'
      },
      'ONGOING': {
        'msg': 'Ongoing',
        'class': 'ride-status-ongoing'
      },
      'REQUESTED': {
        'msg': 'Requested',
        'class': 'ride-status-ongoing'
      },
      'NO_RESPONSE': {
        'msg': 'No Response',
        'class': 'ride-status-cancelled'
      },
      'REJECTED': {
        'msg': 'Rejected',
        'class': 'ride-status-cancelled'
      },
      'CLOSED': {
        'msg': 'Closed',
        'class': 'ride-status-cancelled'
      }
    };
    vm.ride = ride;
    vm.isInvoiceDetails = true;
    vm.isStatusDetails = false;
    vm.isAudienceDetails = false;
    vm.close = closeFn;
    vm.getRideStatus = getRideStatusFn;
    vm.getRideStatusClass = getRideStatusClassFn;
    vm.getGivenRating = getGivenRatingFn;

    vm.viewStatusDetails = viewStatusDetailsFn;
    vm.viewAudienceDetails = viewAudienceDetailsFn;
    vm.back = backFn;

    getLastRide();

    if (angular.isDefined(ride.passenger.cancelledPercentage)) {
      vm.pathSourceImageForCancelledPercentPassenger = utilService.getPathSourceImageForCancelledPercent(ride.passenger.cancelledPercentage);
    }
    if (angular.isDefined(ride.passenger.profilePictureId)) {
      vm.ride.passenger.profileImg = adminService.getPictureUrl(ride.passenger.profilePictureId, '100x100');
    }
    if (angular.isDefined(ride.passenger.currentAchievementPictureId)) {
      vm.ride.passenger.currentAchievementPictureUrl = adminService.getPictureUrl(ride.passenger.currentAchievementPictureId);
    } else {
      vm.ride.passenger.currentAchievementPictureUrl = 'images/explorer.svg';
    }

    adminService.getLiveRideStatusHistory(ride.id).then(function (response) {
      vm.rideStatusHistory = response;
    });

    if (angular.isDefined(ride.driver) ) {
      if(angular.isDefined(ride.driver.profilePictureId)) {
        vm.ride.driver.profileImg = adminService.getPictureUrl(ride.driver.profilePictureId, '100x100');
      }
      if (angular.isDefined(ride.driver.cancelledPercentage)) {
        vm.pathSourceImageForCancelledPercentDriver = utilService.getPathSourceImageForCancelledPercent(ride.driver.cancelledPercentage);
      }
      if (angular.isDefined(ride.driver.currentAchievementPictureId)) {
        vm.ride.driver.currentAchievementPictureUrl = adminService.getPictureUrl(ride.driver.currentAchievementPictureId);
      } else {
        vm.ride.driver.currentAchievementPictureUrl = 'images/opening_paths.svg';
      }

    }

    function closeFn() {
      $modalInstance.dismiss();
    }

    function getRideStatusFn(status) {
      if (!angular.isUndefined(status)) {
        return rideStates[status].msg;
      }
    }

    function getLastRide(){
      if (vm.ride.driver) {
        adminService.getLiveDriverLastRide(vm.ride.driver.id, undefined, vm.ride.id).then(function (data) {
          vm.ride.driver.lastRide=data;
        });
      }
      if (vm.ride.passenger) {
        adminService.getLivePassengerLastRide(vm.ride.passenger.id, undefined, vm.ride.id).then(function (data) {
          vm.ride.passenger.lastRide=data;
        });
      }
    }

    function getRideStatusClassFn(status) {
      if (!angular.isUndefined(status)) {
        return rideStates[status].class;
      }
    }

    function getGivenRatingFn(role) {
      if (!angular.isUndefined(vm.ride.rates)) {
        for (var i in vm.ride.rates) {
          var rating = vm.ride.rates[i];
          if (rating.byRole === role) {
            return rating.rateInfo.rate;
          }
        }
        return 0;
      } else {
        return 0;
      }
    }

    function fixInfoWindow() {
      //Here we redefine set() method.
      //If it is called for map option, we hide InfoWindow, if "noSupress" option isnt true.
      //As Google doesn't know about this option, its InfoWindows will not be opened.
      var set = google.maps.InfoWindow.prototype.set;
      google.maps.InfoWindow.prototype.set = function (key, val) {
        if (key === 'map') {
          if (!this.get('noSupress')) {
            console.log('This InfoWindow is supressed. To enable it, set "noSupress" option to true');
            return;
          }
        }
        set.apply(this, arguments);
      }
    }

    function initMap() {
      fixInfoWindow();
      map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 15,
        center: {
          lat: 10.6638617,
          lng: -71.6020553
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        zoomControl: true,
        draggable: true,
        scrollwheel: false
      });
      var bounds = new google.maps.LatLngBounds();
      var pickupMarker = new google.maps.Marker({
        position: new google.maps.LatLng(ride.pickupLocation.lat, ride.pickupLocation.lon),
        map: map,
        icon: 'images/markers/marker_pickup.png',
        clickable: false
      });
      bounds.extend(pickupMarker.position);
      var destinationMarker = new google.maps.Marker({
        position: new google.maps.LatLng(ride.destinationLocation.lat, ride.destinationLocation.lon),
        map: map,
        icon: 'images/markers/marker_dropoff.png',
        clickable: false
      });
      bounds.extend(destinationMarker.position);
      map.fitBounds(bounds);
    }

    $timeout(function () {
      initMap();
    }, 1);

    $timeout(function () {
      google.maps.event.trigger(map, 'resize');
    }, 100);

    function viewStatusDetailsFn() {
      vm.isInvoiceDetails = false;
      vm.isStatusDetails = true;
      vm.isAudienceDetails = false;
    }
    function viewAudienceDetailsFn() {
      vm.isInvoiceDetails = false;
      vm.isStatusDetails = false;
      vm.isAudienceDetails = true;
    }

    function backFn() {
      vm.isInvoiceDetails = true;
      vm.isAudienceDetails = false;
      vm.isStatusDetails = false;
    }

  }
})();
