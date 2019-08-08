
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DriverBankTransferStatusModalCtrl
   * @description
   * # DriverBankTransferStatusModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('DriverBankTransferStatusModalCtrl', driverBankTransferStatusModalCtrlFn);

  function driverBankTransferStatusModalCtrlFn($modalInstance, $window, ngToast, adminService, utilService, transfer) {
    if (utilService.getUserPermissionBase('update:commission_driver')) {
      return true;
    }

    var vm = this;
    vm.transfer = transfer;
    vm.transactionId = undefined;
    vm.selectedStatus = undefined;
    vm.selectedStatusReason = undefined;
    vm.loading = false;

    vm.close = closeFn;
    vm.updateStatus = updateStatusFn;

    function closeFn() {
      $modalInstance.dismiss();
    }

    function updateStatusFn() {
        vm.loading = true;
        adminService.putBankTransferChangeStatus(vm.transfer.id, vm.status, vm.comment)
          .then(function (success) {
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
