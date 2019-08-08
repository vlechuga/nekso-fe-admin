/**
 * Created by abarazarte on 22/06/16.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:NewPromotionCtrl
   * @description
   * # NewPromotionCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('NewPromotionCtrl', newPromotionCtrl);
  function newPromotionCtrl(
    $scope,
    $timeout,
    $location,
    $filter,
    utilService,
    adminService,
    ngToast,
    SHARE_PROMOTION_PATH,
    featureToggleFactory,
    promotionsService) {
    if (utilService.getUserPermissionBase('create:promotions')) {
      return true;
    }

    var vm = this;

    var map;
    vm.polygons = [];
    var lat = 10.6638617;
    var lng = -71.6020553;
    var location_autocomplete = undefined;

    vm.featureToggle = featureToggleFactory;
    vm.promotionService = promotionsService;

    vm.submitted = false;
    vm.roles = [];
    vm.countries = [];
    vm.countryStates = [];
    vm.corporates = [];
    vm.allSelected = false;

    vm.distanceOption = '';
    vm.distanceChecked = false;
    vm.distance = {
      from: undefined,
      to: undefined
    };

    vm.isSpecificScheduleChecked = false;
    vm.specificScheduleArray = promotionsService.addRangeForSpecificSchedule([]);

    vm.cancellationRateOption = '';
    vm.cancellationRateChecked = false;
    vm.cancellationRate = {
      from: undefined,
      to: undefined
    };

    vm.categoryOption = '';
    vm.isSystemCategory = false;

    vm.minPublishDate = moment().hours(0).minutes(0).seconds(0).milliseconds(0);

    vm.promotion = {
      type: 'AMOUNT',
      validity: {
        publishAt: moment().add(10, 'minutes').seconds(0).milliseconds(0).toDate(),
        from: moment().add(20, 'minutes').seconds(0).milliseconds(0).toDate(),
        to: moment().hours(23).minutes(59).seconds(59).milliseconds(0).toDate()
      },
      english: {
        notification: {
          announce: "Nekso will soon have a new promotion, check out the rewards section and don't miss it!",
          activation: "Don't miss today's Nekso promotion, go right now to the rewards section!"
        }
      },
      spanish: {
        notification: {
          announce: '\u00A1Pronto Nekso tendr\u00E1 una nueva promoci\u00F3n, revisa la secci\u00F3n de recompensas y no te la pierdas!',
          activation: '\u00A1No te pierdas la promoci\u00F3n del d\u00EDa de Nekso! \u00A1Ve ya a la secci\u00F3n de recompensas!'
        }
      },
      criteria: {
        locationType: 'BOTH',
        usagePerUser: 1
      }
    };

    vm.locationType = 'ANYWHERE';
    vm.role = 'DRIVER';
    vm.promotionValidity = 'PROMOTION_END';
    vm.sendAnnounceNotificacion = false;
    vm.sendActivationNotificacion = false;

    vm.specificTime = false;

    vm.forFirstRide = false;
    vm.hidden = false;
    vm.addCorporation = false;
    vm.rideInterval = false;
    vm.locationCriteria = undefined;

    vm.additionalParameters = [];
    vm.filter = {};
    vm.isHighPriority = false;
    vm.isCouponCode = false;

    vm.dateTimeOptions = {
      parentEl: '.add-promotion',
      timePicker: true,
      singleDatePicker: true,
      startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
      endDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
      opens: "left",
      drops: "down",
      locale: {
        applyClass: 'btn-green',
        applyLabel: "Apply",
        format: "DD/MM/YYYY hh:mm A",
        cancelLabel: 'Cancel'
      }
    };

    vm.dateTimeforPublishAtInput = Object.assign({}, vm.dateTimeOptions);
    vm.dateTimeforPublishAtInput.startDate = vm.promotion.validity.publishAt;
    vm.dateTimeforPublishAtInput.endDate = vm.dateTimeforPublishAtInput.startDate;

    vm.dateTimeforFromInput = Object.assign({}, vm.dateTimeOptions);
    vm.dateTimeforFromInput.startDate = vm.promotion.validity.from;
    vm.dateTimeforFromInput.endDate = vm.dateTimeforFromInput.startDate;

    vm.dateTimeforToInput = Object.assign({}, vm.dateTimeOptions);
    vm.dateTimeforToInput.startDate = vm.promotion.validity.to;
    vm.dateTimeforToInput.endDate = vm.dateTimeforToInput.startDate;

    vm.clear = clearFn;
    vm.createPromotion = createPromotionFn;
    vm.resetPolygon = resetPolygonFn;
    vm.toggleRole = toggleRoleFn;
    vm.addPolygon = addPolygonFn;
    vm.removePolygon = removePolygonFn;

    vm.addFilter = addFilterFn;
    vm.removeFilter = removeFilterFn;
    vm.containsFilter = containsFilterFn;
    vm.cleanFieldCouponCode = cleanFieldCouponCodeFn;
    vm.generateCode = generateCodeFn;
    vm.addRangeForSpecificSchedule = addRangeForSpecificScheduleFn;
    vm.removeRangeForSpecificSchedule = removeRangeForSpecificScheduleFn;

    $scope.$watch('vm.promotion.validity.publishAt', validateStartDateFn);
    $scope.$watch('vm.promotion.validity.from', validateStartDateFn);
    $scope.$watch('vm.promotion.validity.to', validateStartDateFn);
    $scope.$watch('vm.categoryOption', handleWatchCategoryOptionFn);

    if (vm.featureToggle.isFeatureEnabled('distance')) {
      $scope.$watch('vm.distance.to', validateDistanceRangeFn);
    }

    $scope.$watch('vm.locationType', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (vm.locationType === 'AREA') {
          if (angular.isDefined(vm.promotion.criteria.country)) {
            $timeout(initMap, 100);
          }
          else {
            ngToast.create({
              className: 'danger',
              content: 'Please select the country.'
            });
            vm.locationType = 'ANYWHERE';
          }
        }
      }
    });

    $scope.$watch('vm.promotion.criteria.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(newVal)) {
          getCountryStatesFn(JSON.parse(newVal).iso);
          if (angular.isDefined(location_autocomplete)) {
            location_autocomplete.setComponentRestrictions({
              country: JSON.parse(newVal).iso.toLowerCase()
            });
          }
        }
      }
    });

    $scope.$watch('vm.role', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(newVal)) {
          vm.filter = {};
          vm.isHighPriority = false;
          vm.forFirstRide = false;
          vm.addCorporation = false;
          vm.categoryOption = '';
          vm.isCouponCode = false;
          vm.usagePerUser = false;
          vm.rideInterval = false;
          vm.isHidden = false;
          vm.ignoreSuspicious = false;
          if (vm.role === 'DRIVER') {
            vm.promotion.type = 'AMOUNT';
          }
        }
      }
    });

    $scope.$watch('vm.addCorporation', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(newVal) && newVal) {
          getCorporatesFn();
        }
      }
    });

    $scope.$watch('[vm.distanceOption, vm.distanceChecked]', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.distance = {
          from: undefined,
          to: undefined
        };
      }
    });

    $scope.$watch('[vm.cancellationRateOption, vm.cancellationRateChecked]', function(newVal, oldVal) {
      if (newVal !== oldVal) {
        if(angular.isDefined(newVal)) {
          vm.cancellationRate = {
            from: undefined,
            to: undefined
          };
        }
      }
    });

    getCountriesFn();

    function createPromotionFn(existErrors) {
      vm.submitted = true;
      if (!existErrors) {
        vm.loading = true;
        if (!vm.file) {
          ngToast.create({
            className: 'danger',
            content: 'Please upload promotion image.'
          });
          vm.loading.create = false;
          return;
        }

        var publishAtDate = (!moment.isMoment(vm.promotion.validity.publishAt)) ?
          moment(vm.promotion.validity.publishAt).toDate() :
          vm.promotion.validity.publishAt.toDate();
        var fromDate = (!moment.isMoment(vm.promotion.validity.from)) ?
          moment(vm.promotion.validity.from).toDate() :
          vm.promotion.validity.from.toDate();
        var toDate = (!moment.isMoment(vm.promotion.validity.to)) ?
          moment(vm.promotion.validity.to).toDate() :
          vm.promotion.validity.to.toDate();

        var tmp = {
          descriptions: [],
          validity: {
            from: utilService.toStringDate(moment(fromDate)),
            to: utilService.toStringDate(moment(toDate)),
            publishAt: utilService.toStringDate(moment(publishAtDate))
          },
          type: vm.promotion.type,
          value: vm.promotion.value,
          code: angular.copy(vm.promotion.code),
          criteria: {
            roles: [],
            country: JSON.parse(vm.promotion.criteria.country),
            locationType: vm.promotion.criteria.locationType,
            ignoreSuspicious: false
          }
        };

        if (vm.promotion.criteria.states.length > 0) {
          tmp.criteria.states = [];
          for (var i = 0; i < vm.promotion.criteria.states.length; i++) {
            if (typeof vm.promotion.criteria.states[i] === 'object') {
              tmp.criteria.states.push(vm.promotion.criteria.states[i]);
            }
            else {
              tmp.criteria.states.push(JSON.parse(vm.promotion.criteria.states[i]));
            }
          }
        }

        if (vm.role === 'DRIVER' || vm.role === 'PASSENGER' || vm.role === 'CORPORATE') {
          tmp.criteria.roles.push(vm.role);
        } else if(vm.role === 'CORPORATE_GUESTS' || vm.role === 'CORPORATE_EMPLOYEES'){
          tmp.criteria.roles.push('PASSENGER');
          tmp.criteria.sources = [vm.role];
        }

        var enDescription = {
          language: 'EN',
          name: vm.promotion.english.name,
          shortDescription: vm.promotion.english.shortDescription,
          description: vm.promotion.english.description,
          share: {
            title: vm.promotion.english.share.title,
            baseContent: vm.promotion.english.share.content,
            url: SHARE_PROMOTION_PATH.EN
          },
          notifications: []
        };

        var esDescription = {
          language: 'ES',
          name: vm.promotion.spanish.name,
          shortDescription: vm.promotion.spanish.shortDescription,
          description: vm.promotion.spanish.description,
          share: {
            title: vm.promotion.spanish.share.title,
            baseContent: vm.promotion.spanish.share.content,
            url: SHARE_PROMOTION_PATH.ES
          },
          notifications: []
        };

        if (vm.sendAnnounceNotificacion) {
          enDescription.notifications.push({
            status: 'NOT_STARTED',
            content: vm.promotion.english.notification.announce,
            notifiable: vm.sendAnnounceNotificacion
          });
          esDescription.notifications.push({
            status: 'NOT_STARTED',
            content: vm.promotion.spanish.notification.announce,
            notifiable: vm.sendAnnounceNotificacion
          });
        }

        if (vm.sendActivationNotificacion) {
          enDescription.notifications.push({
            status: 'ACTIVE',
            content: vm.promotion.english.notification.activation,
            notifiable: vm.sendActivationNotificacion
          });
          esDescription.notifications.push({
            status: 'ACTIVE',
            content: vm.promotion.spanish.notification.activation,
            notifiable: vm.sendActivationNotificacion
          });
        }

        tmp.descriptions.push(enDescription);
        tmp.descriptions.push(esDescription);

        if (vm.locationType === 'AREA') {
          var location = [];
          for (var i = 0; i < vm.polygons.length; i++) {
            var polygon = vm.polygons[i];
            var polygonCoordinates = [];
            for (var j = 0; j < polygon.getPath().getLength(); j++) {
              var position = polygon.getPath().getAt(j).toUrlValue(5).split(',');
              polygonCoordinates.push([position[0], position[1]]);
            }
            location.push(polygonCoordinates);
          }

          tmp.criteria.location = location;
        }

        if (vm.usagePerUser) {
          tmp.criteria.usagePerUser = angular.copy(vm.promotion.criteria.usagePerUser);
        }

        if (vm.forFirstRide) {
          tmp.criteria.completedRides = 0;
        }

        if (vm.addCorporation) {
          tmp.alliedCorporations = vm.promotion.alliedCorporation.map(function (corporation) {
            return {
              id: corporation
            };
          });
        }

        if (vm.rideInterval) {
          tmp.criteria.completedRidesDuringValidity = angular.copy(vm.promotion.criteria.completedRidesDuringValidity)
        }

        if (vm.promotionValidity === 'GIVEN_DAYS') {
          tmp.validity.expireDays = angular.copy(vm.promotion.validity.expireDays);
        }

        if (vm.isHighPriority) {
          tmp.highPriority = vm.isHighPriority;
        }

        if (vm.isHidden) {
          tmp.hidden = vm.isHidden;
        }

        if (vm.ignoreSuspicious) {
          tmp.criteria.ignoreSuspicious = vm.ignoreSuspicious;
        }

        if (vm.featureToggle.isFeatureEnabled('distance') && vm.distanceChecked) {
          var fromPropertyInMts = utilService.convertDistances(vm.distance.from, 'km', 'm');
          var toPropertyInMts = utilService.convertDistances(vm.distance.to, 'km', 'm');

          tmp.criteria.distance = {
            from : fromPropertyInMts,
            to: toPropertyInMts
          };
        }

        if (vm.featureToggle.isFeatureEnabled('specificSchedule') && vm.isSpecificScheduleChecked) {
          tmp.validity.dayTimes = promotionsService.parseDatesBeforeSaving(vm.specificScheduleArray);
        }

        if (vm.cancellationRateChecked) {
          tmp.criteria.cancellationRate = vm.cancellationRate;
        }

        if (vm.isCouponCode) {
          tmp.code = angular.copy(vm.promotion.code);
          tmp.validity.expireDays = angular.copy(vm.promotion.validity.expireDays);
          tmp.criteria.redeemQuantity = angular.copy(vm.promotion.criteria.redeemQuantity);
          if (vm.role !== 'DRIVER') {
            tmp.criteria.minimumCostOfRide = angular.copy(vm.promotion.criteria.minimumCostOfRide);
            tmp.criteria.ridesDuringValidity = angular.copy(vm.promotion.criteria.ridesDuringValidity);
          }
        }

        if(vm.categoryOption !== '') {
          tmp.category = vm.categoryOption;
        }

        adminService.createPromotion(tmp)
        .then(function (promotion) {
          adminService.uploadPromotionImage(vm.file, promotion.id)
            .then(function (data) {
              ngToast.create({
                className: 'success',
                content: 'A new promotion has been created.'
              });
              clearFn();
              vm.loading = false;
              $location.path('promotions');
            }, function (error) {
              $location.path('promotions/' + promotion.id);
              ngToast.create({
                className: 'danger',
                content: 'Error uploading promotion image. Please edit the promotion and upload it again.'
              });
            });
        }, function (error) {
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.data.description + '.'
          });
          vm.loading = false;
        });

      } else {
        ngToast.create({
          className: 'danger',
          content: 'Please provide all required information'
        });
        vm.loading = false;
      }

    }

    function clearFn() {
      vm.file = undefined;
      vm.promotion = {
        validity: {
          publishAt: moment().add(10, 'minutes').seconds(0).milliseconds(0).toDate(),
          from: moment().add(20, 'minutes').seconds(0).milliseconds(0).toDate(),
          to: moment().hours(23).minutes(59).seconds(59).milliseconds(0).toDate()
        }
      };

      vm.locationType = 'ANYWHERE';
      if (vm.polygons.length > 0) {
        resetPolygonFn();
      }

      vm.role = 'DRIVER';

      vm.sendAnnounceNotificacion = false;
      vm.sendActivationNotificacion = false;

      vm.specificTime = false;

      vm.forFirstRide = false;
      vm.addCorporation = false;

      vm.locationCriteria = undefined;

      vm.additionalParameters = [];
      vm.filter = {};
      $scope.new_promotion.$setPristine();
    }

    function initMap() {

      var myLatLng = new google.maps.LatLng(lat, lng);

      map = new google.maps.Map(document.getElementById('promotion-map'), {
        zoom: 12,
        center: myLatLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        zoomControl: true
      });

      var options = {
        componentRestrictions: {
          country: JSON.parse(vm.promotion.criteria.country).iso.toLowerCase()
        }
      };

      var locationinput = document.getElementById('promotion-location-input');
      location_autocomplete = new google.maps.places.Autocomplete(locationinput, options);
      location_autocomplete.addListener('place_changed', function () {
        var place = location_autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        map.setCenter(place.geometry.location);
        map.setZoom(17);
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
      });

      $timeout(function () {
        google.maps.event.trigger(map, 'resize');
      }, 100);
    }

    function addPolygonFn(latitude, longitude) {
      if (angular.isDefined(latitude)) {
        lat = latitude;
      }
      if (angular.isDefined(longitude)) {
        lng = longitude;
      }

      var coords = [
        new google.maps.LatLng(lat, lng),
        new google.maps.LatLng(lat + .001, lng + .001),
        new google.maps.LatLng(lat, lng + .001),
        new google.maps.LatLng(lat - .001, lng)
      ];

      var polygonColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

      // Styling & Controls
      var polygon = new google.maps.Polygon({
        paths: coords,
        draggable: true, // turn off if it gets annoying
        editable: true,
        strokeColor: polygonColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: polygonColor,
        fillOpacity: 0.35,
        map: map
      });

      vm.polygons.push(polygon);
      document.getElementById('promotion-location-input').value = '';
      document.getElementById('promotion-location-input').focus();
    }

    function resetPolygonFn() {
      for (var i = 0; i < vm.polygons.length; i++) {
        vm.polygons[i].setMap(null);
      }
      vm.polygons = [];
    }

    function removePolygonFn(idx) {
      idx.setMap(null);
      vm.polygons.splice(vm.polygons.indexOf(idx), 1);
    }

    function toggleRoleFn(idx) {
      $scope.new_promotion.$setDirty();
      if (vm.roles.indexOf(idx) === -1) {
        vm.roles.push(idx);
        if (idx === 'ALL') {
          vm.allSelected = true;
          vm.roles = ['ALL'];
        }
        else {
          if (vm.roles.indexOf('ALL') > -1) {
            vm.roles.splice(vm.roles.indexOf('ALL'), 1);
          }
        }
      }
      else {
        vm.roles.splice(vm.roles.indexOf(idx), 1);
        if (idx === 'ALL') {
          vm.allSelected = false;
          vm.roles = [];
        }
      }
    }

    function validateStartDateFn(oldVal, newVal) {

      var today = vm.minPublishDate.toDate().getTime();

      var from = (!moment.isMoment(vm.promotion.validity.from)) ?
        moment(vm.promotion.validity.from).toDate().getTime() :
        vm.promotion.validity.from.toDate().getTime();

      var to = (!moment.isMoment(vm.promotion.validity.to)) ?
        moment(vm.promotion.validity.to).toDate().getTime() :
        vm.promotion.validity.to.toDate().getTime();

      var publish = (!moment.isMoment(vm.promotion.validity.publishAt)) ?
        moment(vm.promotion.validity.publishAt).toDate().getTime() :
        vm.promotion.validity.publishAt.toDate().getTime();

      if ($scope.new_promotion.field_publishAt) {
        $scope.new_promotion.field_publishAt.$setValidity("endBeforeStart", publish >= today);
      }

      if ($scope.new_promotion.field_from) {
        $scope.new_promotion.field_from.$setValidity("endBeforeStart", from >= publish);
      }

      if ($scope.new_promotion.field_to) {
        $scope.new_promotion.field_to.$setValidity("endBeforeStart", to >= from);
      }

    }

    function validateDistanceRangeFn() {
      var from = vm.distance.from;
      var to = vm.distance.to;

      if (from >= 0 && to >= 0) {
        if ($scope.new_promotion.distance_from) {
          $scope.new_promotion.distance_from.$setValidity("rangeDistanceBetween", from < to);
        }

        if ($scope.new_promotion.distance_to) {
          $scope.new_promotion.distance_to.$setValidity("rangeDistanceBetween", to > from);
        }
      }
    }

    function getCountriesFn() {
      adminService.getCountries()
        .then(function (countries) {
          vm.countries = countries;
        }, function (error) {
          console.log(error);
        });
    }

    function getCountryStatesFn(countryIso) {
      adminService.getStatesByCountry(countryIso)
        .then(function (states) {
          vm.countryStates = states;
          setTimeout(function () {
            $('#field_states').multipleSelect("refresh");
          }, 10);
        }, function (error) {
          console.log(error);
        });
    }

    function addFilterFn() {
      if (vm.additionalParameters.length < 1) {
        vm.additionalParameters.push({
          type: undefined,
          value: undefined
        });
      }
    }

    function removeFilterFn(idx) {
      vm.additionalParameters.splice(vm.additionalParameters.indexOf(idx), 1);
    }

    function containsFilterFn(obj) {
      var i;
      for (i = 0; i < vm.additionalParameters.length; i++) {
        if (vm.additionalParameters[i].type === obj) {
          return true;
        }
      }
      return false;
    }

    function getCorporatesFn() {
      setTimeout(function () {
        $('#field_corporation').multipleSelect("refresh");
      }, 10);
      adminService.getAllCorporates(undefined, undefined, '+companyName', undefined, undefined, undefined, 'OK')
        .then(function (response) {
          vm.corporates = response.data;
          setTimeout(function () {
            $('#field_corporation').multipleSelect("refresh");
          }, 10);
        }, function (error) {
          console.log(error);
        });
    }

    function cleanFieldCouponCodeFn(field) {
      if (field === 'redeemQuantity') {
        vm.promotion.criteria.redeemQuantity = null;
      } else if (field === 'expireDays') {
        vm.promotion.validity.expireDays = null;
      } else if (field === 'ridesDuringValidity') {
        vm.promotion.criteria.ridesDuringValidity = null;
      }
      return;
    }

    function generateCodeFn() {
      vm.promotion.code = $filter('uppercase')(utilService.randomString(10));
    }

    function addRangeForSpecificScheduleFn() {
      vm.specificScheduleArray =
        promotionsService.addRangeForSpecificSchedule(vm.specificScheduleArray);
    }

    function removeRangeForSpecificScheduleFn(index) {
      vm.specificScheduleArray =
        promotionsService.removeRangeForSpecificSchedule(vm.specificScheduleArray, index);
    }

    function handleWatchCategoryOptionFn(newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.isSystemCategory = newVal === 'SYSTEM';
        vm.isCouponCode = newVal === 'PROMOTIONAL_CODE';
        vm.addCorporation = newVal === 'COUPON';
      }
    }

  }
})();
