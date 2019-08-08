(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp:FilterCountryState
   * @description
   * # FilterCountryState
   * Directive of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .directive('filterCountryState', filterCountryState).controller('CountryStateCtrl', countryStateCtrl);

  function filterCountryState() {
    return {
      restrict: 'AE',
      scope: {
        multiple: '@',
        country: '=',
        states: '='
      },
      bindToController: true,
      templateUrl: '../../views/directive/filter-country-state.html',
      controller: 'CountryStateCtrl',
      controllerAs: 'vm',
      link: function (scope, iElement, iAttributes) {
      }
    };
  }

  function countryStateCtrl($scope, adminService, $filter, $timeout) {
    var vm = this;
    vm.loading = false;
    vm.dataSourcesCountries = [];
    vm.dataSourcesStates = [];
    vm.originCountryStates = [];

    loadFn();

    $timeout(function () {
      if (vm.multiple === 'true') {
        var tmp = angular.copy(vm.states);
        $('#filter_states').multipleSelect({
          placeholder: "Select state",
          filter: true
        });
        vm.states = tmp;
      }
    }, 10);

    $scope.$watch('vm.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (angular.isDefined(vm.country)) {
          vm.dataSourcesStates = $filter('orderBy')($filter('filter')(vm.originCountryStates, {'iso': vm.country.iso}), 'name');
        }
        if (vm.multiple === 'true') {
          if(angular.isUndefined(vm.states) || (angular.isDefined(vm.states) && vm.states[0].iso !== vm.country.iso)) {
            vm.states = vm.dataSourcesStates;
          }
          setTimeout(function () {
            $('#filter_states').multipleSelect("refresh");
          }, 10);
        }
      }
    });

    function loadFn() {
      vm.loading = true;
      adminService.getCountries().then(function (data) {
        vm.dataSourcesCountries = data;
        adminService.getAllStates()
          .then(function (data) {
            vm.originCountryStates = data;
            setUpFn();
            vm.loading = false;
          }, function (error) {
            vm.loading = false;
          });
      }, function (error) {
        vm.loading = false;
      });
    }

    function setUpFn() {
      if (angular.isDefined(vm.country)) {
        for (var i = 0; i < vm.dataSourcesCountries.length; i++) {
          if (vm.dataSourcesCountries[i].iso === vm.country.iso) {
            vm.country = vm.dataSourcesCountries[i];
            break;
          }
        }
        if (angular.isDefined(vm.states)) {
          vm.dataSourcesStates = $filter('orderBy')($filter('filter')(vm.originCountryStates, {'iso': vm.country.iso}), 'name');
          var array = [];
          vm.states.map(function (_states) {
            array.push($filter('filter')(vm.dataSourcesStates, {'id': _states.id})[0]);
          });
          vm.states = array;
        }
      }
    }
  }

})();
