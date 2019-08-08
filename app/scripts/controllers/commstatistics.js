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
    .controller('CommStatisticsCtrl', commStatisticsCtrl);

  function commStatisticsCtrl($scope, adminService, $modal, blockUI, $filter, utilService, ngToast, $timeout) {
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
    vm.totalAdministrator = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      searchText: '',
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

    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.showCalendar = showCalendar;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;

    //getAdministrators();

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getAdministrators();
        }
      }
    });

    $scope.$watch('[vm.filter.states]', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getAdministrators();
        }
      }
    }, true);

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.taxiLine, vm.filter.type]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4])){
        getAdministrators();
      }
    }, true);

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getAdministrators();
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

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getAdministrators();
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
      adminService.getCommStatistics(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, false, vm.filter.country, vm.filter.states)
        .then(function(json){
          var totalCall = 0;
          var totalSms = 0;
          var totalEmail = 0;
          var totalTraining = 0;
          var totalVisitorsCreated = 0;
          var totalActionsCreated = 0;
          var Administrator=json.data;
          for (var i = 0; i < Administrator.length; i++) {
            Administrator[i].fullName = Administrator[i].firstName+' '+Administrator[i].lastName;
            Administrator[i].fullName = Administrator[i].firstName+' '+Administrator[i].lastName;

            if(!angular.isDefined(Administrator[i].memberSupport) ) {
              Administrator[i].memberSupport = {};
            }
            if(!angular.isDefined(Administrator[i].memberSupport.totalCall) ) {
              Administrator[i].memberSupport.totalCall = 0;
            }
            if(!angular.isDefined(Administrator[i].memberSupport.totalSms) ) {
              Administrator[i].memberSupport.totalSms = 0;
            }
            if(!angular.isDefined(Administrator[i].memberSupport.totalEmail) ) {
              Administrator[i].memberSupport.totalEmail = 0;
            }
            if(!angular.isDefined(Administrator[i].memberSupport.totalTraining) ) {
              Administrator[i].memberSupport.totalTraining = 0;
            }
            if(!angular.isDefined(Administrator[i].visitorsCreated) ) {
              Administrator[i].visitorsCreated = 0;
            }
            if(!angular.isDefined(Administrator[i].actionsCreated) ) {
              Administrator[i].actionsCreated = 0;
            }

            totalCall += Administrator[i].memberSupport.totalCall;
            totalSms += Administrator[i].memberSupport.totalSms;
            totalEmail += Administrator[i].memberSupport.totalEmail;
            totalTraining += Administrator[i].memberSupport.totalTraining;
            totalVisitorsCreated += Administrator[i].visitorsCreated;
            totalActionsCreated += Administrator[i].actionsCreated;
          };
          vm.administrators = Administrator;
          vm.administrators.totalCall = totalCall;
          vm.administrators.totalSms = totalSms;
          vm.administrators.totalEmail = totalEmail;
          vm.administrators.totalTraining = totalTraining;
          vm.administrators.totalVisitorsCreated = totalVisitorsCreated;
          vm.administrators.totalActionsCreated = totalActionsCreated;
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

  }
})();
