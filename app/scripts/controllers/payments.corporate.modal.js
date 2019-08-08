(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.corporate:PaymentsCorporateModalCtrl
   * @description
   * # PaymentsCorporateModalCtrl
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PaymentsCorporateModalCtrl', paymentsCorporateModalCtrl);

  function paymentsCorporateModalCtrl($modalInstance, adminService, ngToast, corporate, utilService, store, getUserPermission) {

    var vm = this;

    vm.modalTitle = 'Review notification';
    vm.loading = {};
    vm.corporate = corporate;
    vm.status = '';
    vm.editable = false;
    vm.new = false;
    vm.close = closeFn;
    vm.setEditable = setEditableFn;
    vm.editCorporate = editCorporateFn;
    vm.editCorporateStatus = editCorporateStatusFn;
    vm.comments = corporate.comments;
    vm.getUserPermission = getUserPermission;
    vm.setStatus = setStatusFn;
    vm.rejectionArr = [];
    vm.toggleSelection = toggleSelectionFn;

    function closeFn() {
      $modalInstance.dismiss();
    }

    function setEditableFn() {
      vm.editable = true;
    }

    function toggleSelectionFn(item) {
      console.log(item);
      var idx = vm.rejectionArr.indexOf(item);

      // Is currently selected
      if (idx > -1) {
        vm.rejectionArr.splice(idx, 1);
      }

      // Is newly selected
      else {
        vm.rejectionArr.push(item);
      }
    }

    function setStatusFn() {
      vm.loading.create = true;
      var obj = {};
      obj.status = vm.status;
      if (vm.status === 'REJECTED') {
        obj.rejection_reason = vm.rejectionArr;
      }
      adminService.setTransactionStatus(vm.corporate.user.id, vm.corporate.id, obj)
        .then(function (response) {
          vm.loading.create = false;
          $modalInstance.dismiss();
          ngToast.create({
            className: 'success',
            content: 'Successful request.'
          });
        }, function (error) {
          vm.loading.create = false;
          ngToast.create({
            className: 'danger',
            content: 'Error. ' + error.statusText + '. ' + error.data.description
          });
        });
    }

    function editCorporateStatusFn(status) {

      vm.loading.create = true;
      if ((!vm.corporate.emailVerified) && (status === 'OK')) {
        ngToast.create({
          className: 'danger',
          content: 'Error Email not verified. '
        });
        closeFn();
      } else {
        if (status === 'OK') {
          vm.corporate.status = 'OK';
        } else if (status === 'REJECTED') {
          vm.corporate.status = 'REJECTED';
        } else if (status === 'SUSPENDED') {
          vm.corporate.status = 'SUSPENDED';
        } else if (status === 'IN_REVIEW') {
          vm.corporate.status = 'IN_REVIEW';
        }
        show_prompt();
        adminService.editCorporateStatus(store.get('admin_user').id, vm.corporate.id, vm.corporate.status, vm.comments)
          .then(function (data) {
            vm.loading.create = false;
            ngToast.create('Corporate profile updated.');
            vm.editable = false;
            $modalInstance.dismiss();
          }, function (error) {
            var msg = '';
            vm.loading.create = false;
            ngToast.create({
              className: 'danger',
              content: 'Error updating corporate. ' + msg
            });
          });
      }
    }

    function editCorporateFn() {
      var corporate = {
        companyName: angular.copy(vm.corporate.companyName),
        rif: angular.copy(vm.corporate.rif),
        companyAddress: angular.copy(vm.corporate.companyAddress),
        contactName: angular.copy(vm.corporate.contactName),
        email: angular.copy(vm.corporate.email),
        phone: angular.copy(vm.corporate.phone)
      };
      // console.log(corporate);
      adminService.editCorporate(vm.corporate.id, corporate)
        .then(function (data) {
          vm.loading.create = false;
          ngToast.create('Corporate profile updated.');
          vm.editable = false;
          $modalInstance.dismiss();
        }, function (error) {
          var msg = '';
          if (error.data.code === 602) {
            msg = 'Duplicate email or phone.';
          }
          vm.loading.create = false;
          ngToast.create({
            className: 'danger',
            content: 'Error updating corporate. ' + msg
          });
        });
    }

    function show_prompt() {
      var text;
      do {
        text = prompt("Agregue un comentario");
      } while (text.length <= 0);
      vm.comments = text;
    }

  }
})();
