(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PassengersCtrl
   * @description
   * # PassengersCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PassengersCtrl', passengersCtrl);

  function passengersCtrl($scope, adminService, blockUI, $timeout, utilService, ngToast, $modal) {
    if (utilService.getUserPermissionBase('read:passengers')) {
      return true;
    }

    var vm = this;
    vm.loadingMultiSelect = false;

    var searchFlag = false;
    vm.loading = {};
    vm.passengers = [];
    vm.totalPassengers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.suspiciousHistory = 'Loading...';
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.csvUrl = undefined;
    vm.filter = {
      country: undefined,
      states: undefined,
      searchText: undefined,
      tag: undefined,
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
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.showCalendar = showCalendar;
    vm.openPassengerProfile = openPassengerProfileFn;
    vm.exportToCsv = exportToCsvFn;
    vm.tagUser = tagUserFn;
    vm.getSuspiciousHistory = getSuspiciousHistoryFn;

    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getPassengers();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getPassengers();
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.rating, vm.filter.emailVerified, vm.filter.status, vm.filter.tag]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4])) {
        vm.controls.currentPage = 1;
        getPassengers();
      }
    }, true);

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
        getPassengers();
      }
    });

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = undefined;
      searchFlag = false;
      getPassengers();
    }

    function searchDriversFn() {
      if ((vm.filter.searchText.indexOf("@") > -1) && (vm.filter.searchText.indexOf(".") > vm.filter.searchText.indexOf("@"))) {
        vm.filter.searchText = '"' + vm.filter.searchText + '"';
      }
      searchFlag = true;
      getPassengers();
    }

    function searchDriversOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getPassengers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getPassengers();
    }

    function getPassengers() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('passengersList');
      myBlock.start();
      adminService.getAllPassengers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.rating, vm.filter.emailVerified, vm.filter.searchText, vm.filter.tag, undefined, undefined, vm.filter.states, vm.filter.status, false)
        .then(function (passengers) {
          vm.passengers = passengers.data;
          vm.totalPassengers = passengers.total;
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

    function openPassengerProfileFn(passenger) {
      var passengerModalInstance = $modal.open({
        backdrop: 'static',
        animate: true,
        templateUrl: '../../views/modals/passenger.html',
        size: 'sm',
        controller: 'PassengerModalCtrl',
        controllerAs: 'vm',
        resolve: {
          passenger: function () {
            return passenger;
          },
          addSuspicious: function () {
            return true;
          },
          rideId: function () {
            return undefined;
          }
        }
      });
      passengerModalInstance.result.then(function (selectedItem) {
      }, function () {
        getPassengers();
      });
    }

    function exportToCsvFn() {
      vm.loading.export = true;

      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getAllPassengers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.rating, vm.filter.emailVerified, vm.filter.searchText, undefined, undefined, undefined, vm.filter.states, vm.filter.status, true);

      $timeout(function () {
        vm.loading.export = false;
      }, 5 * 1000);
    }

    function tagUserFn(userId, tag, add) {
      if (!vm.loading.tag) {
        adminService.addTag(userId, 'PASSENGER', tag, add)
          .then(function (data) {
            ngToast.create({
              className: 'success',
              content: 'User has been tagged correctly'
            });
            vm.loading.tag = false;
            getPassengers();
          }, function (error) {
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            vm.loading.tag = false;
          });
      }
    }

    function getSuspiciousHistoryFn(user) {
      vm.suspiciousHistory = 'Loading...';
      if (angular.isDefined(user.suspiciousInfo) && user.suspiciousInfo.times > 0) {
        var properties = {};
        properties.role = "PASSENGERS";
        properties.userId = user.id;
        properties.limit = 10;
        properties.skip = 0;
        properties.order = "-date";

        adminService.getSuspiciousHistory(properties)
          .then(function (history) {
            var render = '<div class="suspicious-history-container">';
            history.data.forEach(function (element) {
              render += '<div>' + moment(element.date).format("DD/MM/YYYY") + '</div>';
            });
            render += '</div>';
            vm.suspiciousHistory = render;
          });
      } else {
        vm.suspiciousHistory = "User don't have info.";
      }
    }

  }
})();
