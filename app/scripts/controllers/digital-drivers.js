/**
 * Created by abarazarte on 08/07/16.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DigitalDriversCtrl
   * @description
   * # DigitalDriversCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('DigitalDriversCtrl', digitalDriversCtrl);

  function digitalDriversCtrl($scope, $filter, $modal, adminService, utilService, blockUI, ngToast){
    var vm = this;

    var searchFlag = false;

    adminService.getRejectReasons().then(function(rejectReasons){
      vm.rejectReasons = rejectReasons;
    }, function(error){
      console.log(error);
    });

    vm.drivers = [];
    vm.totalDrivers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      states: undefined,
      country: undefined,
      status: '',
      taxiLine: '',
      searchText: '',
      tag: '',
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
    vm.predicate = 'createdDate';
    vm.reverse = true;

    vm.openDriverProfile = openDriverProfileFn;
    vm.openActionModal = openActionModalFn;
    vm.searchDrivers = searchDriversFn;

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getDrivers();
        }
      }
    });

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.date, vm.filter.status]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3])){
        getDrivers();
      }
    }, true);

    $scope.$watch('[vm.filter.states]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0]) {
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getDrivers();
        }
      }
    }, true);

    function getDrivers(){
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('driversList');
      myBlock.start();
      adminService.getAllDrivers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        undefined, vm.filter.status, undefined, undefined, vm.filter.searchText, 'DIGITAL', undefined, undefined, vm.filter.states, undefined, false, undefined)
        .then(function(drivers) {
          vm.drivers = drivers.data;
          vm.totalDrivers = drivers.total;
          myBlock.stop();
        }, function(error) {
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

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      return adminService.getAllDrivers(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined)
        .then(function(drivers){
          var toExport = [];
          for(var i = 0, len = drivers.data.length; i < len; i++){
            var driver = drivers.data[i];
            var tmp = {};
            tmp.name = driver.firstName + ' ' + driver.lastName;
            tmp.email = driver.email;
            tmp.emailMP = '';
            if(angular.isDefined(driver.mercadopagoInfo) && angular.isDefined(driver.mercadopagoInfo.emailMP)){
              tmp.emailMP = driver.mercadopagoInfo.emailMP;
            }
            tmp.phone = driver.phone;
            tmp.createdDate = $filter('date')(new Date(driver.createdDate), 'dd/MM/yyyy hh:mm a');
            tmp.taxiLine = driver.controller.name;
            tmp.completedRides = driver.ridesCount;
            tmp.rating = driver.rating;
            tmp.status = getDriverStatusFn(driver.status);
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

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag  = false;
      getDrivers();
    }

    function searchDriversFn(){
      searchFlag = true;
      getDrivers();
    }

    function searchDriversOnEnterFn(event){
      if(event.which == 13){
        searchFlag = true;
        getDrivers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDrivers();
    }

    function openDriverProfileFn(driver){
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

    function openActionModalFn(driver){
      var actionModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/digital-driver-action.html',
        size: 'md',
        controller: 'DigitalDriversActionModalCtrl',
        controllerAs: 'vm',
        resolve: {
          driver: function(){
            return driver;
          },
          states: function(){
            return vm.filter.states;
          },
          rejectReasons: function(){
            return vm.rejectReasons;
          }
        }
      });
      actionModalInstance.result.then(function(selectedItem) {
      }, function() {
        getDrivers();
      });
    }

  }
})();
