(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DriversCtrl
   * @description
   * # DriversCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('DriversCtrl', driversCtrl);

  function driversCtrl($scope, $modal, adminService, blockUI, $filter, utilService, ngToast, $timeout) {
    if (utilService.getUserPermissionBase('read:drivers')) {
      return true;
    }

    var vm = this;

    var searchFlag = false;
    var loadingDrivers = false;

    vm.loadingMultiSelect = false;
    vm.suspiciousHistory = 'Loading...';
    vm.urlCsv = undefined;
    vm.loading = {
      tag: false
    };
    vm.drivers = [];
    vm.totalDrivers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      country: undefined,
      states: undefined,
      status: '',
      taxiLine: '',
      searchText: '',
      tag: undefined,
      type: undefined,
      filterByBankAccount: false,
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
    vm.taxiLines = [];
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.order = orderFn;
    vm.openDriverProfile = openDriverProfileFn;
    vm.getDriverStatus = getDriverStatusFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.showCalendar = showCalendar;
    vm.tagUser = tagUserFn;
    vm.getSuspendedDescription = getSuspendedDescriptionFn;
    vm.getSuspiciousHistory = getSuspiciousHistoryFn;
    vm.tooltip = tooltipFn;
    vm.getCsvUrl = getCsvUrlFn;

    getRejectReasons();
    getSuspendReasons();

    function getRejectReasons() {
      return adminService.getRejectReasons()
        .then(function (rejectReasons) {
          vm.rejectReasons = rejectReasons;
        }, function (error) {
          console.log(error);
        });
    }

    function getSuspendReasons() {
      return adminService.getSuspendReasons()
        .then(function (suspendReasons) {
          vm.suspendReasons = suspendReasons;
        }, function (error) {
          console.log(error);
        });
    }

    $timeout(function () {
      $('#filter_controllers').multipleSelect({
        placeholder: "Select taxi line"
      });
      $('#filter_status').multipleSelect({
        placeholder: "Select status"
      });
      vm.loadingMultiSelect = true;
    }, 300);


    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getDrivers();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getDrivers();
      }
    });

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getDrivers();
          getControllers();
        }
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.rating, vm.filter.status, vm.filter.taxiLine, vm.filter.emailVerified, vm.filter.tag, vm.filter.filterByBankAccount, vm.filter.type]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5] || newVal[6] !== oldVal[6] || newVal[7] !== oldVal[7] || newVal[8] !== oldVal[8])) {
        vm.controls.currentPage = 1;
        getDrivers();
      }
    }, true);

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function getDrivers() {
      if (!loadingDrivers) {
        loadingDrivers = true;
        var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
        var myBlock = blockUI.instances.get('driversList');
        myBlock.start();
        adminService.getAllDrivers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
          utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
          vm.filter.rating, vm.filter.status, vm.filter.taxiLine, vm.filter.emailVerified,
          vm.filter.searchText, vm.filter.tag, undefined, undefined, vm.filter.states,
          vm.filter.filterByBankAccount, false, vm.filter.type)
          .then(function (drivers) {
            for (var i = 0; i < drivers.data.length; i++) {
              drivers.data[i].fullName = drivers.data[i].firstName + ' ' + drivers.data[i].lastName;
              drivers.data[i].controllerId = drivers.data[i].controller.id;
            }
            vm.drivers = drivers.data;
            vm.totalDrivers = drivers.total;
            myBlock.stop();
            tooltipFn();
            loadingDrivers = false;
          }, function (error) {
            if ((error.status === 401 || error.status === 403) && (error.data.code === 618)) {
              vm.notAuthMsg = error.data.description;
            } else {
              ngToast.create({
                className: 'danger',
                content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
              });
              myBlock.stop();
              loadingDrivers = false;
            }
          });
      }
    }

    function tooltipFn() {
      $("[data-toggle='tooltip']").tooltip();
    }

    function openDriverProfileFn(driver) {
      if (getUserPermissionFn('read:drivers')) {
        var driverModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/driver.html',
          size: 'sm',
          controller: 'DriverModalCtrl',
          controllerAs: 'vm',
          resolve: {
            driver: function () {
              return driver;
            },
            addSuspicious: function () {
              return true;
            },
            rideId: function () {
              return undefined;
            }
          }
        });
        driverModalInstance.result.then(function (selectedItem) {
        }, function () {
          getDrivers();
        });
      }
    }

    function getControllers() {
      if (angular.isDefined(vm.filter.country)) {
        adminService.getAllControllers(undefined, undefined, '+name', undefined, undefined, undefined, vm.filter.states)
          .then(function (controllers) {
            vm.taxiLines = [];
            for (var i = 0, len = controllers.data.length; i < len; i++) {
              var controller = {};
              controller.id = controllers.data[i].id;
              controller.name = controllers.data[i].name;

              vm.taxiLines.push(controller);
            }
            setTimeout(function () {
              $('#filter_controllers').multipleSelect("refresh");
            }, 10);
          }, function (error) {
            console.log(error);
          });
      }
    }

    function getSuspendedDescriptionFn(value) {
      return (value) ? vm.suspendReasons[value] : '';
    }

    function getDriverStatusFn(status) {
      if (angular.isDefined(status)) {
        var state = '';
        switch (status) {
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
            state = "Pending resignation";
            break;
          default:
            break;
        }
        return state;
      }
    }

    function getCsvUrlFn() {
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getAllDrivers(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.rating, vm.filter.status, vm.filter.taxiLine, vm.filter.emailVerified,
        vm.filter.searchText, vm.filter.tag, undefined, undefined, vm.filter.states, vm.filter.filterByBankAccount, true, vm.filter.type);
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = '';
      searchFlag = false;
      getDrivers();
    }

    function searchDriversFn() {
      searchFlag = true;
      getDrivers();
    }

    function searchDriversOnEnterFn(event) {
      if (event.which === 13) {
        searchFlag = true;
        getDrivers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDrivers();
    }

    function tagUserFn(userId, tag, add) {
      if (!vm.loading.tag) {
        adminService.addTag(userId, 'DRIVER', tag, add)
          .then(function (data) {
            ngToast.create({
              className: 'success',
              content: 'User has been tagged correctly'
            });
            vm.loading.tag = false;
            getDrivers();
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
        properties.role = "DRIVERS";
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
