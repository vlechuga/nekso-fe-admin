(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DriversCtrl
   * @description
   * # DriversCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CorporatesPromotionsCtrl', CorporatesPromotionsCtrl);

  function CorporatesPromotionsCtrl($scope, $modal, adminService, blockUI, utilService, ngToast, $timeout) {
    if (utilService.getUserPermissionBase('read:promotions')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;

    vm.loading = {};
    vm.coupons = [];
    vm.totalDrivers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      status: '',
      taxiLine: '',
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

    // console.log('testing');
    // return true;

    vm.exportToCsvUrl='';

    vm.predicate = 'createdAt';
    vm.reverse = true;
    vm.order = orderFn;
    vm.openClubHistory = openClubHistoryFn;
    vm.getCouponstatus = getCouponstatusFn;
    vm.exportToCsv = exportToCsvFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;


    vm.updateOil = updateOilFn;
    vm.validateCode = validateCodeFn;
    vm.roles = [];

    // getRoles('DRIVER');
    //getCoupons();

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getCoupons();
        }
      }
    });

    $scope.$watch('[vm.filter.states]', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getCoupons();
        }
      }
    }, true);

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.badge]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5] || newVal[6] !== oldVal[6] || newVal[7] !== oldVal[7] || newVal[8] !== oldVal[8] || newVal[9] !== oldVal[9])){
        getCoupons();
      }
    }, true);

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }
    function getRoles(role){
      adminService.getClubNeksoRoles(role)
      .then(function(roles){
        vm.roles = roles;
      });
    }

    function validateCodeFn(driver){
      // console.log(driver);
      adminService.redeemClubNekso(driver.lastAchievement.awards[0].id, driver.user.id, driver.validateCode)
      .then(function(response){

        // console.log(response);
        ngToast.create({
          className: 'success',
          content: 'Code Validation successful'
        });
        getCoupons();

      }, function (error){
        // console.log(error);
        ngToast.create({
          className: 'danger',
          content: 'Error processing your request. ' + error.status + ' - ' + error.data.description
        });
      });
    }
    function updateOilFn(driver){
      // console.log(driver);
      adminService.updateAwards(driver.lastAchievement.awards[0].id, driver.oil)
      .then(function(response){
        getCoupons();
      }, function (error){
        ngToast.create({
          className: 'danger',
          content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
        });
      });
    }

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function getCoupons(){
      // console.log(vm.exportToCsvUrl);
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      exportToCsvFn(orderBy);
      var myBlock = blockUI.instances.get('driversList');
      myBlock.start();
      adminService.getCoupons(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, vm.filter.searchText, vm.filter.status, vm.filter.country, vm.filter.states)
        .then(function(coupons) {
          // for(var i = 0; i < drivers.data.length; i++){
          //   drivers.data[i].fullName = drivers.data[i].firstName + ' ' + drivers.data[i].lastName;
          //   drivers.data[i].controllerId = drivers.data[i].controller.id;
          //   if(typeof drivers.data[i].tags !== 'undefined'){
          //     drivers.data[i].tagRole = 'fa fa-briefcase';
          //   }
          //   if(typeof drivers.data[i].memberSupport !== 'undefined'){
          //     drivers.data[i].memberSupport.totalSms = setFieldNull(drivers.data[i].memberSupport.totalSms, 0);
          //     drivers.data[i].memberSupport.totalEmail = setFieldNull(drivers.data[i].memberSupport.totalEmail,0);
          //     drivers.data[i].memberSupport.totalCall = setFieldNull(drivers.data[i].memberSupport.totalCall,0);
          //     drivers.data[i].memberSupport.totalTraining = setFieldNull(drivers.data[i].memberSupport.totalTraining,0);
          //   }
          // }
          vm.coupons = coupons.data;
          vm.totalPromo = coupons.total;
          console.log(vm.coupons);
          myBlock.stop();
        }, function(error) {
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
      // console.log(vm.exportToCsvUrl);
    }

    function openClubHistoryFn(driver){
      if (getUserPermissionFn('read:promotions')) {
        var clubHistoryInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/clubHistory.html',
          size: 'lg',
          controller: 'ClubHistoryModalCtrl',
          controllerAs: 'historyModalVm',
          resolve: {
            history: function(){
              return driver.achievements;
            }
          }
        });
      }
    }

    function getCouponstatusFn(status){
      if(!angular.isUndefined(status)){
        var state = '';
        switch (status){
          case "OK":
            state = 'Approved';
            break;
          case "IN_REVIEW":
            state = 'In review';
            break;
          case "APPROVAL_EXPIRED":
            state = 'Approval time expired';
            break;
          case "SUSPENDED":
            state = 'Suspended';
            break;
          case "REJECTED":
            state = 'Rejected';
            break;
          case "PENDING_RESIGNATION":
            state = "Pending resignation"
            break;
          default:
            break;
        }
        return state;
      }
    }

    function exportToCsvFn(orderBy){
      var url;
      url = adminService.getClubNeksoUsersCSV(undefined, undefined, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, undefined, vm.filter.badge, vm.filter.status, "DRIVER")
      vm.exportToCsvUrl = url;
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag  = false;
      getCoupons();
    }

    function searchDriversFn(){
      searchFlag = true;
      getCoupons();
    }

    function searchDriversOnEnterFn(event){
      if(event.which === 13){
        searchFlag = true;
        getCoupons();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getCoupons();
    };
  }
})();
