/**
 * Created by abarazarte on 29/02/16.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RecoverPasswordCtrl
   * @description
   * # RecoverPasswordCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RecoverPasswordCtrl', recoverPassword);

      function recoverPassword(authenticationService, $modalInstance, email) {

        var vm = this;

        vm.alertModal = {};
        vm.loading = {};
        vm.email = email;

        vm.closeAlert = closeAlertFn;
        vm.recoverPassword = recoverPasswordFn;

        function recoverPasswordFn(){
          vm.loading.recover = true;
          authenticationService.recoverPassword(vm.email)
            .then(function(data){
              if(data.status === 404){
                vm.alertModal = {
                  type: 'danger',
                  msg: 'Correo electrónico incorrecto'
                };
                vm.loading.recover = false;
              } else if(data.status === 500 || data.status === 406 ){
                vm.alertModal = {
                  type: 'danger',
                  msg: 'No hemos podido procesar la solicitud'
                };
                vm.loading.recover = false;
              } else{
                vm.loading.recover = false;
                $modalInstance.close('Email con instrucciones enviado satisfactoriamnte');
              }
            }, function(error){
              vm.loading.recover = false;
              console.log(error);
            });
        }

        function closeAlertFn() {
          vm.alertModal = {};
        }
    }

})();
