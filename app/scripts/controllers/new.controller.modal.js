(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:NewControllerModalCtrl
   * @description
   * # NewControllerModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('NewControllerModalCtrl', newControllerModalCtrl);

  function newControllerModalCtrl($modalInstance, $filter, adminService, ngToast, $timeout, $scope, utilService, countryData) {

    var vm = this;
    var map;
    var marker;
    var pickup_autocomplete;

    vm.modalTitle = 'New controller';
    vm.countryData = countryData;
    vm.country = $filter('filter')(vm.countryData, {'iso': 'VE'})[0];
    vm.loading = {};
    vm.controller = {
      onlyRoyalServiceSupported: false
    };
    vm.ownerPhone = undefined;
    vm.masterPhone = undefined;
    vm.sosPhone = undefined;
    vm.rif = {};
    vm.rif.letter = vm.country.nationalIdTypes[0];
    vm.editable = true;
    vm.new = true;
    vm.address = undefined;
    vm.addressObject = undefined;

    vm.close = closeFn;
    vm.createController = createControllerFn;
    vm.getAddress = getAddressFn;

    $scope.$watch('vm.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        pickup_autocomplete.setComponentRestrictions({'country': vm.country.iso});
        vm.address = undefined;
      }
    });

    function closeFn() {
      $modalInstance.close();
    }

    function createControllerFn() {
      vm.loading.create = true;
      var rif;
      if (vm.country.iso === 'VE') {
        rif = vm.rif.letter ? vm.rif.letter + '-' + vm.rif.number : vm.rif.number;
      } else {
        rif = vm.rif.number;
      }
      var controller = {
        name: vm.controller.name,
        rif: rif,
        masterPhone: vm.country.callingCode + vm.masterPhone,
        firstName: vm.controller.firstName,
        lastName: vm.controller.lastName,
        email: vm.controller.email,
        ownerPhone: vm.country.callingCode + vm.ownerPhone,
        sosPhone: vm.country.callingCode + vm.sosPhone,
        countryInfo: vm.country.iso,
        onlyRoyalServiceSupported: vm.controller.onlyRoyalServiceSupported
      };

      controller.locationInfo = {
        location: marker.getPosition().lat() +','+ marker.getPosition().lng(),
        countryCode: vm.addressObject.countryCode,
        countryName: vm.addressObject.countryName,
        provinceName: vm.addressObject.provinceName,
        cityName: vm.addressObject.cityName,
        localityName: vm.addressObject.localityName,
        address: vm.address
      };

      if (vm.addressObject.localityName) {
        controller.locationInfo.cityName = vm.addressObject.localityName;
      }

      adminService.createController(controller)
        .then(function (data) {
          vm.loading.create = false;
          ngToast.create('A new controller has been created.');
          $modalInstance.dismiss();
        }, function (error) {
          var msg = '';
          if (error.data.code === 602) {
            msg = 'Duplicate email, phone or ' + vm.country.taxId.label;
          }
          vm.loading.create = false;
          ngToast.create({
            className: 'danger',
            content: 'Error creating controller. ' + msg
          });
        });
    }

    function getAddressFn() {
      vm.loading.getAddress = true;
      var address = {};
      adminService.getPlaceByLatLng(marker.getPosition().lat(), marker.getPosition().lng())
        .then(function (results) {
          if (angular.isDefined(results.address_components)) {
            var temp = new StringBuilder();
            var addressComponents = results.address_components;
            for (var i = 0; i < addressComponents.length; i++) {
              for (var j = 0; j < addressComponents[i].types.length; j++) {
                switch (addressComponents[i].types[j]) {
                  case 'premise':
                    address.premise = addressComponents[i].long_name;
                    temp.append(address.premise).append('. ');
                    break;
                  case 'street_number':
                    address.street_number = addressComponents[i].long_name;
                    temp.append(address.street_number).append('. ');
                    break;
                  case 'route':
                    if (addressComponents[i].long_name !== 'Unnamed Road') {
                      address.route = addressComponents[i].long_name;
                      temp.append(address.route).append('. ');
                    }
                    break;
                  case 'sublocality':
                    address.sublocality = addressComponents[i].long_name;
                    temp.append(address.sublocality).append('. ');
                    break;
                  case 'locality':
                    address.localityName = addressComponents[i].long_name;
                    temp.append(address.localityName).append('. ');
                    break;
                  case 'administrative_area_level_2':
                    address.cityName = addressComponents[i].long_name;
                    temp.append(address.cityName).append('. ');
                    break;
                  case 'administrative_area_level_1':
                    address.provinceName = addressComponents[i].long_name;
                    temp.append(address.provinceName).append('. ');
                    break;
                  case 'country':
                    address.countryCode = addressComponents[i].short_name;
                    address.countryName = addressComponents[i].long_name;
                    break;
                }
              }
            }
            vm.address = temp.toString();
            vm.addressObject = address;
            vm.loading.getAddress = false;
          } else {
            vm.loading.getAddress = false;
            ngToast.create({
              className: 'danger',
              content: 'Error getting position details.'
            });
          }
        }, function (error) {
          vm.loading.getAddress = false;
          ngToast.create({
            className: 'danger',
            content: 'Error getting position details.'
          });
        });
    }

    function initMap() {
      map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 15,
        center: {
          lat: 10.6638617,
          lng: -71.6020553
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        zoomControl: true
      });

      marker = new google.maps.Marker({
        position: map.center,
        map: map,
        animation: google.maps.Animation.DROP,
        draggable: true,
        icon: 'images/markers/marker_controller.png'
      });
      marker.addListener('mouseout', function () {
        vm.address = undefined;
      });

      setPickupAutocompleteFn();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          var p = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          map.setCenter(p);
          marker.setPosition(p);
        });
      }
    }

    function expandViewportToFitPlace(map, place) {
      if (marker) {
        marker.setPosition(place.geometry.location);
        marker.setMap(map);
        map.setCenter(marker.getPosition());
        map.setZoom(14);
      } else {
        marker = new google.maps.Marker({
          position: place.geometry.location,
          map: map,
          animation: google.maps.Animation.DROP,
          draggable: true,
          icon: 'images/markers/marker_controller.png'
        });
        map.setCenter(marker.getPosition());
      }
    }

    function setPickupAutocompleteFn() {
      var options = {
        componentRestrictions: {country: vm.country.iso}
      };
      pickup_autocomplete = new google.maps.places.Autocomplete(document.getElementById('field_location'), options);
      pickup_autocomplete.bindTo('bounds', map);
      pickup_autocomplete.addListener('place_changed', function () {
        vm.address = undefined;
        $scope.$apply();
        var place = pickup_autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        expandViewportToFitPlace(map, place);
      });
    }

    $timeout(function () {
      google.maps.event.trigger(map, 'resize');
    }, 100);

    $timeout(function () {
      initMap();
    }, 200);


  }
})();
