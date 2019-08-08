(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:editVisitorModalCtrl
   * @description
   * # editVisitorModalCtrl
   * Administrator of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('editVisitorModalCtrl', editVisitorModalCtrl);

  function editVisitorModalCtrl($modalInstance, adminService,  ngToast, $timeout, utilService, visitor, hdyhau) {
    var vm = this;
    // vm.userEmail = JSON.parse(localStorage.admin_user).email;
    console.log(visitor);
    vm.visitorId = visitor.id;
    vm.hdyhau = hdyhau;
    vm.new = {};
    vm.new.action = '';
    vm.new.comment = '';
    vm.loading = {};
    vm.close = closeFn;

    vm.visitor = visitor;
    vm.visitor.firstname = visitor.name.split(' ')[0];
    vm.visitor.lastname = visitor.name.split(' ')[1];
    vm.visitor.idType = visitor.nationalId.split('-')[0];
    vm.visitor.id = visitor.nationalId.split('-')[1];
    vm.visitor.phoneNumber = visitor.phone.replace('+58','0');
    vm.visitor.referred = visitor.referredBy;
    vm.visitor.affiliated = visitor.affiliatedBy;
    vm.visitor.observations = visitor.comments;

    vm.editVisitor = editVisitorFn;

    function closeFn(){
      $modalInstance.dismiss();
    }

    function editVisitorFn(){
      if (vm.visitor.hdyhau == '0') {
        $('select[ng-model="visitorModalVm.visitor.hdyhau"]').addClass("error-border").focus();
        return false;
      } else {
        $('select[ng-model="visitorModalVm.visitor.hdyhau"]').removeClass("error-border");
      }
      if (vm.visitor.firstname == '' || vm.visitor.firstname.length < 2) {
        $('input[ng-model="visitorModalVm.visitor.firstname"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.firstname"]').removeClass("error-border");
      }
      if (vm.visitor.lastname == '' || vm.visitor.lastname.length < 2) {
        $('input[ng-model="visitorModalVm.visitor.lastname"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.lastname"]').removeClass("error-border");
      }
      var patt = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
      if (!patt.test(vm.visitor.email)) {
        $('input[ng-model="visitorModalVm.visitor.email"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.email"]').removeClass("error-border");
      }
      var patt = new RegExp("^0(2|4)[0-9]{9}$");
      if (!patt.test(vm.visitor.phoneNumber)) {
        $('input[ng-model="visitorModalVm.visitor.phoneNumber"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.phoneNumber"]').removeClass("error-border");
      }
      if (!vm.visitor.idType) {
        $('input[ng-model="visitorModalVm.visitor.idType"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.idType"]').removeClass("error-border");
      }
      var patt = new RegExp("^[0-9]{5,10}$");
      if (!patt.test(vm.visitor.id)) {
        $('input[ng-model="visitorModalVm.visitor.id"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.id"]').removeClass("error-border");
      }
      if (vm.visitor.address == '' || vm.visitor.address.length < 10) {
        $('textarea[ng-model="visitorModalVm.visitor.address"]').addClass("error-border").focus();
        return false;
      } else {
        $('textarea[ng-model="visitorModalVm.visitor.address"]').removeClass("error-border");
      }
      if (vm.visitor.phoneModel == '' || vm.visitor.phoneModel.length < 4) {
        $('input[ng-model="visitorModalVm.visitor.phoneModel"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.phoneModel"]').removeClass("error-border");
      }
      var patt = new RegExp("^[0-9]{15}$");
      if (!patt.test(vm.visitor.imei)) {
        $('input[ng-model="visitorModalVm.visitor.imei"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.imei"]').removeClass("error-border");
      }
      var patt = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
      if (!patt.test(vm.visitor.mpEmail)) {
        $('input[ng-model="visitorModalVm.visitor.mpEmail"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.mpEmail"]').removeClass("error-border");
      }
      if (vm.visitor.referred == '' || vm.visitor.referred.length < 4) {
        $('input[ng-model="visitorModalVm.visitor.referred"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.referred"]').removeClass("error-border");
      }
      if (vm.visitor.affiliated == '' || vm.visitor.affiliated.length < 4) {
        $('input[ng-model="visitorModalVm.visitor.affiliated"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="visitorModalVm.visitor.affiliated"]').removeClass("error-border");
      }
      // if (vm.visitor.observations) {
      //   $('input[ng-model="visitorModalVm.visitor.observations"]').addClass("error-border").focus();
      //   return false;
      // } else {
      //   $('input[ng-model="visitorModalVm.visitor.observations"]').removeClass("error-border");
      // }
      var obj={};
      obj.name = vm.visitor.firstname +' '+ vm.visitor.lastname;
      obj.email = vm.visitor.email;
      obj.phone = '+58'+vm.visitor.phoneNumber.substring(1);
      obj.nationalId = vm.visitor.idType+'-'+vm.visitor.id;
      obj.address = vm.visitor.address;
      obj.phoneModel = vm.visitor.phoneModel;
      obj.imei = vm.visitor.imei;
      obj.mpEmail = vm.visitor.mpEmail;
      obj.referredBy = vm.visitor.referred;
      obj.affiliatedBy = vm.visitor.affiliated;
      obj.hdyhau = vm.visitor.hdyhau;
      obj.comments = vm.visitor.observations;
      vm.loading.create = true;
      adminService.editVisitor(vm.visitorId, obj)
        .then(function(json){
          vm.loading.create = false;
          ngToast.create('User updated Successful.');
          $modalInstance.dismiss();
        }, function(error){
          var msg = '';
          if(error.data.code === 602){
            msg = 'Duplicate email.';
          }
          vm.loading.create = false;
          ngToast.create({
            className: 'danger',
            content: 'Error creating new action. ' + msg
          });
        });
      }
    }
})();
