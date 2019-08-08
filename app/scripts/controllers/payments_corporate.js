(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PaymentsCorporateCtrl
   * @description
   * # PaymentsCorporateCtrl
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PaymentsCorporateCtrl', paymentsCorporateCtrl);

  function paymentsCorporateCtrl($scope, adminService, blockUI, $filter, utilService, $modal, ngToast) {
    if (utilService.getUserPermissionBase('read:payments')) {
      return true;
    }

    var vm = this;

    vm.loading = {};
    vm.corporates = [];
    vm.corporatesForRecharge = [];
    vm.totalCorporates = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.configurations = {
      sizeDisplayText: 30
    }
    vm.filter = {
      status: '',
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
    vm.predicate = 'createdAt';
    vm.reverse = true;
    vm.order = orderFn;
    vm.openCorporateProfileDialog = openCorporateProfileDialogFn;
    vm.searchCorporates = searchCorporatesFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.showCalendar = showCalendar;
    vm.getCsvUrl = getCsvUrlFn;
    vm.searchOnEnter = searchOnEnterFn;
    vm.clearSearchField = clearSearchFieldFn;
    // vm.getPictureId = getPictureIdFn;

    getCorporates();

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getCorporates();
      }
    }, true);

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.status]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2]) {
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
      return adminService.getCorporateTransactions(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.operation, vm.filter.status, vm.filter.searchText, true);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getCorporates();
    }

    function getPictureIdFn(img) {
      return adminService.getPictureUrl(img);
    }

    function getCorporates() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('corporatesList');
      myBlock.start();
      adminService.getCorporateTransactions(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.operation, vm.filter.status, vm.filter.searchText, false).then(function (corporates) {
        for (var i = 0; i < corporates.data.length; i++) {
          corporates.data[i].pictureUrl = getPictureIdFn(corporates.data[i].paymentProofPictureId);
        }
        vm.corporates = corporates.data;
        vm.total = corporates.total;
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
      if (utilService.getUserPermission('update:payments')) {
        if (corporate.status === 'PENDING') {
          var controllerProfileModalInstance = $modal.open({
            animate: true,
            templateUrl: '../../views/modals/payment.corporate.html',
            size: 'md',
            controller: 'PaymentsCorporateModalCtrl',
            controllerAs: 'corporateModalVm',
            resolve: {
              corporate: function () {
                return corporate;
              },
              getUserPermission: function () {
                return vm.getUserPermission;
              }
            }
          });
          controllerProfileModalInstance.result.then(function (selectedItem) {
          }, function () {
            getCorporates();
          });
        }
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
