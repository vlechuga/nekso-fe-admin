(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PaymentDriverHistoryCtrl
   * @description
   * # PaymentDriverHistoryCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PaymentDriverHistoryCtrl', paymentDriverHistoryFn);

  function paymentDriverHistoryFn($scope, $rootScope, $timeout, $modal, $routeParams, $location, store, blockUI, adminService, utilService) {
    if (utilService.getUserPermissionBase('read:payments')) {
      return true;
    }
    var vm = this;

    vm.payment = {};
    vm.payment.id = $routeParams.paymentId;
    var driverId = $routeParams.driverId;

    if (angular.isDefined(localStorage.payment_driver_filter)) {
      var json = JSON.parse(localStorage.payment_driver_filter);
      vm.payment.cycle = json.payment.cycle;
      vm.payment.status = json.payment.status;
    }

    vm.loading = {
      export: false,
      load: false
    };
    vm.transactions = [];
    vm.totalTransactions = 0;

    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.predicate = 'createdAt';
    vm.reverse = true;
    vm.filter = {
      types: undefined,
      withSuspicious: undefined,
      status: undefined
    };
    vm.lastRide = null;

    vm.addNote = addNoteFn;
    vm.viewNote = viewNoteFn;
    vm.exportToCsv = exportToCsvFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.return = returnFn;
    vm.getDriverPaymentsDetailCsvUrl = getDriverPaymentsDetailCsvUrlFn;

    getLiveDriverDetailFn(driverId);
    getDriverPaymentsDetailFn();

    $scope.$watch('[vm.controls.numPerPage, vm.filter.types, vm.filter.withSuspicious]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2]) {
        getDriverPaymentsDetailFn();
      }
    }, true);

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getDriverPaymentsDetailFn();
      }
    });

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function getDriverPaymentsDetailFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('paymentsDriverHistoryList');
      myBlock.start();
      adminService.getDriverPaymentsDetail(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, vm.payment.id, vm.filter.status, vm.filter.types, vm.filter.withSuspicious, false)
        .then(function (transactions) {
          vm.transactions = transactions.data;
          vm.totalTransactions = transactions.total;
          vm.metadata = transactions.metadata;
          myBlock.stop();
        }, function (error) {
          myBlock.stop();
        });
    }

    function exportToCsvFn() {
      vm.loading.export = true;
      $timeout(function () {
        vm.loading.export = false;
      }, 5 * 1000);
    }

    function addNoteFn(paymentTransaction) {
      var invalidateModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/payments_driver_add_note_modal.html',
        size: 'sm',
        controller: 'PaymentDriverNoteModalCtrl',
        controllerAs: 'vm',
        resolve: {
          paymentId: function () {
            return vm.payment.id;
          },
          transaction: function () {
            return paymentTransaction;
          }
        }
      });
      invalidateModalInstance.result.then(function (item) {
      }, function () {
        getDriverPaymentsDetailFn();
      });
    }

    function viewNoteFn(paymentTransaction) {
      var invalidateModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/payments_driver_view_note_modal.html',
        size: 'sm',
        controller: 'PaymentDriverNoteModalCtrl',
        controllerAs: 'vm',
        resolve: {
          paymentId: function () {
            return vm.payment.id;
          },
          transaction: function () {
            return paymentTransaction;
          }
        }
      });
    }

    function getLiveDriverDetailFn(id) {
      adminService.getLiveDriverDetail(id).then(function (response) {
        vm.driver = response;
        if (angular.isDefined(vm.driver.profilePictureId)) {
          vm.driver.profileImg = adminService.getPictureUrl(vm.driver.profilePictureId, '100x100');
        }
        if (angular.isDefined(vm.driver.carInfo.pictureId)) {
          vm.driver.carInfo.carPictureUrl = adminService.getPictureUrl(vm.driver.carInfo.pictureId, '100x100');
        }
        vm.driver.carInfo.colorName = adminService.findColor(vm.driver.carInfo.color).colorEn;
        vm.pathSourceImageForCancelledPercent = utilService.getPathSourceImageForCancelledPercent(vm.driver.cancelledPercentage);
        adminService.getLiveDriverLastRide(vm.driver.id)
          .then(function (data) {
            vm.lastRideDetail = data;
          });
      }, function (error) {});
    }

    function returnFn() {
      vm.selectedPayment = undefined;
      $location.path('/payments/driver/');
    }

    function getDriverPaymentsDetailCsvUrlFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getDriverPaymentsDetail(0, 0, orderBy, vm.payment.id, vm.filter.status, vm.filter.types, vm.filter.withSuspicious, true);
    }

  }
})();
