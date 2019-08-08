(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:MainCtrl
   * @description
   * # MainCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('MainCtrl', mainCtrl);

  function mainCtrl(store, $location, $timeout, authenticationService, utilService, GOOGLE_API_KEY) {
    var vm = this;

    vm.getUsername = getUsernameFn;
    vm.isLoggedIn = isLoggedInFn;
    vm.isSelected = isSelectedFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.logout = logoutFn;

    function closeMenu(){
      if ($('.menu-container-mobile a[href!=""]').length==0) {
        setTimeout(function () {
          closeMenu();
        },100);
        return true;
      } else {
        $('.menu-container-mobile a[href!=""]').on('click', function(){
          $('.navbar-toggle').click() //bootstrap 3.x by Richard
        });
        return true;
      }
    }

    closeMenu();

    function isLoggedInFn(){
      return store.get('admin_user') && store.get('admin_user').id;
    }
    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function logoutFn(){
      authenticationService.clearCredentials();
      $timeout(function(){
        $location.path('/login');
      }, 100);
    }

    function getUsernameFn(){
      if(store.get('admin_user') && store.get('admin_user').id){
        return store.get('admin_user').firstName + ' ' + store.get('admin_user').lastName;
      }
    }

    function isSelectedFn(path){
      if($location.path() === path) {
        return 'background-color:#1c2d48; border-radius: 5px; color: white;';
      } else {
        return '';
      }
    }

  }
})();
