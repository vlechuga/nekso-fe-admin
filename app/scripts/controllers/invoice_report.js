(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:InvoiceReportCtrl
   * @description
   * # InvoiceReportCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('InvoiceReportCtrl', invoiceReportCtrl);

  function invoiceReportCtrl($scope, adminService, blockUI, $filter, utilService) {
    if (utilService.getUserPermissionBase('export:invoice')) {
      return true;
    }

    var vm = this;
    vm.activeButton = true;
    vm.loading = false;
    vm.taxiLines = [];
    vm.corporations = [];
    vm.filter = {
      country: undefined,
      states: undefined,
      type_report: undefined,
      controller: undefined,
      dateMonth: undefined,
      dateDay: undefined,
      dateRange: {
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

    vm.getUserPermission = getUserPermissionFn;
    vm.getCsvUrl = getCsvUrlFn;

    $scope.$watch('vm.filter.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.filter.type_report = undefined;
        vm.filter.controller = undefined;
        vm.filter.corporation = undefined;
      }
    });

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (newVal && oldVal && newVal.name !== oldVal.name) {
        if (vm.filter.states.length>0) {
          vm.filter.type_report = undefined;
          vm.filter.controller = undefined;
          vm.filter.corporation = undefined;
          vm.taxiLines = [];
          vm.corporations = [];
        }
      }
    });

    $scope.$watch('vm.filter.type_report', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (vm.filter.type_report !== undefined) {
          if ((vm.filter.type_report === 'REPORT_1' || vm.filter.type_report === 'REPORT_2' ||
              vm.filter.type_report === 'REPORT_3') && vm.taxiLines.length===0 && vm.corporations.length===0) {
            getControllers();
            getCorporations();
          }
        }
      }
    });

    $scope.$watch('[vm.filter.country, vm.filter.states, vm.filter.type_report,  vm.filter.controller, vm.filter.corporation, vm.filter.dateDay, vm.filter.dateMonth, vm.filter.dateRange]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5] || newVal[6] !== oldVal[6] || newVal[7] !== oldVal[7]) {
        vm.activeButton = activeButtonGenerateFn();
      }
    }, true);

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function getControllers() {
      if (angular.isDefined(vm.filter.type_report)) {
        var myBlock = blockUI.instances.get('invoice');
        myBlock.start();
        adminService.getAllControllers(undefined, undefined, '+name', undefined, undefined, undefined, vm.filter.states)
          .then(function (controllers) {
            vm.taxiLines = [];
            for (var i = 0, len = controllers.data.length; i < len; i++) {
              var controller = {};
              controller.id = controllers.data[i].id;
              controller.name = controllers.data[i].name;
              vm.taxiLines.push(controller);
            }
            myBlock.stop();
          }, function (error) {
            myBlock.stop();
            console.log(error);
          });
      }
    }

    function getCorporations() {
      if (angular.isDefined(vm.filter.type_report)) {
        var myBlock = blockUI.instances.get('invoice');
        myBlock.start();
        adminService.getAllCorporates(undefined, undefined, '+companyName', undefined, undefined, undefined, 'OK', undefined, vm.filter.states, false)
          .then(function (corporations) {
            vm.corporations = [];
            for (var i = 0, len = corporations.data.length; i < len; i++) {
              if (angular.isDefined(corporations.data[i].ridesCount) && corporations.data[i].ridesCount > 0) {
                var corporation = {};
                corporation.id = corporations.data[i].id;
                corporation.name = corporations.data[i].companyName;
                vm.corporations.push(corporation);
              }
            }
            myBlock.stop();
          }, function (error) {
            myBlock.stop();
            console.log(error);
          });
      }
    }

    function getCsvUrlFn() {
      var date, year, month;
      if (vm.filter.type_report !== '') {
        if (vm.filter.type_report === 'REPORT_1') {
          return adminService.accumulativeRidesByDriver(vm.filter.country.iso, vm.filter.states, utilService.toStringDate(moment(vm.filter.dateDay)), vm.filter.controller);
        }
        if (vm.filter.type_report === 'REPORT_2') {
          date = new Date(vm.filter.dateMonth);
          year = date.getFullYear();
          month = date.getMonth();
          return adminService.accumulativeRidesByTaxiLine(vm.filter.country.iso, vm.filter.states, year, month + 1, vm.filter.controller);
        }
        if (vm.filter.type_report === 'REPORT_3') {
          date = new Date(vm.filter.dateMonth);
          year = date.getFullYear();
          month = date.getMonth();
          return adminService.corporateRecharge(vm.filter.country.iso, vm.filter.states, year, month + 1, vm.filter.corporation);
        }
        if (vm.filter.type_report === 'REPORT_4') {
          date = new Date(vm.filter.dateMonth);
          year = date.getFullYear();
          month = date.getMonth();
          return adminService.invoiceReportSystem(vm.filter.country.iso, vm.filter.states, year, month + 1, vm.filter.corporation);
        }
        if (vm.filter.type_report === 'REPORT_5') {
          return adminService.invoiceReportPendingCommissions(vm.filter.country.iso, vm.filter.states, utilService.toStringDate(vm.filter.dateRange.startDate), utilService.toStringDate(vm.filter.dateRange.endDate));
        }
      }
    }

    function activeButtonGenerateFn() {
      if (vm.filter.type_report !== undefined) {
        if (vm.filter.type_report === 'REPORT_1') {
          if (vm.filter.country !== undefined && vm.filter.dateDay !== undefined && vm.filter.dateDay !== null) {
            return false;
          }
        }
        if (vm.filter.type_report === 'REPORT_2' || vm.filter.type_report === 'REPORT_3' || vm.filter.type_report === 'REPORT_4') {
          if (vm.filter.country !== undefined && vm.filter.dateMonth !== undefined && vm.filter.dateMonth !== null) {
            return false;
          }
        }
        if (vm.filter.type_report === 'REPORT_5') {
          if (vm.filter.country !== undefined && vm.filter.dateRange !== undefined) {
            return false;
          }
        }
      }
      return true;
    }
  }
})();
