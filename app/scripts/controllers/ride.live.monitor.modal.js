(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RideLiveMonitorModalCtrl
   * @description
   * # RideLiveMonitorModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RideLiveMonitorModalCtrl', rideLiveMonitorModalCtrl);

  function rideLiveMonitorModalCtrl($modalInstance, ride, adminService, $timeout, $compile, $scope, utilService, store, MQTT) {

    var vm = this;
    var map;
    var markers = {};
    var infowindow = new google.maps.InfoWindow();
    var clientId;
    var client;
    vm.digitalList = [];
    // console.log(ride);

    vm.ride = ride;
    vm.close = closeFn;

    function closeFn(){
      $modalInstance.dismiss();
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
        scrollwheel: false,
        noSupress:true
      });
      // fixInfoWindow();

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
      if (ride.audiences && ride.audiences[0]) {
        for (var i = 0; i < ride.audiences.length; i++) {
          var tmp = createDriverMarker(ride.audiences[i]);
          bounds.extend(tmp.position);
        }
      }
      map.fitBounds(bounds);
      getSuscriptionChannels(ride.pickupLocation.lat, ride.pickupLocation.lon, 15);
    }

    function createDriverMarker(obj){
        var driver = obj.driver;
        var userType = '';
        var zindex = 9999999;
        userType = 'DRIVERS';

        var marker =  new google.maps.Marker({
          position: {
            lat: obj.location.lat,
            lng: obj.location.lon
          },
          map: map,
          info: '',
          userType: userType,
          icon: 'images/markers/marker_driver_audience.png',
          zIndex: zindex,
          nekso: obj

        });

        google.maps.event.addListener(marker, 'mouseover', function () {
            var marker = this;
            adminService.getDriverProfile(marker.nekso.driver.userId)
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
        });
        google.maps.event.addListener(marker, 'mouseout', function () {
          infowindow.close(map, this);
        });
        return marker;
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
          if(this.nekso_status === 'ongoing'){
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
            // if (this.userType == 'PASSENGERS') {
            //   infowindow.setContent(this.info);
            //   infowindow.open(map, this);
            // } else
            if(this.userType == 'DRIVERS'){
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
      function getImageUrl(driver){
        var url = '';
        if(!angular.isUndefined(driver.profilePictureId)){
          url = adminService.getPictureUrl(driver.profilePictureId, '100x100');
        }else{
          url = 'images/bg-user-profile.png';
        }
        return url;
      }
      function getSuscriptionChannels(lat, lng, zoom){
        vm.quadArr = utilService.getQuadKeys(lat, lng, zoom);
        initMQTT();
      }

      function addDriverMarkerFn(message, status, isRoyal){
        var position = parseLocationFn(message.loc);
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
        for (var i = 0; i < vm.quadArr.length; i++) {
          client.subscribe(vm.quadArr[i]);
        }
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
          }
          // else if(/^loc\/drv\/[a-f\d]{24}\/ongoing/.test(destination)){
          //   addDriverMarkerFn(payload, 'ongoing', false);
          // }
          // else if(/^loc\/ryl\/drv\/[a-f\d]{24}\/available/.test(destination)){
          //   addDriverMarkerFn(payload, 'available', true);
          // }else if(/^loc\/ryl\/drv\/[a-f\d]{24}\/ongoing/.test(destination)){
          //   addDriverMarkerFn(payload, 'ongoing', true);
          // }else if(/^rqs\//.test(destination)){
          //   console.log(payload);
          //   addPassengerRequestMarkerFn(payload);
          // }
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

    $timeout(function(){
      initMap();
    }, 1);

    $timeout(function(){
      google.maps.event.trigger(map, 'resize');
    },100);

  }
})();
