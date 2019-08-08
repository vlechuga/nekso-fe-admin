/**
 * Created by abarazarte on 20/02/17.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CommChannelPreviewModalCtrl
   * @description
   * # CommChannelPreviewModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CommChannelPreviewModalCtrl', commChannelPreviewModalCtrlFn);

  function commChannelPreviewModalCtrlFn($modalInstance, message, $location){
    var vm = this;

    vm.message = angular.copy(message);
    vm.close = closeFn;
    vm.edit = editFn;

    function editFn(){
      $location.path('/communication/channel/messages/'+vm.message.id);
    }

    function closeFn(){
      $modalInstance.dismiss();
    }



  }
})();
