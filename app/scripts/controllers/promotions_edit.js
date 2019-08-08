/**
 * Created by abarazarte on 30/06/16.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:EditPromotionCtrl
   * @description
   * # EditPromotionCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('EditPromotionCtrl', editPromotionCtrl);

  function editPromotionCtrl(
    $routeParams,
    $timeout,
    $location,
    $scope,
    $filter,
    adminService,
    utilService,
    ngToast,
    blockUI,
    SHARE_PROMOTION_PATH,
    featureToggleFactory,
    promotionsService){
    if (utilService.getUserPermissionBase('read:promotions')) {
      return true;
    }

    var vm = this;
    vm.editable = false;
    var myBlock = blockUI.instances.get('promotion');
    myBlock.start();
    var map;
    vm.polygons = [];
    var lat = 10.6638617;
    var lng = -71.6020553;
    var promotionPictureId = undefined;

    vm.featureToggle = featureToggleFactory;
    vm.promotionService = promotionsService;

    vm.isSectionReady = false;
    vm.loading = {};
    vm.now = moment();
    vm.minPublishDate = moment().hours(0).minutes(0).seconds(0).milliseconds(0);

    vm.distanceOption = '';
    vm.distanceChecked = false;
    vm.distance = {
      from: undefined,
      to: undefined
    };

    vm.isSpecificScheduleChecked = false;
    vm.specificScheduleArray = [];

    vm.cancellationRateOption = '';
    vm.cancellationRateChecked = false;
    vm.cancellationRate = {
      from: undefined,
      to: undefined
    };

    vm.categoryOption = '';
    vm.isSystemCategory = false;

    vm.promotion = {
      validity: {
        publishAt: moment().add(10, 'minutes').seconds(0).milliseconds(0).toDate(),
        from: moment().add(20, 'minutes').seconds(0).milliseconds(0).toDate(),
        to: moment().hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
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
      }
    };
    vm.locationType = 'ANYWHERE';
    vm.promotionStatus = '';
    vm.roles = [];
    vm.published = false;
    vm.active = false;
    vm.countryStates = [];
    vm.countryStatesTmp = [];

    vm.sendAnnounceNotificacion = false;
    vm.sendActivationNotificacion = false;

    vm.forFirstRide = false;
    vm.addCorporation = false;

    vm.additionalParameters = [];
    vm.filter = {};

    vm.promotionValidity = 'PROMOTION_END';
    vm.isHighPriority = false;
    vm.isHidden = false;
    vm.isCouponCode = false;
    vm.isRedeemQuantityUnlimited = false;
    vm.ignoreSuspicious = false;
    vm.promotionOriginalData = undefined;

    vm.dateTimeOptions = {
      parentEl: '.edit-promotion',
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

    vm.editPromotion = editPromotionFn;
    vm.cancelEdit = cancelEditFn;
    vm.toggleRole = toggleRoleFn;
    vm.setEditable = setEditableFn;
    vm.removePolygon = removePolygonFn;
    vm.openCopyPromotion = openCopyPromotionFn;

    vm.addFilter = addFilterFn;
    vm.removeFilter = removeFilterFn;
    vm.containsFilter = containsFilterFn;
    vm.cleanFieldCouponCode = cleanFieldCouponCodeFn;
    vm.generateCode = generateCodeFn;
    vm.addRangeForSpecificSchedule = addRangeForSpecificScheduleFn;
    vm.removeRangeForSpecificSchedule = removeRangeForSpecificScheduleFn;

    getCorporatesFn();

    $scope.$watch('vm.promotion.validity.publishAt', validateStartDateFn);
    $scope.$watch('vm.promotion.validity.from', validateStartDateFn);
    $scope.$watch('vm.promotion.validity.to', validateStartDateFn);
    $scope.$watch('vm.categoryOption', handleWatchCategoryOptionFn);

    if(vm.featureToggle.isFeatureEnabled('distance')) {
      $scope.$watch('vm.distance.to', validateDistanceRangeFn);
      $scope.$watch('vm.distance.from', validateDistanceRangeFn);
    }

    function initHandleWatchForRole() {
      $scope.$watch('vm.role', function(newVal, oldVal) {
        if(newVal !== oldVal){
          if(angular.isDefined(newVal)){
            vm.filter = {};
            vm.categoryOption = '';
            if (vm.role === 'DRIVER') {
              vm.promotion.type = 'AMOUNT';
            }
          }
        }
      });
    }

    function initWatchForDistanceOption() {
      $scope.$watch('[vm.distanceOption, vm.distanceChecked]', function(newVal, oldVal){
        if(newVal !== oldVal){
          if(angular.isDefined(newVal)) {
            vm.distance = {
              from: undefined,
              to: undefined
            };
          }
        }
      });
    }

    function initWatchForCancellationRateOption() {
      $scope.$watch('[vm.cancellationRateOption, vm.cancellationRateChecked]', function(newVal, oldVal){
        if (newVal !== oldVal) {
          if (angular.isDefined(newVal)) {
            vm.cancellationRate = {
              from: undefined,
              to: undefined
            };
          }
        }
      });
    }

    function getPromotion() {

      adminService.getPromotion($routeParams.promotionId)
        .then(function(promotion) {
          vm.promotionOriginalData = promotion;
          adminService.getStatesByCountry(promotion.criteria.country.iso)
            .then(function(states) {
              vm.isSectionReady = true;
              vm.promotion.type = promotion.type;
              vm.promotion.value = promotion.value;
              vm.promotion.status = promotion.status;
              vm.promotion.category = promotion.category;
              vm.promotion.criteria = {
                country: promotion.criteria.country,
                states: [],
                locationType: promotion.criteria.locationType
              };
              if(angular.isDefined(promotion.validity)){
                vm.promotion.validity = {
                  publishAt: moment(promotion.validity.publishAt).toDate(),
                  from: moment(promotion.validity.from).toDate(),
                  to: moment(promotion.validity.to).toDate()
                };

                vm.dateTimeforPublishAtInput.startDate = vm.promotion.validity.publishAt;
                vm.dateTimeforPublishAtInput.endDate = vm.dateTimeforPublishAtInput.startDate;

                vm.dateTimeforFromInput.startDate = vm.promotion.validity.from;
                vm.dateTimeforFromInput.endDate = vm.dateTimeforFromInput.startDate;

                vm.dateTimeforToInput.startDate = vm.promotion.validity.to;
                vm.dateTimeforToInput.endDate = vm.dateTimeforToInput.startDate;

              }
              vm.countryStates = states;
              vm.promotion.criteria.states = promotion.criteria.states;
              $timeout(function() {
                $('select[multiple="multiple"]').multipleSelect();
                $('select[multiple="multiple"]').multipleSelect("refresh");
                $('select[multiple="multiple"]').multipleSelect("disable");
              }, 300);
              vm.role = promotion.criteria.roles[0];
              if(angular.isDefined(promotion.criteria.sources)){
                if(promotion.criteria.roles[0] === 'PASSENGER' && promotion.criteria.sources[0] !== 'STANDARD') {
                  vm.role = promotion.criteria.sources[0];
                }
              }
              if(promotion.pictureId) {
                vm.promotionPicture = adminService.getPictureUrl(promotion.pictureId);
                adminService.validPictureUrl(vm.promotionPicture).then(
                function() {
                  promotionPictureId = promotion.pictureId;
                },
                function() {
                  promotionPictureId = undefined;
                  vm.promotionPicture = '../images/frame_image_promotion_default.png';
                  ngToast.create({
                    className: 'warning',
                    content: 'There was an unexpected error trying to fetch the promotion image, please upload it again to save or update it.',
                    timeout: 10000
                  });
                });
              } else {
                vm.promotionPicture = '../images/frame_image_promotion_default.png';
              }

              for (var i = 0; i < promotion.descriptions.length; i++) {
                var description = promotion.descriptions[i];
                if (description.language === 'EN') {
                  vm.promotion.english = {
                    name: description.name,
                    shortDescription: description.shortDescription,
                    description: description.description,
                    share: {
                      title: description.share.title,
                      content: description.share.baseContent,
                      url: SHARE_PROMOTION_PATH.EN,
                      code: description.share.code
                    },
                    notification: {
                    }
                  };
                  if (angular.isDefined(description.notifications)) {
                    for (var j = 0; j < description.notifications.length; j++) {
                      if (description.notifications[j].status === 'NOT_STARTED') {
                        vm.promotion.english.notification.announce = description.notifications[j].content;
                        vm.sendAnnounceNotificacion = true;
                      }
                      else if (description.notifications[j].status === 'ACTIVE') {
                        vm.promotion.english.notification.activation = description.notifications[j].content;
                        vm.sendActivationNotificacion = true;
                      }
                    }
                  }
                }
                else if (description.language === 'ES') {
                  vm.promotion.spanish = {
                    name: description.name,
                    shortDescription: description.shortDescription,
                    description: description.description,
                    share: {
                      title: description.share.title,
                      content: description.share.baseContent,
                      url: SHARE_PROMOTION_PATH.ES,
                      code: description.share.code
                    },
                    notification: {
                    }
                  };
                  if (angular.isDefined(description.notifications)) {
                    for (var k = 0; k < description.notifications.length; k++) {
                      if (description.notifications[k].status === 'NOT_STARTED') {
                        vm.promotion.spanish.notification.announce = description.notifications[k].content;
                        vm.sendAnnounceNotificacion = true;
                      }
                      else if (description.notifications[k].status === 'ACTIVE') {
                        vm.promotion.spanish.notification.activation = description.notifications[k].content;
                        vm.sendActivationNotificacion = true;
                      }
                    }
                  }
                }
              }
              if(angular.isDefined(promotion.criteria.location)){
                if(promotion.criteria.location.length > 0){
                  vm.locationType = 'AREA';

                  $timeout(initMap(), 1000);
                  $timeout(function(){
                    var bounds = new google.maps.LatLngBounds();
                    for(var i = 0; i < promotion.criteria.location.length; i++){
                      var location = promotion.criteria.location[i];
                      var coords = [];
                      for(var j = 0; j < location.length; j++){
                        var latLng = new google.maps.LatLng(location[j][0], location[j][1]);
                        coords.push(latLng);
                        bounds.extend(latLng);
                      }
                      var polygonColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);

                      // Styling & Controls
                      var polygon = new google.maps.Polygon({
                        paths: coords,
                        strokeColor: polygonColor,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: polygonColor,
                        fillOpacity: 0.35,
                        map: map
                      });

                      $timeout(function(){
                        if((!vm.editable) || vm.promotionStatus === 'ACTIVE' || vm.promotionStatus === 'COMPLETED'  || vm.promotionStatus === 'ARCHIVED'){
                          polygon.setDraggable(false);
                          polygon.setEditable(false);
                        }else{
                          polygon.setDraggable(true);
                          polygon.setEditable(true);
                        }
                      }, 100);
                      vm.polygons.push(polygon);
                    }
                    map.fitBounds(bounds);
                  }, 200);

                }
              }

              if(angular.isDefined(promotion.criteria.usagePerUser) && promotion.criteria.usagePerUser > 0){
                vm.usagePerUser = true;
                vm.promotion.criteria.usagePerUser = angular.copy(promotion.criteria.usagePerUser);
              }

              if(angular.isDefined(promotion.criteria.completedRides)){
                vm.forFirstRide = promotion.criteria.completedRides === 0;
              }

              if(angular.isDefined(promotion.alliedCorporations) && promotion.alliedCorporations.length > 0){
                vm.addCorporation = true;
                vm.promotion.alliedCorporation = promotion.alliedCorporations.map(function(corporation){
                  return corporation.id;
                });
              }

              if(angular.isDefined(promotion.criteria.completedRidesDuringValidity) && promotion.criteria.completedRidesDuringValidity > 0){
                vm.rideInterval = true;
                vm.promotion.criteria.completedRidesDuringValidity = angular.copy(promotion.criteria.completedRidesDuringValidity);
              }

              if(angular.isDefined(promotion.validity.expireDays) && promotion.validity.expireDays > 0){
                vm.promotionValidity = 'GIVEN_DAYS';
                vm.promotion.validity.expireDays = angular.copy(promotion.validity.expireDays);
              }

              if(promotion.highPriority){
                vm.isHighPriority = promotion.highPriority;
              }

              if(promotion.hidden){
                vm.isHidden = promotion.hidden;
              }

              if (promotion.criteria.ignoreSuspicious) {
                vm.ignoreSuspicious = promotion.criteria.ignoreSuspicious;
              }

              if (promotion.criteria.distance) {
                if (angular.isDefined(promotion.criteria.distance.from)) {
                  var fromPropertyInKms = utilService.convertDistances(promotion.criteria.distance.from, 'm', 'km');
                }

                if (angular.isDefined(promotion.criteria.distance.to)) {
                  var toPropertyInKms = utilService.convertDistances(promotion.criteria.distance.to, 'm', 'km');
                }

                if(!isNaN(fromPropertyInKms)) {
                  vm.distance.from = fromPropertyInKms;
                }

                if(!isNaN(toPropertyInKms)) {
                  vm.distance.to = toPropertyInKms;
                }

                vm.distanceChecked = true;
                if (angular.isDefined(vm.distance.from) &&
                  angular.isDefined(vm.distance.to)) {
                  vm.distanceOption = "between";
                } else if (angular.isDefined(vm.distance.from) &&
                  !angular.isDefined(vm.distance.to)) {
                  vm.distanceOption = "more-than";
                } else if (!angular.isDefined(vm.distance.from) &&
                  angular.isDefined(vm.distance.to)) {
                  vm.distanceOption = "less-than";
                }
              }

              if (promotion.validity.dayTimes) {
                vm.isSpecificScheduleChecked = true;
                vm.specificScheduleArray =
                  promotionsService.parseDatesAfterGettingFromDataBase(promotion.validity.dayTimes);
              } else {
                vm.specificScheduleArray = promotionsService.addRangeForSpecificSchedule([]);
              }

              vm.promotion.criteria.ridesDuringValidity = promotion.criteria.ridesDuringValidity;
              if(angular.isDefined(promotion.code)) {
                vm.isCouponCode = true;
                vm.promotion.code = angular.copy(promotion.code);
                vm.promotion.validity.expireDays = angular.copy(promotion.validity.expireDays);
                vm.promotion.criteria.minimumCostOfRide = angular.copy(promotion.criteria.minimumCostOfRide);
                vm.promotion.criteria.redeemQuantity = angular.copy(promotion.criteria.redeemQuantity);
                vm.promotion.criteria.ridesDuringValidity = angular.copy(promotion.criteria.ridesDuringValidity);
                if(!angular.isDefined(vm.promotion.criteria.redeemQuantity)) {
                  vm.isRedeemQuantityUnlimited = true;
                }
                if(!angular.isDefined(vm.promotion.criteria.ridesDuringValidity)) {
                  vm.isForAllRides = true;
                }
              }
              vm.promotionStatus = promotion.status;

              if(angular.isDefined(promotion.category)) {
                vm.isSystemCategory = true;
                vm.categoryOption = promotion.category;
              }

              if (promotion.criteria.cancellationRate) {
                vm.cancellationRateChecked = true;
                vm.cancellationRate = promotion.criteria.cancellationRate;

                if (angular.isDefined(vm.cancellationRate.from) &&
                  !angular.isDefined(vm.cancellationRate.to)) {
                  vm.cancellationRateOption = "more-than";
                } else if (!angular.isDefined(vm.cancellationRate.from) &&
                  angular.isDefined(vm.cancellationRate.to)) {
                  vm.cancellationRateOption = "less-than";
                }

              }

              initWatchForDistanceOption();
              initWatchForCancellationRateOption();
              initHandleWatchForRole();

            }, function(error){
              console.log(error);
            });

          myBlock.stop();
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.data.description + '.'
          });
          myBlock.stop();
        });
    }

    function initMap() {

      var myLatLng = new google.maps.LatLng(lat, lng);

      var containerMap = document.getElementsByClassName("promotion-map-container");
      map = new google.maps.Map(containerMap, {
        zoom: 12,
        center: myLatLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        zoomControl: true
      });

      var locationinput =  document.getElementsByClassName('promotion-location-input');
      var location_autocomplete = new google.maps.places.Autocomplete(locationinput);
      location_autocomplete.addListener('place_changed', function() {
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

      $timeout(function(){
        google.maps.event.trigger(map, 'resize');
      },100);
    }

    function addPolygonFn(latitude, longitude) {
      if(angular.isDefined(latitude)){
        lat = latitude;
      }
      if(angular.isDefined(longitude)){
        lng = longitude;
      }

      var coords = [
        new google.maps.LatLng(lat, lng),
        new google.maps.LatLng(lat + .001, lng + .001),
        new google.maps.LatLng(lat, lng + .001),
        new google.maps.LatLng(lat - .001, lng)
      ];

      var polygonColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);

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

    function editPromotionFn() {
      vm.loading.edit = true;

      if(!promotionPictureId && !vm.file){
        ngToast.create({
          className: 'danger',
          content: 'Please upload promotion image.'
        });
        vm.loading.edit = false;
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
        criteria: {
          roles: [],
          country: angular.copy(vm.promotion.criteria.country),
          locationType: vm.promotion.criteria.locationType
        },
        status: vm.promotion.status
      };

      if(vm.promotion.criteria.states.length > 0) {
        tmp.criteria.states = [];
        for(var i = 0; i< vm.promotion.criteria.states.length; i++){
          if(typeof vm.promotion.criteria.states[i] === 'object'){
            tmp.criteria.states.push(vm.promotion.criteria.states[i]);
          }
          else{
            tmp.criteria.states.push(JSON.parse(vm.promotion.criteria.states[i]));
          }
        }
      }

      if (vm.role === 'DRIVER' || vm.role === 'PASSENGER' || vm.role === 'CORPORATE') {
        tmp.criteria.roles.push(vm.role);
      }
      else if (vm.role === 'CORPORATE_GUESTS' || vm.role === 'CORPORATE_EMPLOYEES') {
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
          code: vm.promotion.english.share.code,
          url: vm.promotion.english.share.url + vm.promotion.english.share.code
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
          code: vm.promotion.spanish.share.code,
          url: vm.promotion.spanish.share.url + vm.promotion.spanish.share.code
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
          notifiable:vm.sendActivationNotificacion
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
        for(var i = 0; i< vm.polygons.length; i++){
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

      if (!vm.file) {
        tmp.pictureId = promotionPictureId;
      }

      if (vm.usagePerUser) {
        tmp.criteria.usagePerUser = angular.copy(vm.promotion.criteria.usagePerUser);
      }

      if (vm.forFirstRide) {
        tmp.criteria.completedRides = 0;
      }

      if (vm.addCorporation) {
        tmp.alliedCorporations = vm.promotion.alliedCorporation.map(function(corporation) {
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

      if (vm.ignoreSuspicious !== vm.promotionOriginalData.criteria.ignoreSuspicious) {
        tmp.criteria.ignoreSuspicious = vm.ignoreSuspicious;
      }

      if (vm.featureToggle.isFeatureEnabled('distance') && vm.distanceChecked) {

        var fromPropertyInMts = utilService.convertDistances(vm.distance.from, 'km', 'm');
        var toPropertyInMts = utilService.convertDistances(vm.distance.to, 'km', 'm');

        tmp.criteria.distance = {
          from: fromPropertyInMts,
          to: toPropertyInMts
        };
      }

      if (vm.cancellationRateChecked) {
        tmp.criteria.cancellationRate = vm.cancellationRate;
      }

      if (vm.featureToggle.isFeatureEnabled('specificSchedule') && vm.isSpecificScheduleChecked) {
        tmp.validity.dayTimes = promotionsService.parseDatesBeforeSaving(vm.specificScheduleArray);
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

      adminService.editPromotion($routeParams.promotionId, tmp)
        .then(function() {
          if (vm.file) {
            adminService.uploadPromotionImage(vm.file, $routeParams.promotionId)
              .then(function() {
                ngToast.create({
                  className: 'success',
                  content: 'Promotion has been updated.'
                });
                vm.loading.edit = false;
                cancelEditFn();
              },function(error){
                ngToast.create({
                  className: 'danger',
                  content: 'Error updating promotion picture. Please try again.'
                });
                vm.loading.edit = false;
            });
          }else{
            ngToast.create({
              className: 'success',
              content: 'Promotion has been updated.'
            });
            vm.loading.edit = false;
            cancelEditFn();
          }
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.data.description + '.'
          });
          vm.loading.edit = false;
        });
    }

    function cancelEditFn(){
      $location.path('promotions');
    }

    function toggleRoleFn(idx) {
      $scope.edit_promotion.$setDirty();
      if (vm.roles.indexOf(idx) === -1) {
        vm.roles.push(idx);
        if(idx === 'ALL'){
          vm.allSelected = true;
          vm.roles = ['ALL'];
        }
        else {
          if (vm.roles.indexOf('ALL') > -1) {
            vm.roles.splice(vm.roles.indexOf('ALL'), 1);
          }
        }
      } else {
        vm.roles.splice(vm.roles.indexOf(idx), 1);
        if(idx === 'ALL'){
          vm.allSelected = false;
          vm.roles = [];
        }
      }
    }

    function resetPolygonFn(){
      for(var i = 0; i < vm.polygons.length; i++){
        vm.polygons[i].setMap(null);
      }
      vm.polygons = [];
    }

    function removePolygonFn(idx){
      idx.setMap(null);
      vm.polygons.splice(vm.polygons.indexOf(idx), 1);
    }

    function validateStartDateFn() {

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

      var now = new Date().getTime();

      if ($scope.edit_promotion.field_from) {
        $scope.edit_promotion.field_from.$setValidity("endBeforeStart", from >= publish);
      }

      if ($scope.edit_promotion.field_to) {
        $scope.edit_promotion.field_to.$setValidity("endBeforeStart", to >= from);
      }

      vm.published = now > publish;
      vm.active = now > from;
    }

    function validateDistanceRangeFn() {
      var from = vm.distance.from;
      var to = vm.distance.to;

      if(from >= 0 && to >= 0) {
        if($scope.edit_promotion.distance_from) {
          $scope.edit_promotion.distance_from.$setValidity("rangeDistanceBetween", from < to);
        }

        if($scope.edit_promotion.distance_to) {
          $scope.edit_promotion.distance_to.$setValidity("rangeDistanceBetween", to > from);
        }
      }
    }

    function setEditableFn(){
      if(vm.editable){
        $('select[multiple="multiple"]').multipleSelect("disable");
        $('#field_corporation').multipleSelect("disable");
      }
      else{
        if(vm.promotionStatus === 'CREATED'){
          $('select[multiple="multiple"]').multipleSelect("enable");
          $('#field_corporation').multipleSelect("enable");
        }
      }
      vm.editable = !vm.editable;
      for(var i = 0; i< vm.polygons.length; i++){
        if((!vm.editable) || vm.promotionStatus === 'ACTIVE' || vm.promotionStatus === 'COMPLETED'  || vm.promotionStatus === 'ARCHIVED'){
          vm.polygons[i].setDraggable(false);
          vm.polygons[i].setEditable(false);
        }else{
          vm.polygons[i].setDraggable(true);
          vm.polygons[i].setEditable(true);
        }
      }
    }

    function getCountriesFn(){
      adminService.getCountries()
        .then(function(countries){
          vm.countries = countries;
          getPromotion();
        }, function(error){
          console.log(error);
        });
    }

    function getCountryStatesFn(countryIso){
      adminService.getStatesByCountry(countryIso)
        .then(function(states){
          vm.countryStates = states;
          setTimeout(function() {
            $('select[multiple="multiple"]').multipleSelect("refresh");
          }, 10);
        }, function(error){
          console.log(error);
        });
    }

    function openCopyPromotionFn(){
      $location.path('promotions/' + $routeParams.promotionId + '/copy');
    }

    function addFilterFn(){
      if(vm.additionalParameters.length < 1){
        vm.additionalParameters.push({
          type: undefined,
          value: undefined
        });
      }
    }

    function removeFilterFn(idx){
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

    function getCorporatesFn(){
      setTimeout(function() {
        $('#field_corporation').multipleSelect("refresh");
      }, 10);
      adminService.getAllCorporates(undefined, undefined, '+companyName', undefined, undefined, undefined, 'OK')
        .then(function(response){
          vm.corporates = response.data;
          setTimeout(function() {
            $('#field_corporation').multipleSelect("refresh");
          }, 10);
          getCountriesFn();
        }, function(error){
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

    function handleWatchCategoryOptionFn(newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.isSystemCategory = newVal === 'SYSTEM';
        vm.isCouponCode = newVal === 'PROMOTIONAL_CODE';
        vm.addCorporation = newVal === 'COUPON';
        if (vm.addCorporation) {
          setTimeout(function() {
            $('#field_corporation').multipleSelect("refresh");
          }, 10);
        }
      }
    }

    function addRangeForSpecificScheduleFn() {
      vm.specificScheduleArray =
        promotionsService.addRangeForSpecificSchedule(vm.specificScheduleArray);
    }

    function removeRangeForSpecificScheduleFn(index) {
      vm.specificScheduleArray =
        promotionsService.removeRangeForSpecificSchedule(vm.specificScheduleArray, index);
    }

  }
})();
