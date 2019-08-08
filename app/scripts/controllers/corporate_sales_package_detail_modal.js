(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.corporate:CorporateSalesPackageDetailModal
   * @description
   * # CorporateSalesPackageDetailModal
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CorporateSalesPackageDetailModalCtrl', corporateSalesPackageDetailModalCtrl);

  function corporateSalesPackageDetailModalCtrl($scope, $modal, $modalInstance, blockUI, ngToast, adminService, utilService, corporateId) {
    var vm = this;
    vm.loading = false;
    vm.corporation = undefined;
    vm.history = [];
    vm.totalHistories = 0;
    vm.controls = {
      numPerPage: 5,
      currentPage: 1
    };

    function init() {
      vm.corporateId = corporateId;
      getAllCorporatesSalesPackageHistoryFn();
    }

    init();

    vm.close = closeFn;
    vm.openEditDialog = openCorporateSalesPackageDetailEditDialogFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.addComment = addCommentFn;

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getAllCorporatesSalesPackageHistoryFn();
      }
    });

    function closeFn() {
      $modalInstance.dismiss();
    }

    function getAllCorporatesSalesPackageHistoryFn() {
      if (vm.corporateId) {
        var myBlock = blockUI.instances.get('corporatesSalesPackageHistoryList');
        myBlock.start();
        adminService.getAllCorporatesSalesPackageHistory(vm.controls.numPerPage, vm.controls.currentPage - 1, vm.corporateId).then(function (data) {
          vm.history = [];
          vm.history = data.data;
          vm.corporation = data.metadata.corporation;
          vm.totalHistories = data.total;
          vm.notes = (angular.isDefined(vm.corporation.salesInfo) && angular.isDefined(vm.corporation.salesInfo.notes)) ? vm.corporation.salesInfo.notes : '';
          myBlock.stop();
        }, function (error) {
          ngToast.create({
            className: 'danger',
            content: error.data.statusText
          });
          myBlock.stop();
        });
      }
    }

    function openCorporateSalesPackageDetailEditDialogFn(transaction) {
      if (!angular.isDefined(transaction.benefits)) {
        ngToast.create({
          className: 'warning',
          content: 'The transaction does not have benefit.'
        });
        return;
      }
      if (utilService.getUserPermission('read:corporate')) {
        var openEditModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/corporation_sales_package_detail_edit_modal.html',
          size: 'sm',
          controller: 'CorporateSalesPackageDetailEditModalCtrl',
          controllerAs: 'vm',
          resolve: {
            corporateId: function () {
              return vm.corporateId;
            },
            transaction: function () {
              return transaction;
            }
          }
        });
        openEditModalInstance.result.then(function (selectedItem) {
        }, function () {
          getAllCorporatesSalesPackageHistoryFn();
        });
      } else {
        ngToast.create({
          className: 'danger',
          content: 'You dont have permission to edit this corporation.'
        });
      }
    }

    function addCommentFn() {
      vm.loading = true;
      adminService.putCorporatesSalesPackageAddComment(vm.corporateId, vm.notes).then(function (data) {
        ngToast.create({
          className: 'success',
          content: 'Comment updated'
        });
        vm.loading = false;
      }, function (error) {
        console.log(error)
        vm.loading = false;
        ngToast.create({
          className: 'danger',
          content: error.data.description
        });
      });
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

  }
})();
