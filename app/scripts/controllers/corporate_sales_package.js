(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CorporateSalesPackageCtrl
   * @description
   * # CorporateSalesPackageCtrl
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CorporateSalesPackageCtrl', corporateSalesPackageCtrl);

  function corporateSalesPackageCtrl($scope, $modal, $filter, adminService, blockUI, utilService, ngToast) {
    if (utilService.getUserPermissionBase('read:corporate')) {
      return true;
    }

    var vm = this;

    vm.loading = {};
    vm.corporates = [];
    vm.totalCorporates = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      searchText: undefined,
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
    vm.openCorporateSalesPackageHistoryDialogFn = openCorporateSalesPackageHistoryDialogFn;
    vm.searchCorporates = searchCorporatesFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.showCalendar = showCalendar;
    vm.searchOnEnter = searchOnEnterFn;
    vm.clearSearchField = clearSearchFieldFn;

    function init() {
      getCorporates();
    }

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getCorporates();
      }
    }, true);

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1])) {
        vm.controls.currentPage = 1;
        getCorporates();
      }
    }, true);

      $scope.$watch('[vm.filter.states]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0]) {
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getCorporates();
        }
      }
    }, true);

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function searchOnEnterFn(event) {
      if (event.which === 13) {
        getCorporates();
      }
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = '';
      getCorporates();
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getCorporates();
    }

    function getCorporates() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('corporatesList');
      myBlock.start();
      adminService.getAllCorporatesSalesPackage(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, vm.filter.country, vm.filter.states).then(function (corporates) {
        vm.corporates = [];
        vm.corporates = corporates.data;
        vm.totalCorporates = corporates.total;
        myBlock.stop();
      }, function (error) {
        ngToast.create({
          className: 'danger',
          content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
        });
        myBlock.stop();
      });
    }

    function openCorporateSalesPackageHistoryDialogFn(corporate) {
      if (utilService.getUserPermission('read:corporate')) {
        var controllerProfileModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/corporation_sales_package_detail_modal.html',
          size: 'lg',
          controller: 'CorporateSalesPackageDetailModalCtrl',
          controllerAs: 'vm',
          resolve: {
            corporateId: function () {
              return corporate.id;
            }
          }
        });
        controllerProfileModalInstance.result.then(function (selectedItem) {
        }, function () {

        });
      } else {
        ngToast.create({
          className: 'danger',
          content: 'You dont have permission to edit this corporation.'
        });
      }
    }

    function searchCorporatesFn() {
      getCorporates();
    }

  }
})();
