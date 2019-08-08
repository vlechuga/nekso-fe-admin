(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:LoginCtrl
   * @description
   * # LoginCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('LoginCtrl', loginCtrl);

  function loginCtrl(authenticationService, store, $location, ngToast, utilService, $modal) {

    var vm = this;
    authenticationService.clearCredentials();
    vm.loading = {};
    vm.alert = {};

    vm.closeAlert = closeAlertFn;
    vm.login = loginFn;
    vm.forgotPassword = forgotPasswordFn;

    if (store.get('admin_remember') && store.get('admin_remember').remember) {
      vm.username = store.get('admin_remember').user;
      vm.remember = true;
    }

    function getUserRoleFn() {
      return utilService.getUserRole();
    }

    function closeAlertFn() {
      vm.alert = {};
    }

    function loginFn() {
      vm.loading.login = true;
      authenticationService.authenticate(vm.username, vm.password, vm.remember).then(function (response) {
        authenticationService.getAdminProfile(response.userId).then(function (administrator) {
          vm.loading.login = false;
          administrator.data.authenticated = true;
          store.set('admin_user', administrator.data);
          getHomeFn();
        }, function (error) {
          vm.password = '';
          vm.loading.login = false;
          vm.alert = {
            type: 'danger',
            msg: error.data.description + ' - ' + error.data.message
          };
        });
      }, function (error) {
        vm.password = '';
        vm.loading.login = false;
        vm.alert = {
          type: 'danger',
          msg: error.data.description + ' - ' + error.data.message
        };
      });
    }

    function forgotPasswordFn() {
      var modalInstance = $modal.open({
        animate: true,
        templateUrl: 'views/modals/recover.password.html',
        size: 'md',
        controller: 'RecoverPasswordCtrl',
        controllerAs: 'recoverPasswordVm',
        resolve: {
          email: function () {
            return vm.username;
          }
        }
      });

      modalInstance.result.then(function (result) {
        vm.alert = {};
        vm.alert = {
          type: 'success',
          msg: result
        };
      });
    }

    function getHomeFn() {
      var hasHome;
      if (localStorage && localStorage.admin_user &&
        JSON.parse(localStorage.admin_user).accessLevel &&
        JSON.parse(localStorage.admin_user).accessLevel.length > 0) {

        var accessLevel = JSON.parse(localStorage.admin_user).accessLevel;
        for (var i = 0; i < accessLevel.length; i++) {
          if (accessLevel[i].code.split(':')[0] === 'read') {
            hasHome = '/' + accessLevel[i].code.split(':')[1];
            $location.path(hasHome);
            break;
          }
        }
      } else {
        $location.path('/');
      }
      ngToast.create('Bienvenido');
    }
  }
})();
