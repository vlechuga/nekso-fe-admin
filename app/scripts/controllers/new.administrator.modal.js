(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:NewAdministratorModalCtrl
   * @description
   * # NewAdministratorModalCtrl
   * Administrator of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('NewAdministratorModalCtrl', newAdministratorModalCtrl);

  function newAdministratorModalCtrl($modalInstance, adminService,  ngToast, $timeout, utilService, permissions, states, $scope) {

    var vm = this;

    vm.modalTitle = 'New User';
    vm.loading = {};
    vm.administrator = {};
    vm.administrator.country = [];

    vm.loadingMultiSelect = false;
    vm.editable = true;
    vm.new = true;
    vm.close = closeFn;
    vm.checkEmpty = checkEmptyFn;
    vm.checkUserEmpty = checkUserEmptyFn;
    vm.checkPermission = checkPermissionFn;
    vm.createAdministrator = createAdministratorFn;
    vm.updatePermissions = updatePermissionsFn;
    vm.permissions=permissions;
    vm.states=states.data;
    vm.country=states.country;
    vm.minDate=moment().add(1, 'd').toDate();

    $timeout(function() {
      $('select.wa1300').multipleSelect(
        {
          // onOptgroupClick: function(view) {
          //   $('select.wa1301').multipleSelect("refresh");
          // },
          onCheckAll: function() {
            $('select.wa1301').multipleSelect("refresh");
          },
          onUncheckAll: function() {
            setTimeout(function(){$('select.wa1301').multipleSelect("refresh");},300);
          },
          onClick: function(view) {
            $('select.wa1301').multipleSelect("refresh");
          }
        }
      );
      $('select.wa1301').multipleSelect();
      vm.loadingMultiSelect = true;

    }, 200);

    function closeFn(){
      $modalInstance.dismiss();
    }

    function checkEmptyFn(){
      if(vm.administrator.country){
        return true;
      }
      return false;
    }

    function checkUserEmptyFn(){
      if(vm.administrator.userCountry){
        return true;
      }
      return false;
    }

    $scope.$watch('administratorModalVm.administrator.userCountry', function(newVal, oldVal){
      if(newVal !== oldVal){
        vm.administrator.userCountryState='';
      }
    });

    function updatePermissionsFn(section){
      if (typeof section == "string" && section=='all') {
        if ($('.checkbox-permissions').prop('checked')) {
          $('.checkbox-permissions').prop('checked',false);
        } else{
          $('.checkbox-permissions').prop('checked',true);
        };
      } else {
        var name = section.name;
        if ($('.checkbox-permissions[sectionName="'+name+'"]').prop('checked')) {
          $('.checkbox-permissions[sectionName="'+name+'"]').prop('checked',false);
        } else{
          $('.checkbox-permissions[sectionName="'+name+'"]').prop('checked',true);
        };
      }
    }

    function checkPermissionFn(id, section){
      var readId = section.read.id;
      var sectionName = section.name;
      if (readId == id) {
        if (!$('.checkbox-permissions[inner-id="'+readId+'"]').prop('checked')) {
          $('.checkbox-permissions[sectionName="'+sectionName+'"]').prop('checked',false);
        }
      } else{
        if ($('.checkbox-permissions[inner-id="'+id+'"]').prop('checked')) {
          $('.checkbox-permissions[inner-id="'+readId+'"]').prop('checked',true);
        }
      };
    }

    function createAdministratorFn(){
      vm.loading.create = true;
      var administrator = {
        firstName: vm.administrator.firstName,
        lastName: vm.administrator.lastName,
        email: vm.administrator.email
      };
      administrator.accessLevel=[];
      $('.checkbox-permissions:checked').each(function(index) {
        administrator.accessLevel.push({id:$(this).attr('inner-id')});
      });

      if (vm.administrator.countryStates !== undefined && vm.administrator.countryStates.length == vm.states.length) {
        administrator.countryStates = [];
      } else {
        administrator.countryStates = vm.administrator.countryStates;
      }

      administrator.location={};
      administrator.location.country=vm.administrator.userCountry;
      administrator.location.state=vm.administrator.userCountryState;

      adminService.createAdministrator(administrator)
      .then(function(data){
        vm.loading.create = false;
        ngToast.create('A new administrator has been created.');
        $modalInstance.dismiss();
      }, function(error){
        var msg = '';
        if(error.data.code === 602){
          msg = 'Duplicate email.';
        }
        vm.loading.create = false;
        ngToast.create({
          className: 'danger',
          content: 'Error creating administrator. ' + msg
        });
      });
    }
  }
})();
