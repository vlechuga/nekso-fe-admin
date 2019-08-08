'use strict';

/**
 * @ngdoc function
 * @name neksoDashboardApp.controller:PriceCalculatorCtrl
 * @description
 * # PriceCalculatorCtrl
 * Controller of the neksoDashboardApp
 */
angular.module('neksoFeAdmindashboardApp')
  .controller('PriceCalculatorCtrl', function($scope, adminService, ngToast, $timeout) {


    mainDelay();
    function mainDelay() {
      if (!window.google) {
        $timeout(mainDelay, 100);
        return true;
      }


    $scope.loading = {};
    $scope.drag = false;
    $scope.calculatedPrices = [];

    $scope.origin = {};
    $scope.destination = {};
    $scope.cost = {};
    $scope.cost.total = '0';
    $scope.distance = {};
    $scope.distance.total = '0';

    $scope.pricingSchema = {};
    $scope.pricingSchema.base="minus";
    $scope.pricingSchema.baseMinus_val="0";
    $scope.pricingSchema.basePlus_val="0";
    $scope.pricingSchema.night="t1";
    $scope.pricingSchema.nightT1_val="0";
    $scope.pricingSchema.nightT2_val="0";
    $scope.pricingSchema.weekend="t1";
    $scope.pricingSchema.weekendT1_val="0";
    $scope.pricingSchema.weekendT2_val="0";

    $scope.variables = {};
    $scope.variables.weekend = false;
    $scope.variables.night = false;
    $scope.showResultPanel = true;

    initMap();

    function initMap() {
      var origin_place_id = null;
      var destination_place_id = null;
      var bangalore = {lat: 10.6638617, lng: -71.6020553};

      var map = new google.maps.Map(document.getElementById('map'), {
        mapTypeControl: false,
        center: bangalore,
        disableDefaultUI: true,
        zoomControl: true,
        zoom: 13
      });

      var travel_mode = google.maps.TravelMode.DRIVING;
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer;
      directionsDisplay.setMap(map);
      directionsDisplay.setOptions({
        draggable: true
      });

      directionsDisplay.addListener('directions_changed', function () {
        var last = directionsDisplay.getDirections().routes[0].overview_path.length;
        var origin = directionsDisplay.getDirections().routes[0].overview_path[0];
        var destination = directionsDisplay.getDirections().routes[0].overview_path[last - 1];

        $scope.origin.lat = origin.lat();
        $scope.origin.lng = origin.lng();
        $scope.destination.lat = destination.lat();
        $scope.destination.lng = destination.lng();
        if ($scope.drag==false) {
          $scope.drag=true;
        } else {
          document.getElementById('origin-input').value = directionsDisplay.getDirections().routes[0].legs[0].start_address;
          document.getElementById('destination-input').value = directionsDisplay.getDirections().routes[0].legs[0].end_address;
        }
        requestSavings();
        $scope.$apply();
      });

      var origin_input = document.getElementById('origin-input');
      var destination_input = document.getElementById('destination-input');

      var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
      origin_autocomplete.bindTo('bounds', map);
      var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
      destination_autocomplete.bindTo('bounds', map);

      // Autocomplete.
      function expandViewportToFitPlace(map, place) {
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }
      }

      origin_autocomplete.addListener('place_changed', function () {
        var place = origin_autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        expandViewportToFitPlace(map, place);
        $scope.drag=false;

        // If the place has a geometry, store its place ID and route if we have
        // the other place ID
        origin_place_id = place.place_id;
        route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
      });

      destination_autocomplete.addListener('place_changed', function () {
        var place = destination_autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        expandViewportToFitPlace(map, place);
        $scope.drag=false;

        // If the place has a geometry, store its place ID and route if we have
        // the other place ID
        destination_place_id = place.place_id;
        route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
      });

      function route(origin_place_id, destination_place_id, travel_mode,
                     directionsService, directionsDisplay) {
        if (!origin_place_id || !destination_place_id) {
          return;
        }
        directionsService.route({
          origin: {
            'placeId': origin_place_id
          },
          destination: {
            'placeId': destination_place_id
          },
          travelMode: travel_mode
        }, function (response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
      }
    }

    $scope.clearTest = function () {
      $scope.origin = {};
      $scope.destination = {};
      $scope.cost.total = '0';
      $scope.distance.total = '0';
      document.getElementById('origin-input').value = '';
      document.getElementById('destination-input').value = '';
      initMap();
    };

    $scope.clearTable = function () {
      $scope.calculatedPrices = [];
    };

    function requestSavings() {
      var data = {};
      data.origin = $scope.origin.lat.toFixed(4) + ',' + $scope.origin.lng.toFixed(4);
      data.destination = $scope.destination.lat.toFixed(4) + ',' + $scope.destination.lng.toFixed(4);

      $scope.loading.cleanTest = true;
      var d = new Date();
      d.setHours(10);
      d.setMinutes(0);
      d.setSeconds(0);

      if ($scope.variables.weekend) {
        var distance = 6 - d.getDay();
        d.setDate(d.getDate() + distance);
      } else{
        d.setDate(2);
      }
      if ($scope.variables.night) {
        d.setHours(22);
        d.setMinutes(0);
        d.setSeconds(0);
      }
      data.date = d.getTime();
      data.date = moment(data.date).format();
      adminService.testPricingSchema(data, getPricingDataObject())
        .then(function(data) {
          $scope.cost.total = data.total + ' ' + data.currency;
          $scope.loading.cleanTest = false;
          $scope.distance.total = data.distanceInMeters / 1000;
        }, function(error) {
          console.log(error);
          ngToast.create({
            className: 'danger',
            content: 'No hemos podido procesar la solicitud.'
          });
          $scope.loading.cleanTest = false;
        });
    }

    function getPricingDataObject() {
      return {
        'variantRatio': $scope.pricingSchema.base == 'plus' ? (parseInt($scope.pricingSchema.basePlus_val) / 100) : ((parseInt($scope.pricingSchema.baseMinus_val) / 100) * -1),
        'nightRatio': $scope.pricingSchema.night == 't2' ? (parseInt($scope.pricingSchema.nightT2_val) / 100) : 0,
        'nightFixedAmount': $scope.pricingSchema.night == 't1' ? parseInt($scope.pricingSchema.nightT1_val) : 0,
        'weekendRatio': $scope.pricingSchema.weekend == 't2' ? (parseInt($scope.pricingSchema.weekendT2_val) / 100) : 0,
        'weekendFixedAmount': $scope.pricingSchema.weekend == 't1' ? parseInt($scope.pricingSchema.weekendT1_val) : 0,
        'holidayRatio': 0,
        'holidayFixedAmount': 0
      };

      // return {
      //   'minimumPrice': $scope.pricingSchema.minimumPrice * 1,
      //   'meterPrice': ($scope.pricingSchema.kilometerPrice * 1) / 1000,
      //   'secondPrice': (($scope.pricingSchema.hourPrice * 1) / 60) / 60,
      //   'nightRatio': ($scope.pricingSchema.nightRatio * 1) / 100,
      //   'nightFixedAmount': (($scope.pricingSchema.nightFixedAmount * 1) * 1),
      //   'weekendRatio': ($scope.pricingSchema.weekendRatio * 1) / 100,
      //   'weekendFixedAmount': ($scope.pricingSchema.weekendFixedAmount * 1),
      //   'holidayRatio': ($scope.pricingSchema.holidayRatio * 1) / 100,
      //   'holidayFixedAmount': ($scope.pricingSchema.holidayFixedAmount * 1),
      //   'interurbanRatio': ($scope.pricingSchema.interurbanRatio * 1) / 100,
      //   'interurbanFixedAmount': ($scope.pricingSchema.interurbanFixedAmount * 1),
      //   'currency': $scope.pricingSchema.currency
      // };
    }

    $scope.addPrice = function () {
      var origin_input = document.getElementById('origin-input');
      var destination_input = document.getElementById('destination-input');
      var calculatedPrice = {};
      calculatedPrice.origin = origin_input.value;
      calculatedPrice.destination = destination_input.value;
      calculatedPrice.price = $scope.cost.total;
      calculatedPrice.distance =  $scope.distance.total;
      $scope.calculatedPrices.push(calculatedPrice);
    };

    $scope.exportToCsvFn = function () {
      var toExport = [];
      for(var i = 0, len = $scope.calculatedPrices.length; i < len; i++) {
        var calculatedPrice = $scope.calculatedPrices[i];
        var tmp = {};
        tmp.origin = calculatedPrice.origin;
        tmp.destination = calculatedPrice.destination;
        tmp.price = calculatedPrice.price;
        tmp.distance = calculatedPrice.distance;
        toExport.push(tmp);
      }
      return toExport;
    };
  }

  });
