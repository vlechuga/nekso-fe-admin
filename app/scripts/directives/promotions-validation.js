(function(){
  'use strict';

  function promotionsValidationFilter() {
    return {
      restrict: 'E',
      scope: {
        scheduling: '=',
        validations: '='
      },
      bindToController: true,
      controller: 'PromotionsValidationController',
      controllerAs: 'vm',
      link: function (scope, iElement, iAttributes) {}
    };
  }

  function promotionsValidationController($scope, featureToggleFactory, promotionsService) {

    var vm = this;
    vm.featureToggle = featureToggleFactory;

    if (vm.featureToggle.isFeatureEnabled('specificSchedule')) {
      $scope.$watch('vm.scheduling', handleWatchForValidateScheduleFn, true);
    }

    function handleWatchForValidateScheduleFn(newVal) {
      if (!vm.validations[0]) {
        promotionsService.initErrorsInSpecificSchedule(newVal);
      }
      validateRepeatedDaysWeekFn(newVal);
      for (var index in newVal) {
        if (newVal.hasOwnProperty(index)) {
          validateFirstRangeTimes(newVal, index);
          validateSecondRangeTimes(newVal, index);
          validateFromFieldWithLastFieldOfFirstBlock(newVal, index);
          validateSpecialFieldRequired(newVal, index);
        }
      }
    }

    function validateRepeatedDaysWeekFn(newVal) {
      var scheduleIndexFound = promotionsService.isDuplicateScheduleCollection(newVal);
      var isDuplicatedDay = scheduleIndexFound !== -1;

      for (var index in newVal) {
        if (newVal.hasOwnProperty(index) &&
          newVal[index].dayOfWeek !== '') {
          if (vm.validations[index]) {
            vm.validations[index].repeatDay = false;
          }
        }
      }

      if (isDuplicatedDay) {
          vm.validations[scheduleIndexFound].repeatDay = isDuplicatedDay;
      }

    }

    function validateFirstRangeTimes(newVal, index) {
      if (newVal[index].hourIntervals[0] &&
        newVal[index].hourIntervals[0].from &&
        newVal[index].hourIntervals[0].to) {

          var firstTimeFrom = moment(newVal[index].hourIntervals[0].from).toDate().getTime();
          var firstTimeTo = moment(newVal[index].hourIntervals[0].to).toDate().getTime();
          if (vm.validations[index]) {
            vm.validations[index].toFieldLessThanFromFieldInFirstBlock =
              firstTimeTo <= firstTimeFrom;
          }

      }
    }

    function validateSecondRangeTimes(newVal, index) {
      if (newVal[index].hourIntervals[1] &&
        newVal[index].hourIntervals[1].from &&
        newVal[index].hourIntervals[1].to) {

        var fromFieldOfSecondBlock = moment(newVal[index].hourIntervals[1].from).toDate().getTime();
        var toFieldOfSecondBlock = moment(newVal[index].hourIntervals[1].to).toDate().getTime();
        if (vm.validations[index]) {
          vm.validations[index].toFieldLessThanFromFieldInSecondBlock =
            toFieldOfSecondBlock <= fromFieldOfSecondBlock;
        }

      }
    }

    function validateFromFieldWithLastFieldOfFirstBlock(newVal, index) {
      if (newVal[index].hourIntervals[0] &&
        newVal[index].hourIntervals[0].to &&
        newVal[index].hourIntervals[1] &&
        newVal[index].hourIntervals[1].from) {

        var toFieldOfFirstBlock = moment(newVal[index].hourIntervals[0].to).toDate().getTime();
        var fromFieldOfSecondBlock = moment(newVal[index].hourIntervals[1].from).toDate().getTime();
        if (vm.validations[index]) {
          vm.validations[index].fromFieldOfSecondBlockLessThanToFieldOfBlockOne =
            fromFieldOfSecondBlock <= toFieldOfFirstBlock;
        }

      }
    }

    function validateSpecialFieldRequired(newVal, index) {
      if (vm.validations[index] && newVal[index].hourIntervals[1]) {
        vm.validations[index].fromFieldOfSecondBlockIsNotRequired =
          !newVal[index].hourIntervals[1].from && newVal[index].hourIntervals[1].to;
        vm.validations[index].toFieldOfSecondBlockIsNotRequired =
          newVal[index].hourIntervals[1].from && !newVal[index].hourIntervals[1].to;
      }
    }

  }

  angular.module('neksoFeAdmindashboardApp')
    .directive('promotionsValidation', promotionsValidationFilter)
    .controller('PromotionsValidationController', promotionsValidationController);

})();
