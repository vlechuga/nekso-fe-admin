/**
 * Created by abarazarte on 03/02/17.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CorporateSalesPackageDetailEditModalCtrl
   * @description
   * # CorporateSalesPackageDetailEditModalCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CorporateSalesPackageDetailEditModalCtrl', corporateSalesPackageDetailEditModalCtrl);

  function corporateSalesPackageDetailEditModalCtrl($modalInstance, $window, ngToast, adminService, utilService, corporateId, transaction) {
    if (utilService.getUserPermissionBase('read:corporate')) {
      return true;
    }

    var vm = this;

    vm.corporateId = corporateId;
    vm.transaction = transaction;
    vm.benefitsDeliveredAt = (vm.transaction.benefitsDeliveredAt) ? moment(vm.transaction.benefitsDeliveredAt).toDate() : moment().toDate();
    vm.benefitsReference = vm.transaction.benefitsReference;
    vm.loading = false;

    vm.close = closeFn;
    vm.updateTransaction = updateTransactionFn;

    function closeFn() {
      $modalInstance.close();
    }

    function updateTransactionFn() {
      if (angular.isDefined(vm.corporateId) && angular.isDefined(vm.benefitsDeliveredAt) &&
        angular.isDefined(vm.benefitsReference) && $window.confirm("Are you sure?")) {
        vm.loading = true;
        adminService.putCorporatesSalesPackageDetailEdit(vm.corporateId, vm.transaction.id,
          utilService.toStringDate(moment(vm.benefitsDeliveredAt)), vm.benefitsReference)
          .then(function (data) {
            vm.loading = false;
            ngToast.create({
              className: 'success',
              content: 'Successful request.'
            });
            $modalInstance.dismiss();
          }, function (error) {
            vm.loading = false;
            ngToast.create({
              className: 'danger',
              content: error.data.description || 'Failed request.'
            });
          });
      }
    }

  }
})();
