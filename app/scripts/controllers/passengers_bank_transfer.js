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
    .controller('PassengersBankTransferCtrl', passengersBankTransferCtrl);

  function passengersBankTransferCtrl($scope, adminService, blockUI, $timeout, utilService, ngToast, $modal) {
    if (utilService.getUserPermissionBase('read:bank_transfer')) {
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
    vm.openUploadCsv = openUploadCsvFn;
    vm.cashBox = cashBoxFn;
    vm.openPassengerProfile = openPassengerProfileFn;
    vm.getBankTransferToCSV = getBankTransferToCSVFn;

    adminService.getSupportedBanksForBankTransfers('VE', 'PASSENGER')
      .then(function (data) {
        vm.banks = data;
      });

    $scope.$watch('[vm.filter.date, vm.filter.status, vm.filter.bank]', function (newVal, oldVal) {
      if ((newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2])) {
        vm.controls.currentPage = 1;
        getPassengers();
      }
    }, true);


    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getPassengers();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getPassengers();
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
      getPassengers();
    }

    function searchDriversFn() {
      if ((vm.filter.searchText.indexOf("@") > -1) && (vm.filter.searchText.indexOf(".") > vm.filter.searchText.indexOf("@"))) {
        vm.filter.searchText = '"' + vm.filter.searchText + '"';
      }
      searchFlag = true;
      getPassengers();
    }

    function searchDriversOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getPassengers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getPassengers();
    }

    function getPassengers() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('passengersList');
      myBlock.start();
      adminService.getAllBankTransfer(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.status, vm.filter.bank, vm.filter.searchText, 'PASSENGER', 'BANK_TRANSFER', false)
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
        vm.filter.status, vm.filter.bank, vm.filter.searchText, 'PASSENGER', 'BANK_TRANSFER', true);
    }

    function openChangeStatusFn(transfer) {
      if (!vm.getUserPermission('update:bank_transfer')) {
        return;
      }
      var transferModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/passengers_bank_transfer_status.html',
        size: 'sm',
        controller: 'BankTransferStatusModalCtrl',
        controllerAs: 'vm',
        resolve: {
          transfer: function () {
            return transfer;
          }
        }
      });
      transferModalInstance.result.then(function (selectedItem) {
        getPassengers();
      }, function () {
      });
    }

    function openUploadCsvFn() {
      var transferModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/passengers_bank_transfer_csv.html',
        size: 'sm',
        controller: 'BankTransferCsvModalCtrl',
        controllerAs: 'vm',
        resolve: {
          banks: function () {
            return vm.banks;
          }
        }
      });
      transferModalInstance.result.then(function (selectedItem) {
        getPassengers();
      }, function () {
      });
    }

    function cashBoxFn() {
      vm.csvUrl = adminService.cashBoxBankTransfer(utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate));
    }

    function openPassengerProfileFn(passenger) {
      var passengerModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/passenger.html',
        size: 'sm',
        controller: 'PassengerModalCtrl',
        controllerAs: 'vm',
        resolve: {
          passenger: function () {
            return passenger.user;
          },
          addSuspicious: function () {
            return true;
          },
          rideId: function () {
            return undefined;
          }
        }
      });
    }

  }
})();
