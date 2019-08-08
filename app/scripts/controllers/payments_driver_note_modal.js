/**
 * Created by abarazarte on 03/02/17.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PaymentDriverNoteModalCtrl
   * @description
   * # PaymentDriverInvalidateModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PaymentDriverNoteModalCtrl', paymentDriverNoteModalCtrlFn);

  function paymentDriverNoteModalCtrlFn($modalInstance, ngToast, adminService, paymentId, transaction) {

    var vm = this;
    vm.paymentId = paymentId;
    vm.transaction = transaction;
    vm.loading = false;
    vm.labelAmountNote = 'Amount of note';
    vm.balanceDate = undefined;
    vm.noteAmount = undefined;
    vm.comment = undefined;
    vm.trxType = undefined;
    vm.trxAmount = undefined;

    if (vm.transaction.operation === 'PAYMENT' || vm.transaction.operation === 'PAYMENT_REVERSE') {
      vm.noteTitle = (vm.transaction.operation === 'PAYMENT') ? 'Payment Note' : 'Payment Reverse Note';
      vm.labelAmountNote = 'Balance Amount';
      vm.balanceDate = vm.transaction.createdAt;
      vm.currency = vm.transaction.currency;
      vm.noteAmount = vm.transaction.amount;
      vm.comment = vm.transaction.comment;
    } else if (vm.transaction.reference === undefined) { // new note (credit, debit)
      vm.noteTitle = (vm.transaction.amount > 0) ? 'Debit Note' : 'Credit Note';
      vm.trxType = vm.transaction.reason;
      vm.trxAmount = vm.transaction.amount;
      vm.currency = vm.transaction.currency;
    } else if (vm.transaction.operation === 'CREDIT_NOTE' || vm.transaction.operation === 'DEBIT_NOTE') { // view note detail (credit, debit)
      vm.noteTitle = (vm.transaction.reason === 'CREDIT_NOTE') ? 'Credit Note' : 'Debit Note';
      vm.trxType = vm.transaction.reference.operation;
      vm.trxAmount = vm.transaction.reference.amount;
      vm.currency = vm.transaction.currency;
      vm.noteAmount = vm.transaction.amount;
      vm.comment = vm.transaction.comment;
    } else if (angular.isDefined(vm.transaction.reference) &&
      (vm.transaction.reference.operation === 'CREDIT_NOTE' || vm.transaction.reference.operation === 'DEBIT_NOTE')) { // view note (credit, debit)
      vm.noteTitle = (vm.transaction.reference.operation === 'CREDIT_NOTE') ? 'Credit Note' : 'Debit Note';
      vm.trxType = vm.transaction.reason;
      vm.trxAmount = vm.transaction.amount;
      vm.currency = vm.transaction.currency;
      vm.noteAmount = vm.transaction.reference.amount;
      vm.comment = vm.transaction.reference.comment;
    }

    vm.close = closeFn;
    vm.updatePayments = updatePaymentsFn;

    function closeFn() {
      $modalInstance.close();
    }

    function updatePaymentsFn() {
      if (angular.isDefined(vm.noteTitle) && vm.noteTitle === 'Credit Note') {
        vm.loading = true;
        adminService.postPaymentDriverCreditNote(vm.paymentId, vm.transaction.id, vm.noteAmount, vm.comment)
          .then(function (data) {
            vm.loading = false;
            ngToast.create({
              className: 'success',
              content: 'Note added successfuly'
            });
            $modalInstance.dismiss();
          }, function (error) {
            vm.loading = false;
            ngToast.create({
              className: 'danger',
              content: 'Request: ' + error.statusText + '. ' + error.data.description
            });
          });
      } else if (angular.isDefined(vm.noteTitle) && vm.noteTitle === 'Debit Note') {
        vm.loading = true;
        adminService.postPaymentDriverDebitNote(vm.paymentId, vm.transaction.id, vm.noteAmount, vm.comment)
          .then(function (data) {
            vm.loading = false;
            ngToast.create({
              className: 'success',
              content: 'Note added successfuly'
            });
            $modalInstance.dismiss();
          }, function (error) {
            vm.loading = false;
            ngToast.create({
              className: 'danger',
              content: 'Request: ' + error.statusText + '. ' + error.data.description
            });
          });
      }
    }

  }
})();
