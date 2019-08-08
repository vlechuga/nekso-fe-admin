(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PhoneCode
   * @description
   * # PhoneCode
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PhoneCodeCtrl', phoneCode);

  function phoneCode($scope, adminService, blockUI, utilService, ngToast) {
    if (utilService.getUserPermissionBase('read:phone_code')) {
      return true;
    }

    var vm = this;

    adminService.getCountries().then(function (supported) {
      vm.countryData = supported;
    });

    vm.phoneNumber = '';
    vm.code = '';
    vm.countryCode = '';
    vm.phoneNumberAchieve = '';
    vm.codeAchieve = '';
    vm.countryCodeAchieve = '';

    vm.getCode = getCodeFn;
    vm.getCodeAchieve = getCodeAchieveFn;

    function getCodeFn() {
      var myBlock = blockUI.instances.get('mainList');
      myBlock.start();
      adminService.getPhoneCode(vm.countryCode + vm.phoneNumber)
        .then(function (code) {
          vm.code = code;
          myBlock.stop();
        }, function (error) {
          if ((error.status === 401 || error.status === 403) && (error.data.code === 618)) {
            vm.notAuthMsg = error.data.description;
          } else if (error.status === 404) {
            ngToast.create({
              className: 'warning',
              content: 'Code not found.'
            });
            myBlock.stop();
          } else {
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          }
        });
    }

    function getCodeAchieveFn() {
      var myBlock = blockUI.instances.get('mainListAchieve');
      myBlock.start();
      adminService.getAchieveCode(vm.countryCodeAchieve + vm.phoneNumberAchieve)
        .then(function (code) {
          vm.codeAchieve = code;
          myBlock.stop();
        }, function (error) {
          if ((error.status === 401 || error.status === 403) && (error.data.code === 618)) {
            vm.notAuthMsg = error.data.description;
          } else if (error.status === 404) {
            ngToast.create({
              className: 'warning',
              content: 'Code not found.'
            });
            myBlock.stop();
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
