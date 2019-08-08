/**
 * Created by abarazarte on 03/02/17.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:BankTransferCsvModalCtrl
   * @description
   * # BankTransferCsvModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('BankTransferCsvModalCtrl', bankTransferCsvModalCtrl);

  function bankTransferCsvModalCtrl($modalInstance, utilService, ngToast, adminService, banks) {
    if (utilService.getUserPermissionBase('update:bank_transfer')) {
      return true;
    }

    var vm = this;
    vm.banks = banks;
    vm.file = undefined;
    vm.loading = false;

    vm.close = closeFn;
    vm.send = sendFn;

    function closeFn() {
      $modalInstance.dismiss();
    }

    function sendFn() {
      vm.loading = true;
      adminService.conciliationBankTransferByCSV(vm.bank, vm.file)
        .then(function (success) {
          vm.loading = false;
          ngToast.create({
            className: 'success',
            content: success + ' executed requests'
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
