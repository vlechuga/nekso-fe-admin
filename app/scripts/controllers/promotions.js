/**
 * Created by abarazarte on 22/06/16.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PromotionsCtrl
   * @description
   * # PromotionsCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('PromotionsCtrl', promotionsCtrl);

  function promotionsCtrl($scope, $location, utilService, adminService, blockUI, ngToast, $modal, store) {
    if (utilService.getUserPermissionBase('read:promotions')) {
      return true;
    }

    var vm = this;

    var searchFlag = false;
    var initialFilters = {
      states: undefined,
      country: undefined,
      target: undefined,
      status: undefined,
      searchText: undefined,
      date: {
        startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
        endDate: moment().endOf('year').hours(23).minutes(59).seconds(59).milliseconds(999)
      },
      controls: {
        numPerPage: 10,
        currentPage: 1
      }
    };

    vm.promotions = [];
    vm.totalPromotions = 0;
    vm.loading = {};
    vm.predicate = 'createdAt';
    vm.reverse = true;
    vm.dateRangePickerOptions = {
      timePicker: true,
      timePicker24Hour: true,
      locale: {
        applyClass: 'btn-green',
        applyLabel: "Apply",
        fromLabel: "From",
        format: "DD/MM/YYYY",
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
    };

    loadFn();

    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.getCsvUrl = getCsvUrlFn;
    vm.openPromotion = openPromotionFn;
    vm.changePromotionStatus = changePromotionStatusFn;
    vm.getUserPermission = getUserPermissionFn;

    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getPromotionsFn();
        }
      }
    });

    $scope.$watch('vm.filter.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getPromotionsFn();
      }
    });

    $scope.$watch('[vm.filter.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.target, vm.filter.category]', function (newVal, oldVal) {
      if (angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4])) {
        vm.filter.controls.currentPage = 1;
        getPromotionsFn();
      }
    }, true);

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getPromotionsFn();
        }
      }
    }, true);

    $scope.$watch('vm.filter', function (newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        store.set('promotions_filter', vm.filter);
      }
    }, true);

    function loadFn() {
      if (store.get('promotions_filter')) {
        vm.filter = store.get('promotions_filter');
        getPromotionsFn();
      } else {
        vm.filter = initialFilters;
      }
    }

    function getPromotionsFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('promotionsList');
      myBlock.start();
      adminService.getPromotions(vm.filter.controls.numPerPage, vm.filter.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.searchText, vm.filter.status, vm.filter.target, vm.filter.category, vm.filter.country, vm.filter.states, false)
        .then(function (promotions) {
          vm.promotions = promotions.data;
          vm.totalPromotions = promotions.total;
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

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getPromotionsFn();
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = undefined;
      searchFlag = false;
      getPromotionsFn();
    }

    function searchDriversFn() {
      searchFlag = true;
      getPromotionsFn();
    }

    function searchDriversOnEnterFn(event) {
      if (event.keyCode === 13) {
        searchFlag = true;
        getPromotionsFn();
      }
    }

    function getCsvUrlFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      return adminService.getPromotions(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.searchText, vm.filter.status, vm.filter.target, vm.filter.category, vm.filter.country, vm.filter.states, true);
    }

    function openPromotionFn(promotionId) {
      $location.path('promotions/' + promotionId);
    }

    function changePromotionStatusFn(promotion, status) {
      var promotionModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/promotion_status.html',
        size: 'md',
        controller: 'PromotionStatusModalCtrl',
        controllerAs: 'promotionStatusModalVm',
        resolve: {
          promotion: function () {
            return promotion.id;
          },
          promotionName: function () {
            return promotion.name;
          },
          status: function () {
            return status;
          }
        }
      });
      promotionModalInstance.result.then(function (selectedItem) {
      }, function () {
        getPromotionsFn();
      });
    }

  }
})();
