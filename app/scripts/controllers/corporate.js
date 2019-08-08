(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CorporateCtrl
   * @description
   * # CorporateCtrl
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CorporateCtrl', CorporateCtrl);

  function CorporateCtrl($scope, adminService, blockUI, $filter, utilService, $modal, ngToast) {
    var vm = this;

    vm.loading = {};
    vm.corporates = [];
    vm.totalCorporates = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      status: undefined,
      country: undefined,
      states: undefined,
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
    vm.openCorporateProfileDialog = openCorporateProfileDialogFn;
    vm.searchCorporates = searchCorporatesFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.showCalendar = showCalendar;
    vm.getCsvUrl = getCsvUrlFn;
    vm.searchOnEnter = searchOnEnterFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.addBalance = addBalanceFn;

    function init() {
      adminService.getCorporationTypes().then(function (data) {
        vm.dataSourceTypes = data;
      });
      adminService.getCorporationSizes().then(function (data) {
        vm.dataSourceSizes = data;
      });
      adminService.getCountries().then(function (data) {
        vm.dataSourceCountries = data;
      });
      adminService.getAllStates().then(function (data) {
        vm.dataSourceCountryStates = data;
      });
      adminService.getCorporateDocuments().then(function (data) {
        vm.dataSourceDocuments = data;
      });
    }
    init();

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0 && newVal !== oldVal) {
        getCorporates();
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getCorporates();
      }
    }, true);

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.status]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2])) {
        vm.controls.currentPage = 1;
        getCorporates();
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

    function getCsvUrlFn() {
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      vm.csvUrl = adminService.getAllCorporates(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, vm.filter.status, vm.filter.country, vm.filter.states, true);
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
      adminService.getAllCorporates(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, vm.filter.status, vm.filter.country, vm.filter.states, false)
        .then(function (corporates) {
        vm.corporates = [];
        for (var i = 0, len = corporates.data.length; i < len; i++) {
          var corporation = corporates.data[i];
          var adminTemp = false;
          if (corporation.status === 'OK') {
            corporates.data[i].btnOk = false;
            corporates.data[i].btnReject = false;
            corporates.data[i].btnSuspend = true;
            corporates.data[i].btnReview = false;
          } else if (corporation.status === 'REJECTED') {
            corporates.data[i].btnOk = false;
            corporates.data[i].btnReject = false;
            corporates.data[i].btnSuspend = false;
            corporates.data[i].btnReview = true;
          } else if (corporation.status === 'SUSPENDED') {
            corporates.data[i].btnOk = false;
            corporates.data[i].btnReject = false;
            corporates.data[i].btnSuspend = false;
            corporates.data[i].btnReview = true;
          } else {
            corporates.data[i].btnOk = true;
            corporates.data[i].btnReject = true;
            corporates.data[i].btnSuspend = false;
            corporates.data[i].btnReview = false;
          }
          if (corporates.data[i].hasOwnProperty('requestUpdatedBy')) {
            corporates.data[i].admin = corporates.data[i].requestUpdatedBy.firstName + ' ' + corporates.data[i].requestUpdatedBy.lastName;
            corporates.data[i].formatedRequestUpdatedDate = $filter('date')(new Date(corporates.data[i].requestUpdatedDate), 'dd/MM/yyyy hh:mm a');
          } else {
            corporates.data[i].admin = null;
          }
          corporates.data[i].formatedCreatedDate = $filter('date')(new Date(corporates.data[i].createdDate), 'dd/MM/yyyy hh:mm a');
          if (!angular.isUndefined(corporates.data[i].pickupPoint)) {
            corporates.data[i].location = corporates.data[i].pickupPoint.latitude + ',' + corporates.data[i].pickupPoint.longitude;
          }
          if (corporates.data[i].ridesCount === 0) {
            corporates.data[i].ridesCount = '';
          }
          if (corporates.data[i].cancelledRidesCount === 0) {
            corporates.data[i].cancelledRidesCount = '';
          }
        }
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

    function openCorporateProfileDialogFn(corporate) {
      if (utilService.getUserPermission('read:corporate')) {
        var controllerProfileModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/edit.corporate.html',
          size: 'lg',
          controller: 'EditCorporateModalCtrl',
          controllerAs: 'vm',
          resolve: {
            corporate: function () {
              return corporate;
            },
            getUserPermission: function () {
              return vm.getUserPermission;
            },
            dataSourceTypes: function () {
              return vm.dataSourceTypes;
            },
            dataSourceSizes: function () {
              return vm.dataSourceSizes;
            },
            dataSourceCountries: function () {
              return vm.dataSourceCountries;
            },
            dataSourceCountryStates: function () {
              return vm.dataSourceCountryStates;
            },
            dataSourceDocuments: function () {
              return vm.dataSourceDocuments;
            }
          }
        });
        controllerProfileModalInstance.result.then(function (selectedItem) {
        }, function () {
          getCorporates();
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

    function addBalanceFn() {
      if (utilService.getUserPermission('update:corporate')) {
        var controllerRechargeModalInstance = $modal.open({
          backdrop: 'static',
          animate: true,
          templateUrl: '../../views/modals/add.balance.html',
          size: 'sm',
          controller: 'AddBalanceModalCtrl',
          controllerAs: 'vm',
          resolve: {
            getUserPermission: function () {
              return vm.getUserPermission;
            },
            country: function () {
              return vm.filter.country;
            },
            states: function () {
              return vm.filter.states;
            }
          }
        });
        controllerRechargeModalInstance.result.then(function (selectedItem) {
        }, function () {
          getCorporates();
        });
      } else {
        ngToast.create({
          className: 'danger',
          content: 'You dont have permission to edit this corporation.'
        });
      }
    }
  }
})();
