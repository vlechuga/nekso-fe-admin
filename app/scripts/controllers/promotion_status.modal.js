/**
 * Created by abarazarte on 01/07/16.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PromotionStatusModalCtrl
   * @description
   * # PromotionStatusModalCtrl
   * Administrator of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PromotionStatusModalCtrl', promotionStatusModalCtrl);

  function promotionStatusModalCtrl($modalInstance, promotion, promotionName, status, adminService){
    var vm = this;

    vm.status = status;
    vm.promotioName = promotionName;

    vm.loading = false;

    vm.close = closeFn;
    vm.changePromotionStatus = changePromotionStatusFn;

    function changePromotionStatusFn(){
      vm.loading = true;
      adminService.setPromotionStatus(promotion, status, {reason: vm.reason})
        .then(function(data){
          vm.loading = false;
          closeFn();
        }, function(error){
          console.log(error);
        })
    }

    function closeFn(){
      $modalInstance.dismiss();
    }
  }
})();
