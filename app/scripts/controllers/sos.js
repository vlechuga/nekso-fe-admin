(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:SosCtrl
   * @description
   * # SosCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('SosCtrl', sosCtrl);

  function sosCtrl($scope, adminService, $modal, blockUI, $filter, utilService, ngToast) {
    if (utilService.getUserPermissionBase('read:sos')) {
      return true;
    }

    String.prototype.capitalize = function(lower) {
      return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    };

    var vm = this;
    var searchFlag = false;

    vm.loading = {};
    vm.sos = [];
    vm.totalSos = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };

    vm.filter = {
      states: undefined,
      country: undefined,
      taxiLine: '',
      status: '',
      searchText: '',
      date: {
        startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
        endDate: moment().hours(23).minutes(59).seconds(59).milliseconds(999),
        opts: {
          timePicker: true,
          timePicker24Hour: true,
          locale: {
            applyClass: 'btn-green',
            applyLabel: "Apply",
            fromLabel: "From",
            format: "DD/MM/YYYY hh:mm A",
            toLabel: "To",
            cancelLabel: 'Cancel',
            customRangeLabel: 'Custom range'
          },
          ranges: {
            'Today': [moment().hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Yesterday': [moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().subtract(1, 'days').hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Last 7 Days': [moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Last 30 Days': [moment().subtract(30, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'All': [moment().year(2015).month(10).days(1).hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)]
          }
        }
      }
    };
    vm.taxiLines = [];
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.openRideDetail = openRideDetailFn;
    vm.openPassengerProfile = openPassengerProfileFn;
    vm.openDriverProfile = openDriverProfileFn;
    vm.getRideStatus = getRideStatusFn;
    vm.exportToCsv = exportToCsvFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.editSosNotificationStatus = editSosNotificationStatusFn;
    vm.showCalendar = showCalendar;

    getControllers();

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getSosNotifications();
        }
      }
    });

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.taxiLine, vm.filter.type]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4])){
        getSosNotifications();
      }
    }, true);

    $scope.$watch('[vm.filter.states]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0]) {
        vm.controls.currentPage = 1;
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getSosNotifications();
        }
      }
    }, true);

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getSosNotifications();
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getSosNotifications();
    }

    function editSosNotificationStatusFn(sos){
      adminService.editSosNotificationStatus(sos.id, true)
      .then(function(data){
          sos.userContacted=true;
        }, function(error){
          console.log(error);
        });
    }

    function searchDriversFn(){
      searchFlag = true;
      getSosNotifications();
    }

    function searchDriversOnEnterFn(event){
      if(event.keyCode == 13){
        searchFlag = true;
        getSosNotifications();
      }
    }

    function getSosNotifications(){
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('SosList');
      myBlock.start();
      adminService.getSosNotifications(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.type, vm.filter.status, vm.filter.taxiLine, vm.filter.searchText, vm.filter.country, vm.filter.states)
        .then(function(sos){
          vm.sos = sos.data;
          vm.totalSos = sos.total;
          myBlock.stop();
        }, function(error){
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          }
        });
    }

    function getControllers(){
      adminService.getAllControllers()
        .then(function(controllers){
          for(var i = 0, len = controllers.data.length; i < len; i++){
            var controller = {};
            controller.id = controllers.data[i].id;
            controller.name = controllers.data[i].name;
            vm.taxiLines.push(controller);
          }
        }, function(error){
          console.log(error);
        });
    }

    function openRideDetailFn(ride){
      if (getUserPermissionFn('read:sos')) {
        adminService.getLiveRideDetail(ride.id).then(function(data){
          var rideModalInstance = $modal.open({
            animate: true,
            templateUrl: '../../views/modals/ride.html',
            size: 'lg',
            controller: 'RideModalCtrl',
            controllerAs: 'rideModalVm',
            resolve: {
              ride: function(){
                return data;
              }
            }
          });
        });
      }
    }

    function openPassengerProfileFn(passenger){
      if (getUserPermissionFn('read:sos')) {
        var passengerModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/passenger.html',
          size: 'sm',
          controller: 'PassengerModalCtrl',
          controllerAs: 'vm',
          resolve: {
            passenger: function(){
              return passenger;
            },
            addSuspicious: function () {
              return false;
            },
            rideId: function () {
              return undefined;
            }
          }
        });
      }
    }

    function openDriverProfileFn(driver){
      if (getUserPermissionFn('read:sos')) {
        var driverModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/driver.html',
          size: 'sm',
          controller: 'DriverModalCtrl',
          controllerAs: 'vm',
          resolve: {
            driver: function(){
              return driver;
            },
            addSuspicious: function () {
              return false;
            },
            rideId: function () {
              return undefined;
            }
          }
        });
      }
    }

    function getRideStatusFn(ride){
      if(!angular.isUndefined(ride.status)){
        var state = '';
        switch (ride.status){
          case "ONGOING":
            state = 'Ongoing';
            break;
          case "COMPLETED":
            state = 'Completed';
            break;
          case "CANCELLED":
            state = 'Cancelled';
            if(!angular.isUndefined(ride.statusUpdatedBy)){
              if(ride.statusUpdatedBy === 'DRIVER'){
                state += ' by driver';
              }else if(ride.statusUpdatedBy === 'PASSENGER'){
                state += ' by passenger';
              } else if(ride.statusUpdatedBy === 'SYSTEM'){
                state += ' by system';
              }
            }
            break;
          default:
            break;
        }
        return state;
      }
    }

    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      return adminService.getSosNotifications(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.type, vm.filter.status, vm.filter.taxiLine, vm.filter.searchText, vm.filter.country, vm.filter.states)
        .then(function(rides){
          var toExport = [];
          for(var i = 0, len = rides.data.length; i < len; i++){
            var ride = rides.data[i].data.ride;
            var tmp = {};
            tmp.id = ($filter('idlimit')(ride.id)).toUpperCase();
            tmp.rideDate = $filter('date')(new Date(ride.createdDate), 'dd/MM/yyyy');
            tmp.ridetime = $filter('date')(new Date(ride.createdDate), 'hh:mm a');
            tmp.taxiLine = ride.controller.name;
            tmp.driver = ride.driver.firstName + ' ' + ride.driver.lastName;
            tmp.driverEmail = ride.driver.email;
            tmp.passenger = ride.passenger.firstName + ' ' + ride.passenger.lastName;
            tmp.passengerEmail = ride.passenger.email;
            tmp.pickUp = ride.rideInfo.passengerPickupAddress;
            tmp.destination = ride.rideInfo.passengerDestinationAddress;
            tmp.status = getRideStatusFn(ride);
            if(angular.isDefined(ride.firstTime)){
              tmp.firstTime = ride.firstTime.replace(';', '|');
            }else{
              tmp.firstTime = ride.firstTime;
            }
            toExport.push(tmp);
          }
          vm.loading.export = false;
          return toExport;
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
          vm.loading.export = false;
        });
    }

  }
})();
