/**
 * Created by abarazarte on 03/02/17.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PaymentStatusModalCtrl
   * @description
   * # PaymentStatusModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PaymentStatusModalCtrl', paymentStatusModalCtrlFn);

  function paymentStatusModalCtrlFn($modalInstance, $window, ngToast, adminService, utilService, payments) {
    if (utilService.getUserPermissionBase('update:payments')) {
      return true;
    }

    var vm = this;

    vm.payment = payments[0];
    vm.selectedMethod = vm.payment.method;
    vm.transactionId = undefined;
    vm.selectedStatus = undefined;
    vm.selectedStatusReason = undefined;
    vm.loading = {};

    vm.close = closeFn;
    vm.updatePaymentStatus = updatePaymentStatusFn;

    function closeFn() {
      $modalInstance.dismiss();
    }

    function updatePaymentStatusFn() {
        vm.loading = true;
        adminService.updatePaymentStatus(payments, {
          status: vm.selectedStatus,
          method: vm.selectedMethod,
          reason: vm.selectedStatusReason,
          transactionId: vm.transactionId
        }, vm.comments)
          .then(function (data) {
            vm.loading = false;
            ngToast.create({
              className: 'success',
              content: 'Successful request.'
            });
            $modalInstance.close();
          }, function (error) {
            vm.loading = false;
            ngToast.create({
              className: 'danger',
              content: error.data.description
            });
          });
    }

  }
})();
