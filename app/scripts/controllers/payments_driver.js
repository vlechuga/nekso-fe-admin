(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller: PaymentsDriverCtrl
   * @description
   * # PaymentsDriverCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PaymentsDriverCtrl', paymentsDriverCtrlFn);

  function paymentsDriverCtrlFn($scope, $modal, $window, $location, store, ngToast, utilService, adminService, blockUI) {
    if (utilService.getUserPermissionBase('read:payments')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;
    var initialFilter = {
      searchText: undefined,
      states: undefined,
      country: undefined,
      method: undefined,
      status: undefined,
      payment: {},
      date: {
        startDate: moment().subtract(1, 'day').hours(0).minutes(0).seconds(0).milliseconds(0),
        endDate: moment().subtract(1, 'day').hours(23).minutes(59).seconds(59).milliseconds(999)
      },
      controls: {
        numPerPage: 10,
        currentPage: 1
      }
    };

    loadFn();

    vm.loading = {};
    vm.payments = [];
    vm.selectedPayments = [];
    vm.totalPayments = 0;
    vm.closed = true;
    vm.predicate = 'createdAt';
    vm.reverse = true;
    vm.selectAll = false;
    vm.dateRangePickerOptions = {
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
    };

    vm.openDriverProfile = openDriverProfileFn;
    vm.openHistory = openHistoryFn;
    vm.openPaymentStatusModal = openPaymentStatusModalFn;
    vm.addOrRemovePayment = addOrRemovePaymentFn;
    vm.getDriverPaymentsCsvUrl = getDriverPaymentsCsvUrlFn;
    vm.getDetailCsvUrl = getDetailCsvUrlFn;
    vm.order = orderFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.getPayments = getDriverPaymentsFn;
    vm.closeDay = closeDayFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.search = searchFn;

    $scope.$watch('vm.filter.date', function (newVal, oldVal) {
      if (newVal === null) {
        ngToast.create({
          className: 'danger',
          content: 'Invalid Date'
        });
      }
    });

    $scope.$watch('vm.filter.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.selectAll = false;
        vm.selectedPayments = [];
        getDriverPaymentsFn();
      }
    });


    $scope.$watch('[vm.filter.controls.numPerPage]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0])) {
        vm.filter.controls.currentPage = 1;
        vm.selectAll = false;
        vm.selectedPayments = [];
        getDriverPaymentsFn();
      }
    }, true);

    $scope.$watch('vm.selectAll', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.selectedPayments = [];
        if (newVal) {
          for (var i = 0; i < vm.payments.length; i++) {
            if (vm.payments[i].status !== 'MISSING_INFORMATION') {
              vm.selectedPayments.push(vm.payments[i]);
            }
          }
        }
      }
    }, true);

    function loadFn() {
      if (angular.isDefined(localStorage.payment_driver_filter)) {
        vm.filter = JSON.parse(localStorage.payment_driver_filter);
        getDriverPaymentsFn();
      } else {
        vm.filter = initialFilter;
      }
      setTimeout(function () {
        $('#filter_status').multipleSelect({
          placeholder: "Select status"
        });
      }, 50);
    }

    function searchFn() {
      getDriverPaymentsFn();
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = undefined;
      searchFlag = false;
      getDriverPaymentsFn();
    }

    function searchDriversOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getDriverPaymentsFn();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDriverPaymentsFn();
    }

    function openDriverProfileFn(driver) {
      if (getUserPermissionFn('read:rides')) {
        var driverModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/driver.html',
          size: 'sm',
          controller: 'DriverModalCtrl',
          controllerAs: 'vm',
          resolve: {
            driver: function () {
              return driver;
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

    function openHistoryFn(payment) {
      if (getUserPermissionFn('read:payments')) {
        vm.filter.payment.cycle = payment.cycle;
        vm.filter.payment.status = payment.status;
        store.set('payment_driver_filter', vm.filter);
        $location.path('/payments/driver/detail/' + payment.id + '/' + payment.user.id);
      }
    }

    function openPaymentStatusModalFn() {
      var paymentModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/payments_driver_status_modal.html',
        size: 'sm',
        controller: 'PaymentStatusModalCtrl',
        controllerAs: 'vm',
        resolve: {
          payments: function () {
            return vm.selectedPayments;
          }
        }
      });
      paymentModalInstance.result.then(function (data) {
        vm.selectedPayments = [];
        vm.selectAll = false;
        getDriverPaymentsFn();
      }, function (data) {});
    }

    function getDriverPaymentsFn() {
      $("#close-day-btn").tooltip('show');
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('driverList');
      myBlock.start();
      adminService.getDriverPayments(vm.filter.controls.numPerPage, vm.filter.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.status, vm.filter.method, vm.filter.country, vm.filter.states, vm.filter.searchText, false, false)
        .then(function (data) {
          vm.payments = data.data;
          vm.totalPayments = data.total;
          vm.closed = data.metadata.closed;
          if (!vm.closed) {
            $("#close-day-btn").tooltip('hide');
          }
          myBlock.stop();
        }, function (error) {
          if ((error.status === 401 || error.status === 403) && error.data.code === 618) {
            vm.notAuthMsg = error.data.description;
          } else {
            ngToast.create({
              className: 'danger',
              content: error.statusText
            });
            myBlock.stop();
          }
        });
    }

    function addOrRemovePaymentFn(payment, $event) {
      if (vm.selectedPayments.indexOf(payment) > -1) {
        vm.selectedPayments.splice(vm.selectedPayments.indexOf(payment), 1);
      } else {
        if (payment.method === 'MERCADOPAGO') {
          if (vm.selectedPayments.length === 0) {
            vm.selectedPayments.push(payment);
          } else {
            ngToast.create({
              className: 'warning',
              content: 'Multiple transactions are allowed ONLY with bank account method'
            });
            $event.currentTarget.checked = false;
            return false;
          }
        } else {
          if (vm.selectedPayments.length === 1 && vm.selectedPayments[0].method === 'MERCADOPAGO') {
            ngToast.create({
              className: 'warning',
              content: 'Multiple transactions are allowed ONLY with bank account method'
            });
            $event.currentTarget.checked = false;
            return false;
          } else {
            vm.selectedPayments.push(payment);
          }
        }
      }
    }

    function getDriverPaymentsCsvUrlFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getDriverPayments(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.status, vm.filter.method, vm.filter.country, vm.filter.states, vm.filter.searchText, true, false);
    }

    function getDetailCsvUrlFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getDriverPayments(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.status, vm.filter.method, vm.filter.country, vm.filter.states, vm.filter.searchText, true, true);
    }

    function closeDayFn() {
      if ($window.confirm("Are you sure?")) {
        vm.loading.closeDay = true;
        var stetaIds = [];
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          for (var i = 0; i < vm.filter.states.length; i++) {
            stetaIds.push(vm.filter.states[i].id);
          }
        }
        adminService.postPaymentDriverCloseDay(utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.country, stetaIds)
          .then(function (data) {
            vm.loading.closeDay = false;
            vm.closed = true;
            ngToast.create({
              className: 'success',
              content: 'Successful request.'
            });
          }, function (error) {
            vm.loading.closeDay = false;
            ngToast.create({
              className: 'danger',
              content: error.data.description
            });
          });
      }
    }
  }

})();
