/**
 * Created by abarazarte on 03/02/17.
 */
(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:ConfirmationModalCtrl
   * @description
   * # ConfirmationModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('ConfirmationModalCtrl', confirmationModalFn);

  function confirmationModalFn($modalInstance, data) {
    var vm = this;

    vm.loading = {};

    vm.close = closeFn;
    vm.title=data.title;
    vm.description=data.description;
    vm.acceptStr=data.accept;
    vm.rejectStr=data.reject;
    vm.accept=acceptFn;
    vm.reject=rejectFn;


    function closeFn(){
      $modalInstance.dismiss();
    }

    function acceptFn(){
      $modalInstance.dismiss(true);
    }
    function rejectFn(){
      $modalInstance.dismiss(false);
    }
  }
})();
