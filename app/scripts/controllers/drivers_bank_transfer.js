(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PassengersCtrl
   * @description
   * # PassengersCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('DriversBankTransferCtrl', driversBankTransferCtrl);

  function driversBankTransferCtrl($scope, adminService, blockUI, $timeout, utilService, ngToast, $modal) {
    if (utilService.getUserPermissionBase('read:commission_driver')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;
    vm.loading = {};
    vm.passengers = [];
    vm.totalPassengers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };

    vm.predicate = 'status';
    vm.reverse = true;
    vm.filter = {
      country: undefined,
      states: undefined,
      searchText: undefined,
      bank: undefined,
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
    vm.showCalendar = showCalendar;
    vm.openChangeStatus = openChangeStatusFn;
    vm.openDriverProfile = openDriverProfileFn;
    vm.getBankTransferToCSV = getBankTransferToCSVFn;

    adminService.getSupportedBanksForBankTransfers('VE', 'DRIVER')
      .then(function (data) {
        vm.banks = data;
      });

    $scope.$watch('[vm.filter.date, vm.filter.status, vm.filter.bank]', function (newVal, oldVal) {
      if ((newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2])) {
        vm.controls.currentPage = 1;
        getDrivers();
      }
    }, true);


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
      if (newVal !== oldVal) {
        getDrivers();
      }
    });

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = undefined;
      searchFlag = false;
      getDrivers();
    }

    function searchDriversFn() {
      if ((vm.filter.searchText.indexOf("@") > -1) && (vm.filter.searchText.indexOf(".") > vm.filter.searchText.indexOf("@"))) {
        vm.filter.searchText = '"' + vm.filter.searchText + '"';
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

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDrivers();
    }

    function getDrivers() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('driversList');
      myBlock.start();
      adminService.getAllBankTransfer(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.status, vm.filter.bank, vm.filter.searchText, 'DRIVER', 'BANK_TRANSFER', false)
        .then(function (passengers) {
          vm.passengers = passengers.data;
          vm.totalPassengers = passengers.total;
          myBlock.stop();
        }, function (error) {
          if ((error.status === 401 || error.status === 403) && (error.data.code === 618)) {
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

    function getBankTransferToCSVFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getAllBankTransfer(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.status, vm.filter.bank, vm.filter.searchText, 'DRIVER', 'BANK_TRANSFER', true);
    }

    function openChangeStatusFn(transfer) {
      if (!vm.getUserPermission('update:commission_driver')) {
        return;
      }
      var transferModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/driver_bank_transfer_status.html',
        size: 'sm',
        controller: 'DriverBankTransferStatusModalCtrl',
        controllerAs: 'vm',
        resolve: {
          transfer: function () {
            return transfer;
          }
        }
      });
      transferModalInstance.result.then(function (selectedItem) {
        getDrivers();
      }, function () {
      });
    }

    function openDriverProfileFn(driver) {
      var driverModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/driver.html',
        size: 'sm',
        controller: 'DriverModalCtrl',
        controllerAs: 'vm',
        resolve: {
          driver: function () {
            return driver.user;
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
})();
