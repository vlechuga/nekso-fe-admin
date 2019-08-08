(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RideMonitorCtrl
   * @description
   * # RideMonitorCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RideMonitorCtrl', rideMonitorCtrl);

  function rideMonitorCtrl($scope, MQTT, $interval, adminService, $compile, store, $timeout, utilService, $q) {
    if (utilService.getUserPermissionBase('read:monitor')) {
      return true;
    }
    var vm  = this;
    mainDelay();
    function mainDelay() {
      if (!window.google) {
        $timeout(mainDelay, 100);
        return true;
      }
      vm.loadingMultiSelect = false;
      vm.statesArr = utilService.getUserPermissionStates() || [];
      $timeout(function() {
        $('select[multiple="multiple"]').multipleSelect({
          placeholder: "Select states"
        });
        vm.loadingMultiSelect = true;
      }, 200);

      vm.AllPermision=false;
      vm.testBound=[];

      if(localStorage.updatedBounds!='true'){
        localStorage.removeItem('boundsArr');
      }

      vm.states={};
      vm.states.country=[];
      adminService.getAllStates()
      .then(function(data){
        var tmp=vm.statesArr;
        vm.statesArr=[];
        vm.states.data=data;
        if (tmp.length==0) {
          vm.AllPermision=true;
          for (var j = 0; j < data.length; j++) {
            vm.statesArr.push(data[j]);
          }
          for (var i = 0; i < vm.statesArr.length; i++) {
            if(vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country)==-1){
              vm.states.country.push(vm.statesArr[i].country);
            }
          }
        } else {
          for (var i = 0; i < tmp.length; i++) {
            for (var j = 0; j < data.length; j++) {
              if (data[j].name==tmp[i]) {
                vm.statesArr.push(data[j]);
              }
            }
          }
          for (var i = 0; i < vm.statesArr.length; i++) {
            if(vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country)==-1){
              vm.states.country.push(vm.statesArr[i].country);
            }
          }
        }
        if (vm.states.country.length==1) {
          setCenter(vm.states.country[0]);
        }
        vm.loadingMultiSelect = true;
        setTimeout(function() {
          $('select[multiple="multiple"]').multipleSelect("refresh");
        }, 10);

        vm.boundsArr={};
        vm.boundRequests=0;
        var promises=[];
        if (localStorage.boundsArr) {
          vm.boundsArr=JSON.parse(localStorage.boundsArr);
          // console.log(vm.boundsArr);
          angular.forEach(vm.boundsArr, function(value, key) {
            vm.boundsArr[key].bounds = new google.maps.LatLngBounds({
              lat:vm.boundsArr[key].bounds.south,
              lng:vm.boundsArr[key].bounds.west
            },
            {
              lat:vm.boundsArr[key].bounds.north,
              lng:vm.boundsArr[key].bounds.east
            });
          });
          for (var i = 0; i < vm.statesArr.length; i++) {
            var name = vm.statesArr[i].name;
            var country = vm.statesArr[i].country;
            if (!vm.boundsArr[name]) {
              if (name.toLowerCase()!='unknown') {
                vm.boundRequests++;
                promises.push(getStatesBounds(name, country));
              }
            }
          }
        } else {
          for (var i = 0; i < vm.statesArr.length; i++) {
            var name = vm.statesArr[i].name;
            var country = vm.statesArr[i].country;
            if (name.toLowerCase()!='unknown') {
              vm.boundRequests++;
              promises.push(getStatesBounds(name, country));
            }
          }
        }
      })

      var map;
      var markers = {};
      var infowindow = new google.maps.InfoWindow();
      var clientId;
      var client;
      vm.digitalList = [];
      adminService.getTagDrivers('DIGITAL')
        .then(function(alldrivers){
          for(var x=0; x<alldrivers.data.length; x++){
            vm.digitalList.push(alldrivers.data[x].id);
          }
        }, function(error){
          console.log(error);
        });

      vm.filter = {
        users: '',
        taxiLine: '',
        state:[]
      };
      vm.taxiLines = [];
      vm.corporates = [];
      vm.corporatesRequest = [];
      vm.getMarkersLength = getMarkersLengthFn;

      waitBounds();

      function getUserPermissionFn(code){
        return utilService.getUserPermission(code);
      }

      function waitBounds(){
        if (vm.boundRequests==0) {
          localStorage.boundsArr=JSON.stringify(vm.boundsArr);
          localStorage.updatedBounds=true;
          initMap();
          // getCorporates();
          getControllers();
          // initCorporates();
          checkOldMarkers();
          initMQTT();
        } else {
          $timeout(waitBounds,500);
          return true;
        }
      }

      function getControllers(){
        adminService.getAllControllers()
          .then(function(controllers){
            for(var i = 0; i < controllers.data.length; i++){
              var controller = {};
              controller.id = controllers.data[i].id;
              controller.name = controllers.data[i].name;
              vm.taxiLines.push(controller);
              if(angular.isDefined(controllers.data[i].locationInfo)  && angular.isDefined(controllers.data[i].locationInfo)){
                var position = parseLocationFn(controllers.data[i].locationInfo.location);
                if (checkPointInnerBounds(position.latitude, position.longitude)) {
                  var marker = new google.maps.Marker({
                    position: {
                      lat: +position.latitude,
                      lng: +position.longitude
                    },
                    map: map,
                    animation: google.maps.Animation.DROP,
                    info: controllers.data[i].name,
                    icon: 'images/markers/marker_controller.png'
                  });
                  google.maps.event.addListener(marker, 'mouseover', function () {
                    infowindow.setContent(this.info);
                    infowindow.open(map, this);
                  });
                  google.maps.event.addListener(marker, 'mouseout', function () {
                    infowindow.close(map, this);
                  });
                }
              }
            }
          }, function(error){
            console.log(error);
          });
      }

      function getCorporates(){
        adminService.getAllCorporates()
          .then(function(corporates){
            for(var i = 0; i < corporates.data.length; i++){
              var corporate = {};
              corporate.id = corporates.data[i].id;
              corporate.name = corporates.data[i].companyName;
              corporate.totalRides = corporates.data[i].ridesCount;
              var contentString = '<div class="map-info">'+
                '<h5 class="controller-name">'+ corporate.name +'</h5>'+
                '<div id="bodyContent">'+
                // '<p>'+ corporate.totalRides +' Rides</p>'+
                '</div>'+
                '</div>';
              var compiled = $compile(contentString)($scope);
              vm.corporates.push(corporate);
              if(angular.isDefined(corporates.data[i].location) && angular.isDefined(corporates.data[i].location.locationPoint)){
                // console.log(corporates.data[i]);
                if (checkPointInnerBounds(corporates.data[i].location.locationPoint.latitude, corporates.data[i].location.locationPoint.longitude)) {
                  var marker = new google.maps.Marker({
                    position: {
                      lat: +corporates.data[i].location.locationPoint.latitude,
                      lng: +corporates.data[i].location.locationPoint.longitude
                    },
                    map: map,
                    animation: google.maps.Animation.DROP,
                    info: compiled[0],
                    icon: 'images/markers/marker_corporate.png'
                  });
                  google.maps.event.addListener(marker, 'mouseover', function () {
                    infowindow.setContent(this.info);
                    infowindow.open(map, this);
                  });
                  google.maps.event.addListener(marker, 'mouseout', function () {
                    infowindow.close(map, this);
                  });
                }
              }
            }
          }, function(error){
            console.log(error);
          });
      }

      function getImageUrl(driver){
        var url = '';
        if(!angular.isUndefined(driver.profilePictureId)){
          url = adminService.getPictureUrl(driver.profilePictureId, '100x100');
        }else{
          url = 'images/bg-user-profile.png';
        }
        return url;
      }

      function addDriverMarkerFn(message, status, isRoyal){
        var position = parseLocationFn(message.loc);
        if (checkPointInnerBounds(position.latitude, position.longitude)) {
          if(!markers.hasOwnProperty(message.id)){
            var marker = createDriverMarkerObjectFn(message, status, isRoyal);
            markers[message.id] = marker;
          }
          else{
            var m = markers[message.id];
            if((message.ts > m.timestamp) && ((new Date().getTime() - m.receivedOn) > 5 * 1000)){
              var position = parseLocationFn(message.loc);
              var pos = new google.maps.LatLng(+position.latitude, +position.longitude);
              m.setPosition(pos);
              m.nekso_status = status;
              if(status === 'ongoing'){
                if(isRoyal){
                  m.icon = 'images/markers/marker_royal_available.png';
                }
                else if(vm.digitalList.indexOf(message.id) > -1){
                  m.icon = 'images/markers/marker_digital_available.png';
                }
                else{
                  m.icon = 'images/markers/marker_driver_available.png';
                }
              }
              else if(status === 'available'){
                if(isRoyal){
                  m.icon = 'images/markers/marker_royal.png';
                }
                else if(vm.digitalList.indexOf(message.id) > -1){
                  m.icon = 'images/markers/marker_digital.png';
                }
                else{
                  m.icon = 'images/markers/marker_driver.png';
                }
              }
              m.updatedAt = message.ts;
              m.receivedOn = message.receivedOn;
              markers[message.id] = m;
            }
          }
        }
      }

      function createDriverMarkerObjectFn(info, status, isRoyal){
        var icon = '';
        var userType = '';
        var zindex = 9999999;
        var position = parseLocationFn(info.loc);
        if(status === 'ongoing'){
          if(isRoyal){
            icon = 'images/markers/marker_royal_available.png';
          }
          else if(vm.digitalList.indexOf(info.id) > -1){
            icon = 'images/markers/marker_digital_available.png';
          }
          else{
            icon = 'images/markers/marker_driver_available.png';
          }
        }
        else if(status === 'available'){
          if(isRoyal){
            icon = 'images/markers/marker_royal.png';
          }
          else if(vm.digitalList.indexOf(info.id) > -1){
            icon = 'images/markers/marker_digital.png';
          }
          else{
            icon = 'images/markers/marker_driver.png';
          }
        }
        userType = 'DRIVERS';

        var marker =  new google.maps.Marker({
          position: {
            lat: +position.latitude,
            lng: +position.longitude
          },
          map: map,
          animation: google.maps.Animation.DROP,
          timestamp: info.ts,
          info: '',
          userType: userType,
          nekso_status: status,
          receivedOn: info.receivedOn,
          icon: icon,
          zIndex: zindex
        });

        google.maps.event.addListener(marker, 'mouseover', function () {
          if(this.nekso_status === 'ongoing' && getUserPermissionFn('read:monitor')){
            var marker = this;
            adminService.getDriverProfile(info.id)
              .then(function(driver){
                var controllerName = '';
                if(!angular.isUndefined(driver.controller)){
                  controllerName = driver.controller.name;
                }
                var imgUrl = getImageUrl(driver);

                var contentString = '<div class="map-info">'+
                  '<div>'+
                  '<profile-img img-src="' + imgUrl + '" img-vertical-size="60" img-size="60"/>'+
                  '</div>'+
                  '<h5 class="controller-name">'+ controllerName +'</h5>'+
                  '<div id="bodyContent">'+
                  '<h6>'+ driver.firstName +'</h6>'+
                  // '<h6>'+ info.actorInfo.phone +'</h6>'+
                  '<p>'+ driver.ridesCount +' Rides</p>'+
                  '<div class="star-centered">'+
                  // '<average-star-rating average="'+ info.actorInfo.ratingInfo.rate + '"><average-star-rating>'+
                  '</div>'+
                  '</div>'+
                  '</div>';

                var compiled = $compile(contentString)($scope);
                marker.info = compiled[0];
                infowindow.setContent(marker.info);
                infowindow.open(map, marker);
              });
          }
          else{
            // if (this.userType == 'PASSENGERS' && getUserPermissionFn('read:monitor')) {
            //   infowindow.setContent(this.info);
            //   infowindow.open(map, this);
            // } else
            if(this.userType == 'DRIVERS' && getUserPermissionFn('read:monitor')){
              var marker = this;
              adminService.getDriverProfile(info.id)
                .then(function(driver){
                  var controllerName = '';
                  if(!angular.isUndefined(driver.controller)){
                    controllerName = driver.controller.name;
                  }
                  var imgUrl = getImageUrl(driver);

                  var contentString = '<div class="map-info">'+
                    '<div>'+
                    '<profile-img img-src="' + imgUrl + '" img-vertical-size="60" img-size="60"/>'+
                    '</div>'+
                    '<h5 class="controller-name">'+ controllerName +'</h5>'+
                    '<div id="bodyContent">'+
                    '<h6>'+ driver.firstName +'</h6>'+
                    // '<h6>'+ info.actorInfo.phone +'</h6>'+
                    '<p>'+ driver.ridesCount +' Rides</p>'+
                    '<div class="star-centered">'+
                    // '<average-star-rating average="'+ info.actorInfo.ratingInfo.rate + '"><average-star-rating>'+
                    '</div>'+
                    '</div>'+
                    '</div>';

                  var compiled = $compile(contentString)($scope);
                  marker.info = compiled[0];
                  infowindow.setContent(marker.info);
                  infowindow.open(map, marker);
                });

            } else if(this.userType != 'DRIVERS' && this.userType != 'PASSENGERS'){
              infowindow.setContent(this.info);
              infowindow.open(map, this);
            }
          }
        });
        google.maps.event.addListener(marker, 'mouseout', function () {
          infowindow.close(map, this);
        });
        return marker;
      }

      function addPassengerRequestMarkerFn(message){
        var position = parseLocationFn(message.loc);
        if (checkPointInnerBounds(position.latitude, position.longitude)) {
          if(!markers.hasOwnProperty(message.id)){
            var marker = createPassengerRequestMarkerObjectFn(message);
            markers[message.id] = marker;
          }
          else{
            var m = markers[message.id];
            if((message.ts > m.timestamp) && ((new Date().getTime() - m.receivedOn) > 5 * 1000)){
              var position = parseLocationFn(message.loc);
              var pos = new google.maps.LatLng(+position.latitude, +position.longitude);
              m.setPosition(pos);
              m.updatedAt = message.ts;
              m.receivedOn = message.receivedOn;
              markers[message.id] = m;
            }
          }
        }
      }

      function createPassengerRequestMarkerObjectFn(info){
        var icon = '';
        var userType = '';
        var zindex = 9999999;
        var position = parseLocationFn(info.loc);
        icon = 'images/markers/marker_passenger_grey.png';
        userType = 'PASSENGER';

        var marker =  new google.maps.Marker({
          position: {
            lat: +position.latitude,
            lng: +position.longitude
          },
          map: map,
          animation: google.maps.Animation.DROP,
          timestamp: info.ts,
          info: '',
          userType: userType,
          receivedOn: info.receivedOn,
          icon: icon,
          zIndex: zindex
        });

        // google.maps.event.addListener(marker, 'mouseover', function () {
        //   if(this.nekso_status === 'ongoing' && getUserPermissionFn('read:monitor')){
        //     var marker = this;
        //     adminService.getDriverProfile(info.id)
        //       .then(function(driver){
        //         var controllerName = '';
        //         if(!angular.isUndefined(driver.controller)){
        //           controllerName = driver.controller.name;
        //         }
        //         var imgUrl = getImageUrl(driver);
        //
        //         var contentString = '<div class="map-info">'+
        //           '<div>'+
        //           '<profile-img img-src="' + imgUrl + '" img-vertical-size="60" img-size="60"/>'+
        //           '</div>'+
        //           '<h5 class="controller-name">'+ controllerName +'</h5>'+
        //           '<div id="bodyContent">'+
        //           '<h6>'+ driver.firstName +'</h6>'+
        //           // '<h6>'+ info.actorInfo.phone +'</h6>'+
        //           '<p>'+ driver.ridesCount +' Rides</p>'+
        //           '<div class="star-centered">'+
        //           // '<average-star-rating average="'+ info.actorInfo.ratingInfo.rate + '"><average-star-rating>'+
        //           '</div>'+
        //           '</div>'+
        //           '</div>';
        //
        //         var compiled = $compile(contentString)($scope);
        //         marker.info = compiled[0];
        //         infowindow.setContent(marker.info);
        //         infowindow.open(map, marker);
        //       });
        //   }
        //   else{
        //     // if (this.userType == 'PASSENGERS' && getUserPermissionFn('read:monitor')) {
        //     //   infowindow.setContent(this.info);
        //     //   infowindow.open(map, this);
        //     // } else
        //     if(this.userType == 'DRIVERS' && getUserPermissionFn('read:monitor')){
        //       var marker = this;
        //       adminService.getDriverProfile(info.id)
        //         .then(function(driver){
        //           var controllerName = '';
        //           if(!angular.isUndefined(driver.controller)){
        //             controllerName = driver.controller.name;
        //           }
        //           var imgUrl = getImageUrl(driver);
        //
        //           var contentString = '<div class="map-info">'+
        //             '<div>'+
        //             '<profile-img img-src="' + imgUrl + '" img-vertical-size="60" img-size="60"/>'+
        //             '</div>'+
        //             '<h5 class="controller-name">'+ controllerName +'</h5>'+
        //             '<div id="bodyContent">'+
        //             '<h6>'+ driver.firstName +'</h6>'+
        //             // '<h6>'+ info.actorInfo.phone +'</h6>'+
        //             '<p>'+ driver.ridesCount +' Rides</p>'+
        //             '<div class="star-centered">'+
        //             // '<average-star-rating average="'+ info.actorInfo.ratingInfo.rate + '"><average-star-rating>'+
        //             '</div>'+
        //             '</div>'+
        //             '</div>';
        //
        //           var compiled = $compile(contentString)($scope);
        //           marker.info = compiled[0];
        //           infowindow.setContent(marker.info);
        //           infowindow.open(map, marker);
        //         });
        //
        //     } else if(this.userType != 'DRIVERS' && this.userType != 'PASSENGERS'){
        //       infowindow.setContent(this.info);
        //       infowindow.open(map, this);
        //     }
        //   }
        // });
        // google.maps.event.addListener(marker, 'mouseout', function () {
        //   infowindow.close(map, this);
        // });
        return marker;
      }

      function initMap() {
        map = new google.maps.Map(document.getElementById('ride-monitor-map'), {
          zoom: 8,
          center: {
            lat: 10.6638617,
            lng: -71.6020553
          },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true,
          disableDoubleClickZoom: true,
          zoomControl: true
        });

        $timeout(function(){
          google.maps.event.trigger(map, 'resize');
        },100);

        // google.maps.event.addListener(map, "click", function (e) {
        //   var latLng = e.latLng;
        //   console.log(checkPointInnerBounds_test(latLng.lat(),latLng.lng()));
        // });

        // if (navigator.geolocation) {
        //   navigator.geolocation.getCurrentPosition(function (position) {
        //     map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        //   });
        // }
      }
      function initCorporates(){
        var checkCorporateRequestes = $interval(function(){
          // adminService.getMonitorRides(0, 0, obj.startDate, obj.endDate, true)
          adminService.getAllRides(0, 0, undefined, obj.startDate, obj.endDate, undefined, undefined, undefined, true, undefined, undefined, undefined)
            .then(function(rides){
              if (rides.data.length>0) {
                // console.log(rides.data);
                var corporates=rides.data;
                for(var i = 0; i < corporates.length; i++){
                  var corporate = {};
                  // console.log(corporates[i]);
                  if (corporates[i].passenger.corporation) {
                    corporate.id = corporates[i].passenger.corporation.id;
                    corporate.name = corporates[i].passenger.corporation.companyName;
                    if (corporates[i].status=='REQUESTED') {
                      if(vm.corporatesRequest.hasOwnProperty(corporates[i].id)){

                      } else{
                        if(angular.isDefined(corporates[i].passenger.corporation.location.locationPoint)){
                          var position = corporates[i].passenger.corporation.location.locationPoint;
                          if (checkPointInnerBounds(position.latitude, position.longitude)) {
                            var marker = new google.maps.Marker({
                              position: {
                                lat: +position.latitude,
                                lng: +position.longitude
                              },
                              map: map,
                              animation: google.maps.Animation.DROP,
                              info: corporate.name,
                              icon: 'images/markers/marker_corporate_request.png',
                              zIndex: 1000001,
                              nekso_status:1
                              // icon: 'images/markers/marker_controller.png'
                            });
                            vm.corporatesRequest[corporates[i].id] = marker;
                            google.maps.event.addListener(marker, 'mouseover', function () {
                              infowindow.setContent(this.info);
                              infowindow.open(map, this);
                            });
                            google.maps.event.addListener(marker, 'mouseout', function () {
                              infowindow.close(map, this);
                            });
                          }
                        }
                      }
                    } else if(corporates[i].status=='ONGOING'){
                      if(vm.corporatesRequest.hasOwnProperty(corporates[i].id) && vm.corporatesRequest[corporates[i].id]!=null && vm.corporatesRequest[corporates[i].id]!=undefined){
                        if (vm.corporatesRequest[corporates[i].id].nekso_status==1) {
                          vm.corporatesRequest[corporates[i].id].setIcon('images/markers/marker_corporate_ongoing.png');
                          vm.corporatesRequest[corporates[i].id].nekso_status=2;
                        }
                      } else{
                        if(angular.isDefined(corporates[i].passenger.corporation.location.locationPoint)){
                          var position = corporates[i].passenger.corporation.location.locationPoint;
                          if (checkPointInnerBounds(position.latitude, position.longitude)) {
                            var marker = new google.maps.Marker({
                              position: {
                                lat: +position.latitude,
                                lng: +position.longitude
                              },
                              map: map,
                              animation: google.maps.Animation.DROP,
                              info: corporate.name,
                              icon: 'images/markers/marker_corporate_ongoing.png',
                              zIndex: 1000001,
                              nekso_status:2
                              // icon: 'images/markers/marker_controller.png'
                            });
                            vm.corporatesRequest[corporates[i].id] = marker;
                            // console.log(marker);
                            google.maps.event.addListener(marker, 'mouseover', function () {
                              infowindow.setContent(this.info);
                              infowindow.open(map, this);
                            });
                            google.maps.event.addListener(marker, 'mouseout', function () {
                              infowindow.close(map, this);
                            });
                          }
                        }
                      }
                    } else{
                      if(vm.corporatesRequest.hasOwnProperty(corporates[i].id) && vm.corporatesRequest[corporates[i].id]!=null && vm.corporatesRequest[corporates[i].id]!=undefined){
                        vm.corporatesRequest[corporates[i].id].setMap(null);
                        vm.corporatesRequest[corporates[i].id]=undefined;
                      }
                    }
                  } else {

                  }
                }
              }
            });
          // adminService.getAllRides(0, 0, undefined, obj.startDate, obj.endDate, 'ONGOING', undefined, undefined, true, undefined, undefined, undefined)
          //   .then(function(rides){
          //     if (rides.data.length>0) {
          //       console.log(rides.data);
          //     }
          //   });
        },5000);

        $scope.$on("$destroy", function() {
          $interval.cancel(checkCorporateRequestes);
        });
      }
      function checkOldMarkers(){
        $interval(function(){
          var now = new Date().getTime();
          for(var prop in markers){
            if(markers.hasOwnProperty(prop)){
              if(markers[prop].userType !== 'CONTROLLER'){
                var time = (markers[prop].userType === 'DRIVERS') ? 45 * 1000 : 20 * 1000;
                if((now - markers[prop].receivedOn) > time){
                  markers[prop].setMap(null);
                  delete markers[prop];
                }
              }
            }
          }
        }, 15 * 1000);
      }

      function initMQTT(){
        clientId = 'ADMIN-WEB-' + store.get('admin_user').id + '-' + new Date().getTime();
        client = new Paho.MQTT.Client(MQTT.BASE_PATH, Number(MQTT.BASE_PORT), clientId);
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;

        var options = {
          timeout: 60,
          onSuccess: onConnect,
          onFailure: onFailure,
          useSSL: MQTT.USE_SSL
        };
        if(MQTT.USE_AUTH){
          //console.log('use auth');
          options.userName = clientId;
          options.password = store.get('admin_token').tokenType + ' ' + store.get('admin_token').authToken;
        }
        client.connect(options);

        $scope.$on("$destroy", function(){
          client.disconnect();
          console.log('disconnecting from mqtt');
        });
      }

      function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        client.subscribe('loc/drv/+/available/#');
        client.subscribe('loc/drv/+/ongoing/#');

        client.subscribe('loc/ryl/drv/+/available/#');
        client.subscribe('loc/ryl/drv/+/ongoing/#');

        client.subscribe('rqs/#')
      }

      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0){
          console.log("onConnectionLost:" + responseObject.errorMessage);
          var options = {
            timeout: 60,
            onSuccess: onConnect,
            onFailure: onFailure,
            useSSL: MQTT.USE_SSL
          };
          if(MQTT.USE_AUTH){
            //console.log('use auth');
            options.userName = clientId;
            options.password = store.get('admin_token').tokenType + ' ' + store.get('admin_token').authToken;
          }
          client.connect(options);
        }
      }

      function onFailure(message) {
        console.log('Connection failed: ' + message.errorMessage);
        console.log('trying to reconnect');
        var options = {
          timeout: 60,
          onSuccess: onConnect,
          onFailure: onFailure,
          useSSL: MQTT.USE_SSL
        };
        if(MQTT.USE_AUTH){
          //console.log('use auth');
          options.userName = clientId;
          options.password = store.get('admin_token').tokenType + ' ' + store.get('admin_token').authToken;
        }
        client.connect(options);
      }

      function onMessageArrived(message) {
        var destination = message.destinationName;
        var payload = JSON.parse(message.payloadString);
        payload.receivedOn = new Date().getTime();
        if(angular.isDefined(payload.loc)){
          if(/^loc\/drv\/[a-f\d]{24}\/available/.test(destination)){
            addDriverMarkerFn(payload, 'available', false);
          }else if(/^loc\/drv\/[a-f\d]{24}\/ongoing/.test(destination)){
            addDriverMarkerFn(payload, 'ongoing', false);
          }
          else if(/^loc\/ryl\/drv\/[a-f\d]{24}\/available/.test(destination)){
            addDriverMarkerFn(payload, 'available', true);
          }else if(/^loc\/ryl\/drv\/[a-f\d]{24}\/ongoing/.test(destination)){
            addDriverMarkerFn(payload, 'ongoing', true);
          }else if(/^rqs\//.test(destination)){
            console.log(payload);
            addPassengerRequestMarkerFn(payload);
          }
        }

        // if(vm.filter.users === '' || vm.filter.users === 'ALL'){
        //   addMarker(payload, destination);
        // }else if(vm.filter.users === 'DRIVERS' && payload.actorInfo['@class'] === '.DriverInfo'){
        //   if(vm.filter.taxiLine === '' || vm.filter.taxiLine === 'ALL'){
        //     addMarker(payload, destination);
        //   }else if(vm.filter.taxiLine === payload.actorInfo.controllerInfo.name){
        //     addMarker(payload, destination);
        //   }
        // }else if(vm.filter.users === 'PASSENGERS' && payload.actorInfo['@class'] === '.PassengerInfo'){
        //   addMarker(payload, destination);
        // }
      }

      function parseLocationFn(loc){
        var tmp = loc.split(',');
        return {
          latitude: tmp[0],
          longitude: tmp[1]
        }
      }

      // $scope.$watch('vm.filter.users', function(newVal){
      //   if(newVal === 'DRIVERS'){
      //     for(var prop in markers){
      //       if(markers.hasOwnProperty(prop)){
      //         if(markers[prop].userType === 'PASSENGERS'){
      //           markers[prop].setMap(null);
      //           delete markers[prop];
      //         }
      //       }
      //     }
      //   }else if(newVal === 'PASSENGERS'){
      //     for(var prop in markers){
      //       if(markers.hasOwnProperty(prop)){
      //         if(markers[prop].userType === 'DRIVERS'){
      //           markers[prop].setMap(null);
      //           delete markers[prop];
      //         }
      //       }
      //     }
      //   }
      // }, true);

      // $scope.$watch('vm.filter.taxiLine', function(newVal){
      //   if(vm.filter.taxiLine !== '' && vm.filter.taxiLine !== 'ALL'){
      //     for(var prop in markers){
      //       if(markers.hasOwnProperty(prop)){
      //         if(markers[prop].controller !== newVal){
      //           markers[prop].setMap(null);
      //           delete markers[prop];
      //         }
      //       }
      //     }
      //   }
      // }, true);

      $scope.$watch('vm.filter.country', function(newVal, oldVal){
        if(newVal !== oldVal){
          setTimeout(function(){$('select[multiple="multiple"]').multipleSelect("refresh");},100);
        }
      });

      $scope.$watch('vm.filter.state', function(newVal){
          // for (var i = 0; i < vm.testBound.length; i++) {
          //   vm.testBound[i].setMap(null);
          // }
          // vm.testBound=[];
          // checkRectangleBounds();

          for(var prop in markers){
            if(markers.hasOwnProperty(prop)){
              var lat = markers[prop].getPosition().lat();
              var lng = markers[prop].getPosition().lng();
              var result = checkPointInnerBounds(lat,lng);
              if (!result) {
                markers[prop].setMap(null);
                delete markers[prop];
              }
            }
          }
      }, true);

      function getMarkersLengthFn(type){
        var hasOwn = Object.prototype.hasOwnProperty;
        var count = 0;
        for (var k in markers){
          if (hasOwn.call(markers, k)){
            if(markers[k].userType === type){
              ++count;
            }
            if (type === 'DIGITAL'){
              if(markers[k].userType === 'DRIVERS'){
                if(vm.digitalList.indexOf(k) > -1){
                  ++count;
                }
              }
            }
          }
        }
        return count;
      }

      function checkPointInnerBounds(lat,lng){
        var point = new google.maps.LatLng(lat, lng);
        var response=false;
        // console.log(vm.statesArr);
        if (vm.filter.state.length!=0) {
          // console.log('entro');
          angular.forEach(vm.boundsArr, function(value, key) {
            // console.log(value);
            // console.log(key);
            if (vm.filter.state.indexOf(key)!=-1) {
              var result = value.bounds.contains(point);
              if (result) {
                response = true;
              }
            }
          });
        } else {
          if (vm.AllPermision==true) {
            response = true;
          } else {
            // console.log('salio');
            angular.forEach(vm.boundsArr, function(value, key) {
              // console.log(value);
              // console.log(key);
              var result = value.bounds.contains(point);
              if (result) {
                response = true;
              }
            });
          }
        }

        return response;

        var rectangle = new google.maps.Rectangle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: map,
          bounds: bounds
        });
        var result = bounds.contains(point);
        // console.log(result);
        map.fitBounds(bounds);
        return result;
      }

      function checkRectangleBounds(){
        angular.forEach(vm.boundsArr, function(value, key) {
          if (vm.filter.state.indexOf(key)!=-1) {
            var rectangle = new google.maps.Rectangle({
              strokeColor: '#FF0000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#FF0000',
              fillOpacity: 0.35,
              map: map,
              bounds: value.bounds
            });
            vm.testBound.push(rectangle);
          }
        });
      }
      function checkPointInnerBounds_test(lat,lng){
        var point = new google.maps.LatLng(lat, lng);
        var response=false;
        if (vm.filter.state.length!=0) {
          // console.log('entro');
          angular.forEach(vm.boundsArr, function(value, key) {
            // console.log(value);
            // console.log(key);
            if (vm.filter.state.indexOf(key)!=-1) {
              var result = value.bounds.contains(point);
              if (result) {
                response = true;
              }
            }
          });
        } else {
          // console.log('salio');
          angular.forEach(vm.boundsArr, function(value, key) {
            // console.log(value.bounds);
            // console.log(key);
            var result = value.bounds.contains(point);
            var rectangle = new google.maps.Rectangle({
              strokeColor: '#FF0000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#FF0000',
              fillOpacity: 0.35,
              map: map,
              bounds: value.bounds
            });
            if (result) {
              response = true;
            }
          });
        }

        return response;

        var result = bounds.contains(point);
        // console.log(result);
        map.fitBounds(bounds);
        return result;
      }

      function setCenter(name){
        if (!map || !map.fitBounds) {
          console.log('map undefined');
          $timeout(function() {
            setCenter(name);
          },200);
          return true;
        }
        // $timeout(function() {
          var country = name;
          adminService.getStatesBounds(name, country).then(function(data){
            // console.log(data);
            if (data.results[0].geometry && data.results[0].geometry.bounds) {
              var southwest = data.results[0].geometry.bounds.southwest;
              var northeast = data.results[0].geometry.bounds.northeast;
              var bounds = new google.maps.LatLngBounds(southwest,northeast);
              map.fitBounds(bounds);
            }
          }, function(error){
            console.log(error);
          });
        // },500);
      }

      function getStatesBounds(name, country){
        var time = 200 * vm.boundRequests;
        $timeout(function() {
          adminService.getStatesBounds(name, country).then(function(data) {
            vm.boundRequests--;
            if (data.results && data.results.length > 0 &&
              data.results[0].geometry && data.results[0].geometry.bounds) {
              var southwest = data.results[0].geometry.bounds.southwest;
              var northeast = data.results[0].geometry.bounds.northeast;
              var bounds = new google.maps.LatLngBounds(southwest, northeast);
              vm.boundsArr[name] = {};
              vm.boundsArr[name].bounds = bounds;
            }
          }, function(error){
            vm.boundRequests--;
            console.log(error);
          });
        }, time);
      }

      var obj={};
      obj.startDate = moment().subtract(1, 'hours').format();
      obj.endDate = moment().hours(23).minutes(59).seconds(59).milliseconds(999).format();

      // When the DOM element is removed from the page,
      // AngularJS will trigger the $destroy event on
      // the scope. This gives us a chance to cancel any
      // pending timer that we may have.

    }
  }
})();
