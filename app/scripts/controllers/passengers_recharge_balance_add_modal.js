
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
    .controller('PassengerRechargeBalanceAddModalCtrl', passengerRechargeBalanceAddModalCtrlFn);

  function passengerRechargeBalanceAddModalCtrlFn($modalInstance, blockUI, ngToast, adminService, utilService) {
    if (utilService.getUserPermissionBase('update:recharge_balance')) {
      return true;
    }

    var vm = this;
    vm.loading = false;

    vm.close = closeFn;
    vm.createPayment = createPaymentFn;
    vm.findPassenger = findPassengerFn;

    function closeFn() {
      $modalInstance.dismiss();
    }

    function createPaymentFn() {
        vm.loading = true;
        adminService.createPayment(vm.passenger, vm.source, vm.amount, vm.comment)
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

    function findPassengerFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('paymentList');
      myBlock.start();
      adminService.getAllPassengers(5, 0, orderBy,
        undefined, undefined,
        undefined, undefined, vm.search, undefined, undefined, undefined, undefined, 'OK', false)
        .then(function (passengers) {
          vm.passengers = passengers.data;
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

  }
})();
