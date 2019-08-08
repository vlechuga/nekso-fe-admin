(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.corporate:AddBalanceModalCtrl
   * @description
   * # AddBalanceModalCtrl
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('AddBalanceModalCtrl', AddBalanceModalCtrl);

  function AddBalanceModalCtrl($scope, $modalInstance, $window, $timeout, adminService, ngToast, getUserPermission, blockUI) {

    var vm = this;

    vm.modalTitle = 'Add Balance';
    vm.loading = false;
    vm.corporate = undefined;
    vm.amount = undefined;
    vm.operation = undefined;
    vm.corporates = undefined;
    vm.getUserPermission = getUserPermission;
    vm.corporatesForRecharge = undefined;
    vm.corporatesVE = undefined;
    vm.close = closeFn;
    vm.makeRecharge = makeRechargeFn;
    vm.checkPositive = checkPositiveFn;

    $timeout(function () {
      $('#field_corporate').multipleSelect({
        placeholder: "Select Corporate",
        filter: true,
        single: true
      });
    }, 100);

    $scope.$watch('vm.operation', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === 'DEPOSIT') {
          if (vm.corporatesForRecharge === undefined || vm.corporatesForRecharge.length === 0) {
            getCorporatesForRecharge();
          } else {
            vm.corporates = vm.corporatesForRecharge;
          }
        } else if (newVal === 'ISRL_RETENTION') {
          if (vm.corporatesVE === undefined || vm.corporatesVE.length === 0) {
            getCorporatesFn();
          } else {
            vm.corporates = vm.corporatesVE;
          }
        }
        $timeout(function () {
          $('#field_corporate').multipleSelect("refresh");
        }, 10);
      }
    }, true);

    function closeFn() {
      $modalInstance.close();
    }

    function checkPositiveFn(amount) {
      return (angular.isDefined(amount) && !isNaN(amount) && amount > 0) ? true : false;
    }

    function makeRechargeFn() {
      if ($window.confirm("Are you sure add balance to this corporation?")) {
        vm.loading = true;
        adminService.setCorporationRecharge(vm.corporate, vm.operation, vm.amount)
          .then(function (data) {
            vm.loading = false;
            ngToast.create('Added amount to Corporate balance.');
            $modalInstance.dismiss();
          }, function (error) {
            vm.loading = false;
            ngToast.create({
              className: 'danger',
              content: 'Error adding amount to Corporate amount.'
            });
          });
      }
    }

    function swapFn(source) {
      var tmp = [];
      for (var i = 0, len = source.length; i < len; i++) {
        var corporate = {};
        corporate.id = source[i].id;
        corporate.name = source[i].companyName;
        tmp.push(corporate);
      }
      return tmp;
    }

    function getCorporatesForRecharge() {
      var myBlock = blockUI.instances.get('blockAddBalance');
      myBlock.start();
      adminService.getRechargeableCorporations().then(function (response) {
        vm.corporatesForRecharge = swapFn(response);
        vm.corporates = vm.corporatesForRecharge;
        $timeout(function () {
          $('#field_corporate').multipleSelect("refresh");
        }, 10);
        myBlock.stop();
      }, function (error) {
        myBlock.stop();
        console.log(error);
      });
    }

    function getCorporatesFn() {
      var country = {iso: 'VE'};
      var myBlock = blockUI.instances.get('blockAddBalance');
      myBlock.start();
      adminService.getAllCorporates(undefined, undefined, '-companyName', undefined, undefined, undefined, 'OK', country, undefined, false)
        .then(function (response) {
          vm.corporatesVE = swapFn(response.data);
          vm.corporates = vm.corporatesVE;
          $timeout(function () {
            $('#field_corporate').multipleSelect("refresh");
          }, 10);
          myBlock.stop();
        }, function (error) {
          myBlock.stop();
          console.log(error);
        });
    }
  }
})();
