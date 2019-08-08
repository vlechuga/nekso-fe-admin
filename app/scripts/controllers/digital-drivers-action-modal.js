/**
 * Created by abarazarte on 15/07/16.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DigitalDriversCtrl
   * @description
   * # DigitalDriversCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('DigitalDriversActionModalCtrl', digitalDriversActionModalCtrl);

  function digitalDriversActionModalCtrl($modalInstance, $scope, adminService, driver, states, ngToast, rejectReasons){
    var vm  = this;

    vm.driver = driver;
    vm.states = states;
    vm.action = undefined;
    vm.checklist = {};
    vm.controllers = [];
    vm.rejectOptions = [];
    vm.selectedController = undefined;
    vm.selectedControllerName = '';
    vm.loading = {};

    vm.close = closeFn;
    vm.confirmAction = confirmActionFn;
    vm.toggleReason = toggleReasonFn;
    vm.disableConfirmButton = disableConfirmButtonFn;

    vm.rejectReasonsList = rejectReasons;
    vm.reject={};
    vm.reject.reasons=[];

    getControllers();

    $scope.$watch('vm.selectedController', function(newValue, oldValue){
      if(newValue !== oldValue){
        vm.selectedControllerName = JSON.parse(newValue).name;
      }
    });

    $scope.$watch('vm.action', function(newValue, oldValue){
      if(newValue !== oldValue){
        vm.selectedController = undefined;
        vm.rejectOptions = [];
      }
    });

    function closeFn(){
      $modalInstance.close();
    }

    function getControllers(){
      adminService.getAllControllers(undefined, undefined, '+name', undefined, undefined, undefined, vm.states, undefined, false )
        .then(function(data){
          var controllers = data.data;
          for(var i = 0; i < controllers.length; i++){
            var controller = controllers[i];
            if(controller.status === 'OK'){
              vm.controllers.push(controller);
            }
          }
        }, function(error){
          console.log(error);
        });
    }

    function confirmActionFn(){
      vm.loading.confirm = true;
      if(vm.action === 'APPROVE'){
        adminService.approveDigitalDriver(driver.id, JSON.parse(vm.selectedController).id)
          .then(function (data) {
            ngToast.create({
              className: 'success',
              content: 'Digital driver has been approved.'
            });
            vm.loading.confirm = false;
            $modalInstance.dismiss();
          }, function(error){
            vm.loading.confirm = false;
            ngToast.create({
              className: 'danger',
              content: 'Error approving digital driver. ' + error.data.description
            });
          })
      }
      else if(vm.action === 'REJECT'){
        adminService.rejectDigitalDriver(driver.id, vm.reject.reasons)
          .then(function(data){
            ngToast.create({
              className: 'success',
              content: 'Digital driver has been rejected.'
            });
            vm.loading.confirm = false;
            $modalInstance.dismiss();
          }, function(error){
            vm.loading.confirm = false;
            ngToast.create({
              className: 'danger',
              content: 'Error rejecting digital driver. ' + error.data.description
            });
          });
      }
    }

    function disableConfirmButtonFn(){
      if(vm.action === 'APPROVE'){
        return angular.isUndefined(vm.selectedController);
      }
      else if(vm.action === 'REJECT'){
        return vm.reject.reasons.length < 1;
      }
    }

    function toggleReasonFn(idx) {
      if (vm.rejectOptions.indexOf(idx) == -1) {
        vm.rejectOptions.push(idx);
      } else {
        vm.rejectOptions.splice(vm.rejectOptions.indexOf(idx), 1);
      }
    }
  }
})();
