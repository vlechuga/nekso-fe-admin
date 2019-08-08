(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:ControllersCtrl
   * @description
   * # ControllersCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('ControllersCtrl', controllersCtrl);

  function controllersCtrl($scope, adminService, blockUI, utilService, $modal, ngToast) {
    if (utilService.getUserPermissionBase('read:tl')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;

    vm.loading = {};
    vm.controllers = [];
    vm.totalControllers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.filter = {
      country: undefined,
      states: undefined,
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
    vm.countryData=[];

    adminService.getCountries().then(function (supported) {
      vm.countryData = supported;
    });

    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchController = searchControllerFn;
    vm.searchControllerOnEnter = searchControllerOnEnterFn;
    vm.getCsvUrl = getCsvUrlFn;
    vm.openNewControllerDialog = openNewControllerDialogFn;
    vm.openControllerProfileDialog = openControllerProfileDialogFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.showCalendar = showCalendar;

    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getControllers();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getControllers();
      }
    }, true);

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2])) {
        vm.controls.currentPage = 1;
        getControllers();
      }
    }, true);

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0 && newVal !== oldVal) {
        getControllers();
      }
    });

    function clearSearchFieldFn() {
      vm.filter.searchText = '';
      searchFlag = false;
      getControllers();
    }

    function searchControllerFn() {
      searchFlag = true;
      getControllers();
    }

    function searchControllerOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getControllers();
      }
    }

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getControllers();
    }

    function getControllers() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('controllersList');
      myBlock.start();
      adminService.getAllControllers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.searchText, vm.filter.states, undefined, false)
        .then(function (controllers) {
          vm.controllers = controllers.data;
          vm.totalControllers = controllers.total;
          myBlock.stop();
        }, function (error) {
          if ((error.status === 401 || error.status === 403) && (error.data.code === 618)) {
            vm.notAuthMsg = error.data.description;
          } else {
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          }
        });
    }

    function getCsvUrlFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getAllControllers(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.searchText, vm.filter.states, undefined, true);
    }

    function openNewControllerDialogFn() {
      var newControllerModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/new.controller.html',
        size: 'lg',
        controller: 'NewControllerModalCtrl',
        controllerAs: 'vm',
        resolve: {
          countryData: function () {
            return vm.countryData;
          }
        }
      });
      newControllerModalInstance.result.then(function (selectedItem) {
      }, function () {
        getControllers();
      });
    }

    function openControllerProfileDialogFn(controller) {
      if (utilService.getUserPermission('read:tl')) {
        var controllerProfileModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/new.controller.html',
          size: 'lg',
          controller: 'EditControllerModalCtrl',
          controllerAs: 'vm',
          resolve: {
            controller: function () {
              return angular.copy(controller);
            },
            getUserPermission: function () {
              return vm.getUserPermission;
            },
            countryData: function () {
              return vm.countryData;
            }
          }
        });
        controllerProfileModalInstance.result.then(function (selectedItem) {
        }, function () {
          getControllers();
        });
      }
    }
  }
})();
