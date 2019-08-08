(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:newVisitorActionModalCtrl
   * @description
   * # newVisitorActionModalCtrl
   * Administrator of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('newVisitorActionModalCtrl', newVisitorActionModalCtrl);

  function newVisitorActionModalCtrl($modalInstance, adminService,  ngToast, $timeout, utilService, visitor, actions, promoters) {
    var vm = this;
    // vm.userEmail = JSON.parse(localStorage.admin_user).email;
    vm.promoters = promoters;
    vm.userEmail = visitor.email;
    vm.new = {};
    vm.new.action = '';
    vm.new.comment = '';
    vm.loading = {};
    vm.close = closeFn;

    vm.visitor = visitor;
    vm.actions = actions;
    vm.saveAction = saveActionFn;
    vm.reg = new RegExp("_","g");

    function closeFn(){
      $modalInstance.dismiss();
    }

    function saveActionFn(){
      vm.loading.create = true;
      var obj = {};
      obj.id = vm.visitor.id;
      obj.action = {};
      obj.action.type = vm.new.action;
      obj.action.comments = vm.new.comment;
      obj.action.visitorId = vm.visitor.id;
      obj.action.attendedBy = vm.new.attended;
      adminService.createVisitorAction(obj)
      .then(function(data){
        vm.loading.create = false;
        ngToast.create('A new action has been created.');
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
