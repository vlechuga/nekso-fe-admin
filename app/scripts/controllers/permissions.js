(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PermissionsCtrl
   * @description
   * # PermissionsCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PermissionsCtrl', permissionsCtrl);

  function permissionsCtrl($scope, adminService, $modal, blockUI, $filter, utilService, ngToast, $timeout) {
    if (utilService.getUserPermissionBase('read:administration')) {
      return true;
    };

    String.prototype.capitalize = function(lower) {
      return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    };

    var vm = this;
    vm.statesArr = utilService.getUserPermissionStates() || [];
    vm.states={};
    vm.states.country=[];
    var myBlock = blockUI.instances.get('PermissionsList');
    myBlock.start();
    adminService.getAllStates()
    .then(function(data){
      var tmp=vm.statesArr;
      vm.statesArr=[];
      vm.states.data=data;
      if (tmp.length==0) {
        for (var j = 0; j < data.length; j++) {
          vm.statesArr.push(data[j]);
        }
        for (var i = 0; i < vm.statesArr.length; i++) {
          if(vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country)==-1){
            vm.states.country.push(vm.statesArr[i].country);
          }
        }
      } else {
        for (var i = 0; i < tmp.length; i++) {
          for (var j = 0; j < data.length; j++) {
            if (data[j].name==tmp[i]) {
              vm.statesArr.push(data[j]);
            }
          }
        }
        for (var i = 0; i < vm.statesArr.length; i++) {
          if(vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country)==-1){
            vm.states.country.push(vm.statesArr[i].country);
          }
        }
      }
      myBlock.stop();
      vm.loadingMultiSelect = true;
      setTimeout(function() {
        $('select[multiple="multiple"]').multipleSelect("refresh");
      }, 10);
    }).then(function(){ return getAdministratorsRoles();}).then(function(){getAdministrators();});
    vm.loadingMultiSelect = false;
    var searchFlag = false;

    vm.loading = {};
    vm.permissions = [];
    vm.totalAdministrator = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {};
    vm.filter.searchText='';
    vm.filter.country='';
    vm.filter.state=[];
    vm.filter.status='';

    vm.predicate = 'firstName';
    vm.reverse = true;
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.openRideDetail = openRideDetailFn;
    vm.openPassengerProfile = openPassengerProfileFn;
    vm.openDriverProfile = openDriverProfileFn;
    vm.getRideStatus = getRideStatusFn;
    vm.exportToCsv = exportToCsvFn;
    vm.openNewAdministratorDialog = openNewAdministratorDialogFn;
    vm.openAdministratorProfileDialog = openAdministratorProfileDialogFn;
    vm.openManageRolesDialog = openManageRolesDialogFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.editSosNotificationStatus = editSosNotificationStatusFn;

    $timeout(function() {
      $('select[multiple="multiple"]').multipleSelect({
        placeholder: "Select user state"
      });
      vm.loadingMultiSelect = true;
    }, 300);

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getAdministrators();
        }
      }
    });

    $scope.$watch('vm.filter.country', function(newVal, oldVal){
      if(newVal !== oldVal){
        setTimeout(function(){$('select[multiple="multiple"]').multipleSelect("refresh");},100);
      }
    });

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.state, vm.filter.status]', function(newVal, oldVal){
      if(newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3]){
        getAdministrators();
      }
    }, true);

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getAdministrators();
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getAdministrators();
    }
    function createAdministratorFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getAdministrators();
    }
    function editSosNotificationStatusFn(sos){
      adminService.editSosNotificationStatus(sos.id, true)
      .then(function(data){
          sos.userContacted=true;
        }, function(error){
          console.log(error);
        })
    }

    function searchDriversFn(){
      searchFlag = true;
      getAdministrators();
    }

    function searchDriversOnEnterFn(event){
      if(event.keyCode == 13){
        searchFlag = true;
        getAdministrators();
      }
    }

    function getAdministratorsRoles(){
      return adminService.getAccessRoles()
      .then(function(data){
        var obj={};
        obj.sections={};
        for (var i = 0; i < data.length; i++) {
          var permission = data[i].code.split(':')[0];
          if(permission === 'edit'){
            permission = 'update';
          }
          var section = data[i].code.split(':')[1].replace(/^sos/,'SOS').replace(/^tl/,'Taxi Lines');
          // SECTIONS
          if (!obj.sections[section]) {
            obj.sections[section]={};
            obj.sections[section].name=section;
            obj.sections[section].description=data[i].description;
            obj.sections[section][permission]={};
            obj.sections[section][permission].id=data[i].id;
          } else{
            obj.sections[section][permission]={};
            obj.sections[section][permission].id=data[i].id;
          }
        }
        obj.data=data;
        vm.permissions=obj;
      })
    }
    function getStates(){
      adminService.getAllStates()
      .then(function(data){
        vm.states={};
        vm.states.country=[];
        vm.states.data=data;
        for (var i = 0; i < data.length; i++) {
          if(data[i].country && vm.states.country.indexOf(data[i].country)==-1){
            vm.states.country.push(data[i].country);
          }
        }
        console.log(vm.states.country);
      })
    }

    function getAdministrators(){
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      var myBlock = blockUI.instances.get('PermissionsList');
      myBlock.start();
      adminService.getAdministrators(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, vm.filter.status, vm.filter.searchText, vm.filter.state)
        .then(function(json){
          var Administrator=json.data;
          for (var i = 0; i < Administrator.length; i++) {
            Administrator[i].fullName = Administrator[i].firstName+' '+Administrator[i].lastName;
            Administrator[i].fullName = Administrator[i].firstName+' '+Administrator[i].lastName;
            if (Administrator[i].expirationDate) {
              Administrator[i].expirationDate=moment(Administrator[i].expirationDate).format('DD/MM/YYYY');
            } else{
              Administrator[i].expirationDate='Never';
            };
            if(Administrator[i].accessLevel && Administrator[i].accessLevel.length == vm.permissions.data.length){
              Administrator[i].admin='Admin';
            } else{
              Administrator[i].admin='No';
            }
          };
          vm.administrators = Administrator;
          vm.totalAdministrator = json.total;
          myBlock.stop();
        }, function(error){
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          };
        });
    }

    function openNewAdministratorDialogFn(){
      var newAdministratorModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/new.administrator.html',
        size: 'md',
        controller: 'NewAdministratorModalCtrl',
        controllerAs: 'administratorModalVm',
        resolve: {
          permissions:vm.permissions,
          states:vm.states
        }
      });
      newAdministratorModalInstance.result.then(function(selectedItem) {
      }, function() {
        getAdministrators();
      });
    }
    function openAdministratorProfileDialogFn(administrator){
      if (getUserPermissionFn('read:administration')) {
        var controllerProfileModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/new.administrator.html',
          size: 'md',
          controller: 'EditAdministratorModalCtrl',
          controllerAs: 'administratorModalVm',
          resolve: {
            permissions:vm.permissions,
            administrator: administrator,
            states:vm.states,
            getUserPermission: function(){
              return vm.getUserPermission;
            }
          }
        });
        controllerProfileModalInstance.result.then(function(selectedItem) {
        }, function() {
          getAdministrators();
        });
      }
    }

    //////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////

    function openManageRolesDialogFn(){
      var newAdministratorModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/new.administrator.html',
        size: 'md',
        controller: 'NewAdministratorModalCtrl',
        controllerAs: 'administratorModalVm',
        resolve: {
        }
      });
      newAdministratorModalInstance.result.then(function(selectedItem) {
      }, function() {
        getAdministrators();
      });
    }
    function openRideDetailFn(ride){
      var rideModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/ride.html',
        size: 'lg',
        controller: 'RideModalCtrl',
        controllerAs: 'rideModalVm',
        resolve: {
          ride: function(){
            return ride;
          }
        }
      });
    }

    function openPassengerProfileFn(passenger, controller){
      var passengerModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/passenger.html',
        size: 'sm',
        controller: 'PassengerModalCtrl',
        controllerAs: 'passengerModalVm',
        resolve: {
          passenger: passenger,
          controller: controller
        }
      });
    }

    function openDriverProfileFn(driver, controller){
      var driverModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/driver.html',
        size: 'sm',
        controller: 'DriverModalCtrl',
        controllerAs: 'driverModalVm',
        resolve: {
          driver: function(){
            return driver;
          },
          controller: function(){
            return controller;
          }
        }
      });
    }

    function getRideStatusFn(ride){
      if(!angular.isUndefined(ride.status)){
        var state = '';
        switch (ride.status){
          case "ONGOING":
            state = 'Ongoing';
            break;
          case "COMPLETED":
            state = 'Completed';
            break;
          case "CANCELLED":
            state = 'Cancelled';
            if(!angular.isUndefined(ride.statusUpdatedBy)){
              if(ride.statusUpdatedBy === 'DRIVER'){
                state += ' by driver';
              }else if(ride.statusUpdatedBy === 'PASSENGER'){
                state += ' by passenger';
              } else if(ride.statusUpdatedBy === 'SYSTEM'){
                state += ' by system';
              }
            }
            break;
          default:
            break;
        }
        return state;
      }
    }

    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      return adminService.getAllRides(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.status, vm.filter.taxiLine, vm.filter.searchText)
        .then(function(rides){
          var toExport = [];
          for(var i = 0, len = rides.data.length; i < len; i++){
            var ride = rides.data[i];
            var tmp = {};
            tmp.id = ($filter('idlimit')(ride.id)).toUpperCase();
            tmp.rideDate = $filter('date')(new Date(ride.createdDate), 'dd/MM/yyyy');
            tmp.ridetime = $filter('date')(new Date(ride.createdDate), 'hh:mm a');
            tmp.taxiLine = ride.controller.name;
            tmp.driver = ride.driver.firstName + ' ' + ride.driver.lastName;
            tmp.driverEmail = ride.driver.email;
            tmp.passenger = ride.passenger.firstName + ' ' + ride.passenger.lastName;
            tmp.passengerEmail = ride.passenger.email;
            tmp.pickUp = ride.rideInfo.passengerPickupAddress;
            tmp.destination = ride.rideInfo.passengerDestinationAddress;
            tmp.status = getRideStatusFn(ride);
            if(angular.isDefined(ride.firstTime)){
              tmp.firstTime = ride.firstTime.replace(';', '|');
            }else{
              tmp.firstTime = ride.firstTime;
            }
            toExport.push(tmp);
          }
          vm.loading.export = false;
          return toExport;
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
          vm.loading.export = false;
        });
    }

  }
})();
