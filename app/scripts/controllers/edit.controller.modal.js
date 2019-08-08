(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:EditControllerModalCtrl
   * @description
   * # EditControllerModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('EditControllerModalCtrl', editControllerModalCtrl);

  function editControllerModalCtrl($modalInstance, $filter, adminService, ngToast, $timeout, $scope, controller, utilService, getUserPermission, countryData) {

    var vm = this;
    var map;
    var marker;
    var pickup_autocomplete;
    vm.modalTitle = 'Controller profile';
    vm.loading = {};
    vm.countryData = countryData;
    vm.originController= angular.copy(controller);
    vm.getUserPermission = getUserPermission;
    vm.editable = false;
    vm.new = false;

    vm.close = closeFn;
    vm.setEditable = setEditableFn;
    vm.removeEditable = removeEditableFn;
    vm.editController = editControllerFn;
    vm.getAddress = getAddressFn;

    $timeout(function () {
      load(controller);
      initMap();
    }, 100);

    $timeout(function () {
      google.maps.event.trigger(map, 'resize');
    }, 200);

    $scope.$watch('vm.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        pickup_autocomplete.setComponentRestrictions({'country': vm.country.iso});
      }
    });

    function load(controller) {
      vm.controller = controller;
      vm.country = $filter('filter')(vm.countryData, {'iso': vm.controller.countryInfo.iso})[0];
      vm.ownerPhone = controller.ownerPhone.replace(vm.country.callingCode, '');
      vm.masterPhone = controller.masterPhone.replace(vm.country.callingCode, '');
      vm.sosPhone = controller.sosPhone.replace(vm.country.callingCode, '');
      vm.addressObject = undefined;
      vm.rif = {
        letter: controller.rif.split('-')[0],
        number: controller.rif.replace(/^\D-/, '')
      };
      if (angular.isDefined(controller.locationInfo)) {
        vm.address = controller.locationInfo.address;
        vm.addressObject = controller.locationInfo;
      }
    }

    function closeFn() {
      $modalInstance.close();
    }

    function setEditableFn() {
      vm.editable = true;
      marker.setDraggable(true);
    }

    function removeEditableFn() {
      vm.editable = false;
      marker.setDraggable(false);
      $timeout(function () {
        load(angular.copy(vm.originController));
        var array = controller.locationInfo.location.split(',');
        map.setCenter({lat: parseFloat(array[0]), lng: parseFloat(array[1])});
        marker.setPosition({lat: parseFloat(array[0]), lng: parseFloat(array[1])});
      }, 10);
    }

    function editControllerFn() {
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
        location: marker.getPosition().lat() + ',' + marker.getPosition().lng(),
        countryCode: vm.addressObject.countryCode,
        countryName: vm.addressObject.countryName,
        provinceName: vm.addressObject.provinceName,
        cityName: vm.addressObject.cityName,
        localityName: vm.addressObject.localityName,
        address: vm.address
      };

      adminService.editController(vm.controller.id, controller)
        .then(function (data) {
          vm.loading.create = false;
          ngToast.create('Controller profile updated.');
          vm.editable = false;
          $modalInstance.dismiss();
        }, function (error) {
          var msg = '';
          vm.loading.create = false;
          if (error.data.code === 602) {
            msg = 'Duplicate email, phone or ' + vm.country.taxId.label;
          }
          ngToast.create({
            className: 'danger',
            content: 'Error updating controller. ' + msg
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
      var array = vm.controller.locationInfo.location.split(',');
      map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        zoomControl: true
      });

      marker = new google.maps.Marker({
        map: map,
        animation: google.maps.Animation.DROP,
        icon: 'images/markers/marker_controller.png'
      });
      marker.addListener('mouseout', function () {
        if (vm.editable) {
          vm.address = undefined;
        }
      });

      setPickupAutocompleteFn();
      map.setCenter({lat: parseFloat(array[0]), lng: parseFloat(array[1])});
      marker.setPosition({lat: parseFloat(array[0]), lng: parseFloat(array[1])});
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
  }
})();
