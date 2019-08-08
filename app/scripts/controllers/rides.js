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
    .controller('RidesCtrl', ridesCtrl);

  function ridesCtrl($scope, adminService, $modal, blockUI, $filter, utilService, ngToast, $timeout) {
    if (utilService.getUserPermissionBase('read:rides')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;
    vm.loadingMultiSelect = false;
    vm.paymentMethods = undefined;

    vm.loading = {};
    vm.rides = [];
    vm.totalRides = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      country: undefined,
      states: undefined,
      taxiLine: '',
      status: '',
      searchText: '',
      tag: '',
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
    var loadingRides = false;
    var loadingControllers = false;
    var rideStates = {
      '': {
        'msg': '',
        'class': ''
      },
      'CANCELLED': {
        'msg': 'Cancelado',
        'class': 'ride-status-cancelled'
      },
      'COMPLETED': {
        'msg': 'Completado',
        'class': 'ride-status-completed'
      },
      'ONGOING': {
        'msg': 'En progreso',
        'class': 'ride-status-ongoing'
      },
      'REJECTED': {
        'msg': 'Rechazado',
        'class': 'ride-status-cancelled'
      }
    };

    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.openRideDetail = openRideDetailFn;
    vm.openPassengerProfile = openPassengerProfileFn;
    vm.openDriverProfile = openDriverProfileFn;
    vm.getRideStatus = getRideStatusFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.exportToCsv = exportToCsvFn;
    vm.showCalendar = showCalendar;
    vm.disableStatusFilter = disableStatusFilterFn;

    $timeout(function () {
      $('#filter_tag').multipleSelect({
        placeholder: "Tag"
      });
      $('#filter_source').multipleSelect({
        placeholder: "Source"
      });
      $('#filter_promotion_category').multipleSelect({
        placeholder: "Promo. category"
      });
      $('#filter_status').multipleSelect({
        placeholder: "Status"
      });
      vm.loadingMultiSelect = true;
    }, 50);

    $timeout(function () {
      getPaymentMethodsFn();
      vm.loadingMultiSelect = true;
    }, 50);

    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getRides();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getRides();
      }
    });

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          vm.controls.currentPage = 1;
          getRides();
          getControllers();
        }
      }
    });

    $scope.$watch('vm.filter.corporate', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.filter.corporate_id = undefined;
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.taxiLine, vm.filter.corporate, vm.filter.corporate_id, vm.filter.tag, vm.filter.typePayment, vm.filter.paidThroughNeksoAccount, vm.filter.source, vm.filter.promotionCategory, vm.filter.corporate_id]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5] || newVal[6] !== oldVal[6] || newVal[7] !== oldVal[7] || newVal[8] !== oldVal[8] || newVal[9] !== oldVal[9] || newVal[10] !== oldVal[10])) {
        vm.controls.currentPage = 1;
        setTimeout(function () {
          $('#filter_tag').multipleSelect("refresh");
          $('#filter_status').multipleSelect("refresh");
        }, 100);
        getRides();
      }
    }, true);

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getRides();
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = '';
      searchFlag = false;
      getRides();
    }

    function searchDriversFn() {
      searchFlag = true;
      getRides();
    }

    function searchDriversOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getRides();
      }
    }

    function getRides() {
      if (!loadingRides) {
        var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
        var myBlock = blockUI.instances.get('ridesList');
        myBlock.start();
        loadingRides = true;
        adminService.getAllRides(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
          utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
          vm.filter.status, vm.filter.taxiLine, vm.filter.searchText, vm.filter.corporate, vm.filter.tag,
          vm.filter.typePayment, vm.filter.paidThroughNeksoAccount, vm.filter.states, undefined, undefined, vm.filter.source,
          vm.filter.promotionCategory, vm.filter.corporate_id)
          .then(function (rides) {
            for (var i = 0, len = rides.data.length; i < len; i++) {
              if (angular.isDefined(rides.data[i].corporationId)) {
                rides.data[i].corporateImg = 'icon-corporate.png';
              } else {
                rides.data[i].corporateImg = 'icon-empty.png';
              }
              if (rides.data[i].rates) {
                for (var j = 0; j < rides.data[i].rates.length; j++) {
                  if (angular.isDefined(rides.data[i].rates[j].rateInfo)) {
                    if (rides.data[i].rates[j].byRole === "DRIVER") {
                      rides.data[i].driverComment = rides.data[i].rates[j].rateInfo.comment;
                    } else {
                      rides.data[i].passengerComment = rides.data[i].rates[j].rateInfo.comment;
                    }
                  }
                }
              }
            }
            vm.rides = rides.data;
            vm.totalRides = rides.total;
            myBlock.stop();
            loadingRides = false;
          }, function (error) {
            if ((error.status == 401 || error.status == 403) && (error.data.code == 618)) {
              vm.notAuthMsg = error.data.description;
            } else {
              ngToast.create({
                className: 'danger',
                content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
              });
              myBlock.stop();
              loadingRides = false;
            }
          });
      }
    }

    function getControllers() {
      if (angular.isDefined(vm.filter.country) && vm.filter.states.length > 0 && !loadingControllers) {
        loadingControllers = true;
        adminService.getAllControllers(undefined, undefined, '+name', undefined, undefined, undefined, vm.filter.states, undefined, false)
          .then(function (controllers) {
            vm.taxiLines = [];
            for (var i = 0, len = controllers.data.length; i < len; i++) {
              var controller = {};
              controller.id = controllers.data[i].id;
              controller.name = controllers.data[i].name;

              vm.taxiLines.push(controller);

            }
            // setTimeout(function(){$('#filter_controllers').multipleSelect("refresh");},100);
            loadingControllers = false;
          }, function (error) {
            console.log(error);
            loadingControllers = false;
          });
      }
    }

    function openRideDetailFn(ride) {
      if (getUserPermissionFn('read:rides')) {
        adminService.getLiveRideDetail(ride.id).then(function (data) {
          var rideModalInstance = $modal.open({
            animate: true,
            templateUrl: '../../views/modals/ride.html',
            size: 'lg',
            controller: 'RideModalCtrl',
            controllerAs: 'rideModalVm',
            resolve: {
              ride: function () {
                return data;
              }
            }
          });
        });
      }
    }

    function openPassengerProfileFn(ride) {
      if (getUserPermissionFn('read:rides')) {
        var passengerModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/passenger.html',
          size: 'sm',
          controller: 'PassengerModalCtrl',
          controllerAs: 'vm',
          resolve: {
            passenger: function () {
              return ride.passenger;
            },
            addSuspicious: function () {
              return false;
            },
            rideId: function () {
              return ride.id;
            }
          }
        });
      }
    }

    function openDriverProfileFn(ride) {
      if (getUserPermissionFn('read:rides')) {
        var driverModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/driver.html',
          size: 'sm',
          controller: 'DriverModalCtrl',
          controllerAs: 'vm',
          resolve: {
            driver: function () {
              return ride.driver;
            },
            addSuspicious: function () {
              return false;
            },
            rideId: function () {
              return ride.id;
            }
          }
        });
      }
    }

    function getRideStatusFn(ride) {
      if (!angular.isUndefined(ride.status)) {
        var state = '';
        switch (ride.status) {
          case "ONGOING":
            state = 'Ongoing';
            break;
          case "COMPLETED":
            state = 'Completed';
            break;
          case "CANCELLED":
            state = 'Cancelled';
            if (!angular.isUndefined(ride.statusUpdatedBy)) {
              if (ride.statusUpdatedBy === 'DRIVER') {
                state += ' by driver';
              } else if (ride.statusUpdatedBy === 'PASSENGER') {
                state += ' by passenger';
              } else if (ride.statusUpdatedBy === 'SYSTEM') {
                state += ' by system';
              }
            }
            break;
          case "NO_RESPONSE":
            state = 'No response';
            break;
          case "REJECTED":
            state = 'Rejected';
            break;
          case "REQUESTED":
            state = 'Requested';
            break;
          case 'CLOSED':
            state = 'Closed';
            if (!angular.isUndefined(ride.statusUpdatedBy)) {
              if (ride.statusUpdatedBy === 'DRIVER') {
                state += ' by driver';
              } else if (ride.statusUpdatedBy === 'PASSENGER') {
                state += ' by passenger';
              } else if (ride.statusUpdatedBy === 'SYSTEM') {
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

    function exportToCsvFn() {
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getAllRides(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.status, vm.filter.taxiLine, vm.filter.searchText, vm.filter.corporate,
        vm.filter.tag, vm.filter.typePayment, vm.filter.paidThroughNeksoAccount, vm.filter.states, true, undefined, vm.filter.source, vm.filter.promotionCategory)

      $timeout(function () {
        vm.loading.export = false;
      }, 10 * 1000);
    }

    function disableStatusFilterFn(status) {
      return status.some(function (element, index, array) {
        return vm.filter.status.indexOf(element) > -1;
      });
    }

    function getCorporatesFn() {
      adminService.getAllCorporates(undefined, undefined, undefined, undefined, undefined, undefined, 'OK', vm.filter.country, vm.filter.states, false)
        .then(function (response) {
          vm.corporates = [];
          for (var i = 0, len = response.data.length; i < len; i++) {
            var corporate = {};
            corporate.id = response.data[i].id;
            corporate.name = response.data[i].companyName;
            vm.corporates.push(corporate);
          }
          vm.corporates = $filter('orderBy')(vm.corporates, 'name');
        }, function (error) {
          console.log(error);
        });
    }

    $scope.getRideStatusClass = function (status) {
      if (!angular.isUndefined(status)) {
        return rideStates[status].class;
      }
    };

    $scope.getRideStatus = function (status) {
      if (!angular.isUndefined(status)) {
        return rideStates[status].msg;
      }
    };

    function getPaymentMethodsFn() {
      return adminService.getPaymentMethods()
        .then(function (methods) {
          vm.paymentMethods = methods;
        }, function (error) {
          console.log(error);
        });
    }
  }
})();
