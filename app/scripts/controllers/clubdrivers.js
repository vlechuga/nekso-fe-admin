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
    .controller('ClubDriversCtrl', ClubDriversCtrl);

  function ClubDriversCtrl($scope, $modal, adminService, blockUI, $filter, utilService, ngToast, store, $timeout) {
    if (utilService.getUserPermissionBase('read:club_driver')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;

    vm.countriesCollection = [];
    vm.statesCollection = [];
    vm.makes = [];
    vm.models = [];

    adminService.getCarMakes()
    .then(function(data){
      vm.makes = data;
    });

    vm.loading = {};
    vm.drivers = [];
    vm.totalDrivers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      country: undefined,
      status: '',
      taxiLine: '',
      searchText: '',
      make: '',
      model: '',
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

    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.order = orderFn;
    vm.openClubHistory = openClubHistoryFn;
    vm.getDriverStatus = getDriverStatusFn;
    vm.exportToCsv = exportToCsvFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;


    vm.updateOil = updateOilFn;
    vm.validateCode = validateCodeFn;
    vm.roles = [];

    getRoles('DRIVER');
    //getDrivers();

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getDrivers();
        }
      }
    });

    $scope.$watch('[vm.filter.states]', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getDrivers();
        }
      }
    }, true);

    $scope.$watch('vm.filter.make', function(newVal, oldVal){
      if(newVal !== oldVal){
        vm.models = [];
        adminService.getCarModels(newVal)
        .then(function(data){
          vm.models = data;
        });
      }
    });

    $scope.$watch('vm.filter.model', function(newVal, oldVal){
      if(newVal !== oldVal){
          if(vm.filter.model === "ALL") {
            vm.filter.model = "";
          }
          getDrivers();
      }
    });

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.badge]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5] || newVal[6] !== oldVal[6] || newVal[7] !== oldVal[7] || newVal[8] !== oldVal[8] || newVal[9] !== oldVal[9])){
        getDrivers();
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
        getDrivers();

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
        getDrivers();
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

    function getDrivers(){
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      var myBlock = blockUI.instances.get('driversList');
      myBlock.start();
      adminService.getClubNeksoUsers(
        vm.controls.numPerPage,
        vm.controls.currentPage - 1,
        orderBy, utilService.toStringDate(vm.filter.date.startDate),
        utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.searchText,
        vm.filter.country,
        vm.filter.states,
        vm.filter.make,
        vm.filter.model,
        vm.filter.badge,
        vm.filter.status,
        "DRIVER")
        .then(function(achieve) {

          vm.drivers = achieve.data;
          vm.totalDrivers = achieve.total;
          for (var i = 0; i < achieve.data.length; i++) {
            var driver=achieve.data[i];
            if (vm.filter.badge && !vm.filter.badge=='') {
              if (driver.lastAchievement.achievement.id!==vm.filter.badge){
                for (var j = 0; j < driver.achievements.length; j++) {
                  if(driver.achievements[j].achievement.id===vm.filter.badge){
                    driver.lastAchievement=driver.achievements[j];
                    break;
                  }
                }
              }
            } else {
              /*if (driver.lastAchievement && driver.lastAchievement.awards[0] && driver.lastAchievement.awards[0].awardAdditionalDescription) {
                driver.oil=driver.lastAchievement.awards[0].awardAdditionalDescription;
              }
              for (var j = 0; j < driver.lastAchievement.awards.length; j++) {
                if(driver.lastAchievement.awards[j].status=='ACTIVE' && j!=0){
                  driver.lastAchievement.awards.unshift(driver.lastAchievement.awards.splice(j,1)[0]);
                  break;
                }
              }
              */
            }
          }
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
      if (getUserPermissionFn('read:club_driver')) {
        var clubHistoryInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/clubHistory.html',
          size: 'lg',
          controller: 'ClubHistoryModalCtrl',
          controllerAs: 'historyModalVm',
          resolve: {
            driver: function() {
              return driver.driver;
            }
          }
        });
      };
    }

    function getDriverStatusFn(status){
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
      //limit, skip, order, from, to, search, country, states, badge, status, role, car_make, car_model
      return adminService.getClubNeksoUsersCSV(
        undefined,
        undefined,
        orderBy,
        utilService.toStringDate(vm.filter.date.startDate),
        utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.searchText,
        vm.filter.country,
        vm.filter.states,
        vm.filter.badge,
        vm.filter.status,
        "DRIVER",
        vm.filter.make,
        vm.filter.model
        );
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag  = false;
      getDrivers();
    }

    function searchDriversFn(){
      searchFlag = true;
      getDrivers();
    }

    function searchDriversOnEnterFn(event){
      if(event.which == 13){
        searchFlag = true;
        getDrivers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDrivers();
    };
  }
})();
