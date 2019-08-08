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
    .controller('CommVisitorsCtrl', CommVisitorsCtrl);

  function CommVisitorsCtrl($scope, adminService, $modal, blockUI, $filter, utilService, ngToast, $timeout) {
    if (utilService.getUserPermissionBase('read:communication')) {
      return true;
    }

    String.prototype.capitalize = function(lower) {
      return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    };

    var vm = this;
    var searchFlag = false;

    vm.loading = {};
    vm.permissions = [];
    vm.totalVisitors = 0;
    vm.visitors = []
    vm.registerNew = false;
    vm.editVisitorRecord = false;
    vm.isEditable = false;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      searchText: '',
      country: undefined,
      states: undefined,
      date: {
        startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
        endDate: moment().hours(23).minutes(59).seconds(59).milliseconds(999),
        opts: {
          timePicker: true,
          timePicker24Hour: true,
          locale: {
            applyClass: 'btn-green',
            applyLabel: "Apply",
            fromLabel: "From",
            format: "DD/MM/YYYY hh:mm A",
            toLabel: "To",
            cancelLabel: 'Cancel',
            customRangeLabel: 'Custom range'
          },
          ranges: {
            'Today': [moment().hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Yesterday': [moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().subtract(1, 'days').hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Last 7 Days': [moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Last 30 Days': [moment().subtract(30, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'All': [moment().year(2015).month(10).days(1).hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)]
          }
        }
      }
    };
    vm.errors = {};

    adminService.gethdyhau().then(function(json){
      vm.hdyhau = json;
    }, function(error){
      console.log(error);
    });

    adminService.getActionsTypes().then(function(json){
      vm.actions = json;
    }, function(error){
      console.log(error);
    });

    adminService.getPromoters()
      .then(function(json){
        vm.promoters = json.sort();
      });

    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.visitor = {};
    vm.visitor.firstname = undefined;
    vm.visitor.lastname = undefined;
    vm.visitor.email = undefined;
    vm.visitor.phoneNumber = undefined;
    vm.visitor.idType = 'V';
    vm.visitor.id = undefined;
    vm.visitor.address = undefined;
    vm.visitor.phoneModel = undefined;
    vm.visitor.imei = undefined;
    vm.visitor.mpEmail = undefined;
    vm.visitor.referred = undefined;
    vm.visitor.affiliated = undefined;
    vm.visitor.hdyhau = '0';
    vm.visitor.observations = undefined;
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.showCalendar = showCalendar;
    vm.searchVisits = searchVisitsFn;
    vm.searchVisitsOnEnter = searchVisitsOnEnterFn;
    vm.registerVisit = registerVisitFn;
    vm.selectUser = selectUserFn;
    vm.cancelNewVisit = cancelNewVisitFn;
    vm.exportToCsv = exportToCsvFn;
    vm.openVisitorNewAction = openVisitorNewActionFn;
    vm.editVisitor = editVisitorFn;
    vm.saveVisit = saveVisitFn;
    vm.returnToList = returnToListFn;
    vm.setEditable = setEditableFn;
    vm.saveEditVisitor = saveEditVisitorFn;
    vm.reg = new RegExp("_","g");

    getVisitors();

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          vm.controls.currentPage = 1;
          getVisitors();
        }
      }
    });

    $scope.$watch('[vm.filter.states]', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getVisitors();
        }
      }
    }, true);

    $scope.$watch('vm.controls.currentPage', function(newVal, oldVal){
      if(newVal !== oldVal){
          getVisitors();
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.taxiLine, vm.filter.type]', function(newVal, oldVal){
      if(newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3]){
        vm.controls.currentPage = 1;
        getVisitors();
      }
    }, true);

    function checkCountryLength() {
      var r = '';
      if (vm.visitor.idType=='E') {
        r = new RegExp("^[0-9]{5,12}$");
      } else {
        r = new RegExp("^[0-9]{5,10}$");
      }
      return r;
    }
    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getVisitors();
    }

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }

    function searchVisitsFn(){
      searchFlag = true;
      getVisitors();
    }

    function selectUserFn(visitor){
      vm.selectedUser=undefined;
      vm.visitorActions=[];
      vm.visitorActionsTotal=0;
      vm.selectedUser = visitor;
      getVisitorActionsFn();
      // getVisitors();
    }

    function getVisitorActionsFn(visitorId){
      var Block = blockUI.instances.get('ActionsList');
      Block.start();
      adminService.getVisitorActions(vm.selectedUser.id).then(
        function(json){
          vm.visitorActionsTotal = json.total;
          vm.visitorActions = json.data;
          Block.stop();
        }
        ,function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
          Block.stop();

        });
    }

    function searchVisitsOnEnterFn(event){
      if(event.keyCode == 13){
        searchFlag = true;
        getVisitors();
      }
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getVisitors();
    }
    function registerVisitFn(){
      vm.selectedUser=undefined;
      vm.registerNew = true;
    }
    function cancelNewVisitFn(){
      vm.registerNew = false;
    }
    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      return adminService.getActions(undefined, undefined, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText)
        .then(function(visits){
          var toExport = [];
          for(var i = 0, len = visits.data.length; i < len; i++){
            var visit = visits.data[i];
            var tmp = {};
            tmp.createdDate= $filter('date')(new Date(visit.createdDate), 'dd/MM/yyyy hh:mm a');
            tmp.name = visit.visitor.name;
            tmp.id = visit.visitor.nationalId;
            tmp.email = visit.visitor.email;
            tmp.firstVisitAt = $filter('date')(new Date(visit.visitor.createdDate), 'dd/MM/yyyy hh:mm a');
            tmp.mpEmail = visit.visitor.mpEmail;
            tmp.hdyhau = visit.visitor.hdyhau;
            tmp.phone = visit.visitor.phone;
            tmp.address = visit.visitor.address;
            tmp.phoneModel = visit.visitor.phoneModel;
            tmp.imei = visit.visitor.imei;
            tmp.actionType = visit.type;
            tmp.asesor = visit.visitor.affiliatedBy;
            tmp.atendido = visit.attendedBy || visit.createdBy;
            tmp.comments = visit.comments;
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
          myBlock.stop();
        });
    }
    function saveVisitFn(){
      if (vm.visitor.hdyhau == '0') {
        $('select[ng-model="vm.visitor.hdyhau"]').addClass("error-border").focus();
        return false;
      } else {
        $('select[ng-model="vm.visitor.hdyhau"]').removeClass("error-border");
      }
      if (vm.visitor.firstname == '' || vm.visitor.firstname.length > 20) {
        $('input[ng-model="vm.visitor.firstname"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.firstname"]').removeClass("error-border");
      }
      if (vm.visitor.lastname == '' || vm.visitor.lastname.length > 20) {
        $('input[ng-model="vm.visitor.lastname"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.lastname"]').removeClass("error-border");
      }
      if (!vm.visitor.idType) {
        $('input[ng-model="vm.visitor.idType"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.idType"]').removeClass("error-border");
      }
      var patt = checkCountryLength();
      if (!patt.test(vm.visitor.id)) {
        $('input[ng-model="vm.visitor.id"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.id"]').removeClass("error-border");
      }

      var patt = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
      if (!patt.test(vm.visitor.email)) {
        $('input[ng-model="vm.visitor.email"]').addClass("error-border").focus();
        vm.errors.email = true;
        return false;
      } else {
        $('input[ng-model="vm.visitor.email"]').removeClass("error-border");
        vm.errors.email = false;
      }
      var patt = new RegExp("^0(2|4)[0-9]{9}$");
      if (!patt.test(vm.visitor.phoneNumber)) {
        $('input[ng-model="vm.visitor.phoneNumber"]').addClass("error-border").focus();
        vm.errors.phone = true;
        return false;
      } else {
        $('input[ng-model="vm.visitor.phoneNumber"]').removeClass("error-border");
        vm.errors.phone = false;
      }
      if (vm.visitor.address == '' || vm.visitor.address.length > 256) {
        $('textarea[ng-model="vm.visitor.address"]').addClass("error-border").focus();
        return false;
      } else {
        $('textarea[ng-model="vm.visitor.address"]').removeClass("error-border");
      }

      if (vm.visitor.phoneModel && vm.visitor.phoneModel !== '') {
        if(vm.visitor.phoneModel.length < 4) {
          $('input[ng-model="vm.visitor.phoneModel"]').addClass("error-border").focus();
          return false;
        } else {
          $('input[ng-model="vm.visitor.phoneModel"]').removeClass("error-border");
        }
      }

      if(vm.visitor.imei && vm.visitor.imei !== ''){
        var patt = new RegExp("^[0-9]{14,15}$");
        if (!patt.test(vm.visitor.imei)) {
          $('input[ng-model="vm.visitor.imei"]').addClass("error-border").focus();
          vm.errors.imei = true;
          return false;
        } else {
          $('input[ng-model="vm.visitor.imei"]').removeClass("error-border");
          vm.errors.imei = false;
        }
      }

      if(vm.visitor.mpEmail && vm.visitor.mpEmail !== ''){
        var patt = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
        if (!patt.test(vm.visitor.mpEmail)) {
          $('input[ng-model="vm.visitor.mpEmail"]').addClass("error-border").focus();
          vm.errors.mpEmial = true;
          return false;
        } else {
          $('input[ng-model="vm.visitor.mpEmail"]').removeClass("error-border");
          vm.errors.mpEmial = false;
        }
      }
      if(vm.visitor.hdyhau === 'REFERRED' && vm.visitor.referred && vm.visitor.referred !== '' ){
        if (vm.visitor.referred.length < 4) {
          $('input[ng-model="vm.visitor.referred"]').addClass("error-border").focus();
          return false;
        } else {
          $('input[ng-model="vm.visitor.referred"]').removeClass("error-border");
        }
      }
      // if (vm.visitor.affiliated == '' || vm.visitor.affiliated.length < 4) {
      //   $('input[ng-model="vm.visitor.affiliated"]').addClass("error-border").focus();
      //   return false;
      // } else {
      //   $('input[ng-model="vm.visitor.affiliated"]').removeClass("error-border");
      // }
      if (vm.visitor.observations && vm.visitor.observations.length > 256) {
        $('input[ng-model="vm.visitor.observations"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.observations"]').removeClass("error-border");
      }
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
      var myBlock = blockUI.instances.get('PermissionsList');
      myBlock.start();
      vm.loading.new = true;
      adminService.createVisitor(obj)
        .then(function(json){
          vm.loading.new = false;
          vm.registerNew = false;
          vm.visitor = undefined;
          vm.errors = {};
          getVisitors();
          myBlock.stop();
        }, function(error){
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            vm.loading.new = false;
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          };
        });
    }

    function getVisitors(){
      vm.selectedUser=undefined;
      vm.visitors=[];
      // vm.totalVisitors=0;
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      var myBlock = blockUI.instances.get('PermissionsList');
      myBlock.start();
      adminService.getVisitors(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, vm.filter.country, vm.filter.states)
        .then(function(json){
          vm.visitors = json.data;
          vm.totalVisitors = json.total;
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

    function openVisitorNewActionFn(){
      var visitorNewAction = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/new.visitor.action.html',
        size: 'md',
        controller: 'newVisitorActionModalCtrl',
        controllerAs: 'visitorModalVm',
        resolve: {
          visitor: function(){
            return vm.selectedUser;
          },
          actions: function(){
            return vm.actions;
          },
          promoters: function(){
            return vm.promoters;
          }
        }
      });
      visitorNewAction.result.then(function(selectedItem) {
      }, function() {
        getVisitorActionsFn();
      });
    }

    function editVisitorFn(v){
      var visitor = angular.copy(v);
      vm.editVisitorRecord = true;
      vm.visitor = visitor;
      vm.visitor.firstname = visitor.name.split(' ')[0];
      vm.visitor.lastname = visitor.name.split(' ')[1];
      vm.visitor.idType = visitor.nationalId.split('-')[0];
      vm.visitor.id = +visitor.nationalId.split('-')[1];
      vm.visitor.phoneNumber = visitor.phone.replace('+58','0');
      vm.visitor.referred = visitor.referredBy;
      vm.visitor.affiliated = visitor.affiliatedBy;
      vm.visitor.observations = visitor.comments;
      selectUserFn(angular.copy(v));
    }

    function returnToListFn(){
      vm.isEditable = false;
      vm.editVisitorRecord = false;
      vm.visitor = undefined;
      vm.selectedUser = undefined;
    }

    function setEditableFn(){
      vm.isEditable = !vm.isEditable;
    }

    function saveEditVisitorFn(){
      if (vm.visitor.hdyhau == '0') {
        $('select[ng-model="vm.visitor.hdyhau"]').addClass("error-border").focus();
        return false;
      } else {
        $('select[ng-model="vm.visitor.hdyhau"]').removeClass("error-border");
      }
      if (vm.visitor.firstname == '' || vm.visitor.firstname.length > 20) {
        $('input[ng-model="vm.visitor.firstname"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.firstname"]').removeClass("error-border");
      }
      if (vm.visitor.lastname == '' || vm.visitor.lastname.length > 20) {
        $('input[ng-model="vm.visitor.lastname"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.lastname"]').removeClass("error-border");
      }
      if (!vm.visitor.idType) {
        $('input[ng-model="vm.visitor.idType"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.idType"]').removeClass("error-border");
      }
      var patt = checkCountryLength();
      if (!patt.test(vm.visitor.id)) {
        $('input[ng-model="vm.visitor.id"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.id"]').removeClass("error-border");
      }

      var patt = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
      if (!patt.test(vm.visitor.email)) {
        $('input[ng-model="vm.visitor.email"]').addClass("error-border").focus();
        vm.errors.email = true;
        return false;
      } else {
        $('input[ng-model="vm.visitor.email"]').removeClass("error-border");
        vm.errors.email = false;
      }
      var patt = new RegExp("^0(2|4)[0-9]{9}$");
      if (!patt.test(vm.visitor.phoneNumber)) {
        $('input[ng-model="vm.visitor.phoneNumber"]').addClass("error-border").focus();
        vm.errors.phone = true;
        return false;
      } else {
        $('input[ng-model="vm.visitor.phoneNumber"]').removeClass("error-border");
        vm.errors.phone = false;
      }
      if (vm.visitor.address == '' || vm.visitor.address.length > 256) {
        $('textarea[ng-model="vm.visitor.address"]').addClass("error-border").focus();
        return false;
      } else {
        $('textarea[ng-model="vm.visitor.address"]').removeClass("error-border");
      }

      if (vm.visitor.phoneModel && vm.visitor.phoneModel !== '') {
        if(vm.visitor.phoneModel.length < 4) {
          $('input[ng-model="vm.visitor.phoneModel"]').addClass("error-border").focus();
          return false;
        } else {
          $('input[ng-model="vm.visitor.phoneModel"]').removeClass("error-border");
        }
      }

      if(vm.visitor.imei && vm.visitor.imei !== ''){
        var patt = new RegExp("^[0-9]{14,15}$");
        if (!patt.test(vm.visitor.imei)) {
          $('input[ng-model="vm.visitor.imei"]').addClass("error-border").focus();
          vm.errors.imei = true;
          return false;
        } else {
          $('input[ng-model="vm.visitor.imei"]').removeClass("error-border");
          vm.errors.imei = false;
        }
      }

      if(vm.visitor.mpEmail && vm.visitor.mpEmail !== ''){
        var patt = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
        if (!patt.test(vm.visitor.mpEmail)) {
          $('input[ng-model="vm.visitor.mpEmail"]').addClass("error-border").focus();
          vm.errors.mpEmial = true;
          return false;
        } else {
          $('input[ng-model="vm.visitor.mpEmail"]').removeClass("error-border");
          vm.errors.mpEmial = false;
        }
      }
      if(vm.visitor.hdyhau === 'REFERRED' && vm.visitor.referred && vm.visitor.referred !== '' ){
        if (vm.visitor.referred.length < 4) {
          $('input[ng-model="vm.visitor.referred"]').addClass("error-border").focus();
          return false;
        } else {
          $('input[ng-model="vm.visitor.referred"]').removeClass("error-border");
        }
      }
      // if (vm.visitor.affiliated == '' || vm.visitor.affiliated.length < 4) {
      //   $('input[ng-model="vm.visitor.affiliated"]').addClass("error-border").focus();
      //   return false;
      // } else {
      //   $('input[ng-model="vm.visitor.affiliated"]').removeClass("error-border");
      // }
      if (vm.visitor.observations && vm.visitor.observations.length > 256) {
        $('input[ng-model="vm.visitor.observations"]').addClass("error-border").focus();
        return false;
      } else {
        $('input[ng-model="vm.visitor.observations"]').removeClass("error-border");
      }
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
      vm.loading.edit = true;
      adminService.editVisitor(vm.selectedUser.id, obj)
        .then(function(json){
          vm.loading.edit = false;
          ngToast.create('User updated Successful.');
          vm.errors = {};
          getVisitors();
          returnToListFn();
        }, function(error){
          var msg = '';
          if(error.data.code === 602){
            msg = 'Duplicate email.';
          }
          vm.loading.edit = false;
          ngToast.create({
            className: 'danger',
            content: 'Error creating new action. ' + msg
          });
        });
    }
  }
})();
