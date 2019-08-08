(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RoyalCtrl
   * @description
   * # RoyalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RoyalCtrl', royalCtrl);

  function royalCtrl($scope, adminService, blockUI, $filter, utilService, ngToast, $timeout, $modal) {
    if (utilService.getUserPermissionBase('read:royal')) {
      return true;
    }

    var vm = this;
    vm.loadingMultiSelect = false;

    var searchFlag = false;
    vm.loading = {};
    vm.passengers = [];
    vm.totalPassengers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.filter = {
      searchText: '',
      states: undefined,
      country: undefined,
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
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.getCsvUrl = getCsvUrlFn;
    vm.search = searchFn;
    vm.showCalendar = showCalendar;
    vm.openCarInformation = openCarInformationFn;
    vm.openStatusModal = openStatusModalFn;
    vm.type = 1;

    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getDrivers();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && newVal !== oldVal) {
        getDrivers();
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.royal_status, vm.filter.notification, vm.filter.states]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4])) {
        vm.controls.currentPage = 1;
        getDrivers();
      }
    }, true);

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = '';
      searchFlag = false;
      getDrivers();
    }

    function searchFn() {
      getDrivers();
    }

    function searchDriversFn() {
      // console.log('buscando');
      if ((vm.filter.searchText.indexOf("@") > -1) && (vm.filter.searchText.indexOf(".") > vm.filter.searchText.indexOf("@"))) {
        vm.filter.searchText = '"' + vm.filter.searchText + '"';
        // console.log("you've got an email");
        // console.log(vm.filter.searchText);
      } else {
        // console.log('no hay email');
      }
      searchFlag = true;
      getDrivers();
    }

    function searchDriversOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getDrivers();
      }
    }

    function openCarInformationFn(driver) {
      adminService.getDriverProfile(driver).then(function (driverProfile) {
        if (getUserPermissionFn('read:drivers')) {
          var carModalInstance = $modal.open({
            animate: true,
            templateUrl: '../../views/modals/car.html',
            size: 'md',
            controller: 'CarModalCtrl',
            controllerAs: 'carModalVm',
            resolve: {
              driver: function () {
                return driverProfile;
              }
            }
          });
        }
      });
    }

    function openStatusModalFn(driver) {
      var carModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/royal.html',
        size: 'md',
        controller: 'RoyalModalCtrl',
        controllerAs: 'royalModalVm',
        resolve: {
          driver: function () {
            return driver;
          }
        }
      });
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDrivers();
    }

    function getDrivers() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate: vm.predicate;
      var myBlock = blockUI.instances.get('passengersList');
      myBlock.start();
      var iso = (angular.isDefined(vm.filter.country) && vm.filter.country!==null) ? vm.filter.country.iso : undefined;
      adminService.getRoyalDrivers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.royal_status, iso, vm.filter.states, vm.filter.notification, vm.filter.searchText, false)
        .then(function (drivers) {
          // for(var i = 0, len = drivers.data.length; i < len; i++){
          //   drivers.data[i].fullName = drivers.data[i].firstName + ' ' + drivers.data[i].lastName;
          // }
          vm.drivers = drivers.data;
          vm.total = drivers.total;
          myBlock.stop();
        }, function (error) {
          if ((error.status == 401 || error.status == 403) && (error.data.code == 618)) {
            vm.notAuthMsg = error.data.description;
          } else {
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          }
        });
    }

    function getCsvUrlFn() {
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var iso = (angular.isDefined(vm.filter.country) && vm.filter.country!==null) ? vm.filter.country.iso : undefined;
      return adminService.getRoyalDrivers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.royal_status, iso, vm.filter.states, vm.filter.notification, vm.filter.searchText, true);
    }

  }
})();
