(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:EditAdministratorModalCtrl
   * @description
   * # EditAdministratorModalCtrl
   * Administrator of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('EditAdministratorModalCtrl', editAdministratorModalCtrl);

  function editAdministratorModalCtrl($modalInstance, adminService, $scope, ngToast, $timeout, administrator, utilService, permissions, getUserPermission, states) {

    var vm = this;
    // console.log(administrator);
    vm.modalTitle = 'User profile';
    vm.loading = {};
    vm.administrator = angular.copy(administrator);
    vm.countryStatesTmp = vm.administrator.countryStates;
    vm.administrator.country = [];
    // console.log(vm.administrator);
    if (administrator.location) {
      vm.administrator.userCountry=administrator.location.country;
      vm.administrator.userCountryState=administrator.location.state;
    }

    vm.loadingMultiSelect = false;
    vm.editable = false;
    vm.new = false;
    vm.close = closeFn;
    vm.checkEmpty = checkEmptyFn;
    vm.checkUserEmpty = checkUserEmptyFn;
    vm.setEditable = setEditableFn;
    vm.removeEditable = removeEditableFn;
    vm.editAdministrator = editAdministratorFn;
    vm.updatePermissions = updatePermissionsFn;
    vm.checkPermission = checkPermissionFn;
    vm.permissions=permissions;
    vm.states=states.data;
    vm.country=states.country;
    vm.getUserPermission=getUserPermission;
    vm.allStates=false;

    if (vm.countryStatesTmp && vm.countryStatesTmp.length==0) {
      vm.allStates=true;
    } else if(!vm.countryStatesTmp){
      vm.administrator.countryStates = [];
      vm.administrator.country=[];
    } else {
      vm.administrator.countryStates = vm.countryStatesTmp;
      vm.administrator.country=[];
      for (var i = 0; i < vm.administrator.countryStates.length; i++) {
        var response = vm.states.find(function(obj){
          if(obj.name == vm.administrator.countryStates[i]){
            return obj;
          }
        });
        if (response!=undefined && vm.administrator.country.indexOf(response.country)==-1) {
          vm.administrator.country.push(response.country);
        }
      }
    }

    $scope.$watch('administratorModalVm.administrator.userCountry', function(newVal, oldVal){
      if(newVal !== oldVal){
        vm.administrator.userCountryState='';
      }
    });
    
    $timeout(function() {
      for (var i = 0; i < vm.administrator.accessLevel.length; i++) {
        var id=vm.administrator.accessLevel[i].id;
        // console.log(id);
        $('.checkbox-permissions[inner-id="'+id+'"]').prop('checked',true);
      };
      
      $('select.wa1301').multipleSelect();

      $('select.wa1300').multipleSelect(
        {
          // onOptgroupClick: function(view) {
          //   $('select.wa1301').multipleSelect("refresh");
          // },
          onCheckAll: function() {
            $('select.wa1301').multipleSelect("refresh");
          },
          onUncheckAll: function() {
            setTimeout(function(){$('select.wa1301').multipleSelect("refresh");},100);
          },
          onClick: function(view) {
            $('select.wa1301').multipleSelect("refresh");
          }
        }
      );
    }, 100);

    
    $timeout(function() {
      if (vm.allStates==true) {
        $("select.wa1300").multipleSelect("checkAll");
        $("select.wa1301").multipleSelect("checkAll");
      }

    }, 150);

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

    function setEditableFn(){
      // if (administrator.email!='azam.mohabbatian@blanclink.com') {
        vm.editable = true;
        $("select.wa1300").multipleSelect("enable");
        $("select.wa1301").multipleSelect("enable");
        // console.log(vm.administrator.countryStates);
      // }
    }

    function removeEditableFn(){
      vm.editable = false;
      $modalInstance.dismiss();
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

    function updatePermissionsFn(section){
      if (vm.editable) {
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
      } else{

      }
    }

    function editAdministratorFn(){
      vm.loading.create = true;
      var administrator = {
        firstName: vm.administrator.firstName,
        lastName: vm.administrator.lastName,
        status: vm.administrator.status,
        email: vm.administrator.email
      };
      administrator.accessLevel=[];
      $('.checkbox-permissions:checked').each(function(index) {
        administrator.accessLevel.push({id:$(this).attr('inner-id')});
      });

      if (vm.administrator.countryStates !== undefined && vm.administrator.countryStates.length == vm.states.length) {
        administrator.countryStates=[];
      } else {
        administrator.countryStates= (vm.administrator.countryStates === undefined) ? [] : vm.administrator.countryStates;
      }

      administrator.location={};
      administrator.location.country=vm.administrator.userCountry;
      administrator.location.state=vm.administrator.userCountryState;
      
      adminService.editAdministrator(vm.administrator.id, administrator)
        .then(function(data){
          vm.loading.create = false;
          ngToast.create('Administrator profile updated.');
          vm.editable = false;
          $modalInstance.dismiss();
        }, function(error){
          var msg = '';
          if(error.data.code === 602){
            msg = 'Duplicate email or phone.';
          }
          vm.loading.create = false;
          ngToast.create({
            className: 'danger',
            content: 'Error updating administrator. ' + msg
          });
      });
    }
  }
})();
