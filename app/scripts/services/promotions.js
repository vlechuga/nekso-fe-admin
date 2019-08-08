(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name neksoFeAdmindashboardApp.promotionsService
   * @description
   * # promotionsService
   * Service in the neksoFeAdmindashboardApp.
   */

  promotions.$inject = ['store', '$location'];
  function promotions(store, $location) {

    var validationBehavior = {
      repeatDay: false,
      toFieldLessThanFromFieldInFirstBlock: false,
      fromFieldOfSecondBlockLessThanToFieldOfBlockOne: false,
      toFieldLessThanFromFieldInSecondBlock: false,
      fromFieldOfSecondBlockIsNotRequired: false,
      toFieldOfSecondBlockIsNotRequired: false
    };

    var scheduleValidations = [];

    return ({
      scheduleValidations: scheduleValidations,
      existErrorsInSpecificSchedule: existErrorsInSpecificScheduleFn,
      initErrorsInSpecificSchedule: initErrorsInSpecificScheduleFn,
      addRangeForSpecificSchedule: addRangeForSpecificScheduleFn,
      removeRangeForSpecificSchedule: removeRangeForSpecificScheduleFn,
      isDuplicateScheduleCollection: isDuplicateScheduleCollectionFn,
      parseDatesBeforeSaving: parseDatesBeforeSavingFn,
      parseDatesAfterGettingFromDataBase: parseDatesAfterGettingFromDataBaseFn
    });

    function addRangeForSpecificScheduleFn(specificScheduleArray) {

      var specificScheduleModel = {
        dayOfWeek: "",
        hourIntervals: [
          {
            from: undefined,
            to: undefined
          },
          {
            from: undefined,
            to: undefined
          }
        ]
      };

      specificScheduleArray.push(Object.assign({}, specificScheduleModel));
      scheduleValidations.push(Object.assign({}, validationBehavior));
      return specificScheduleArray;
    }

    function removeRangeForSpecificScheduleFn(specificScheduleArray, index) {
      specificScheduleArray.splice(index, 1);
      scheduleValidations.splice(index, 1);
      return specificScheduleArray;
    }

    function isDuplicateScheduleCollectionFn(collection) {
      var indexOfFoundProperty = -1;

      for (var scheduleIndex in collection) {
        if (collection.hasOwnProperty(scheduleIndex)) {
          for (var scheduleIndexSecundary in collection) {
            if (collection.hasOwnProperty(scheduleIndexSecundary) && scheduleIndexSecundary !== scheduleIndex &&
              collection[scheduleIndexSecundary].dayOfWeek === collection[scheduleIndex].dayOfWeek &&
              collection[scheduleIndexSecundary].dayOfWeek !== '' && collection[scheduleIndex].dayOfWeek !== '') {
              indexOfFoundProperty = scheduleIndex;
              break;
            }
          }
        }
      }
      return indexOfFoundProperty;
    }

    function parseDatesBeforeSavingFn(schedulingArray) {
      var array = schedulingArray.slice();

      for (var scheduleIndex in array) {

        if (array.hasOwnProperty(scheduleIndex)) {
          if (array[scheduleIndex].hourIntervals[0]) {
            if (array[scheduleIndex].hourIntervals[0].from && array[scheduleIndex].hourIntervals[0].to) {
              array[scheduleIndex].hourIntervals[0].from = convertHourToMilliseconds(array[scheduleIndex].hourIntervals[0].from);
              array[scheduleIndex].hourIntervals[0].to = convertHourToMilliseconds(array[scheduleIndex].hourIntervals[0].to);
            }
          }

          if (array[scheduleIndex].hourIntervals[1]) {
            if (array[scheduleIndex].hourIntervals[1].from && array[scheduleIndex].hourIntervals[1].to) {
              array[scheduleIndex].hourIntervals[1].from = convertHourToMilliseconds(array[scheduleIndex].hourIntervals[1].from);
              array[scheduleIndex].hourIntervals[1].to = convertHourToMilliseconds(array[scheduleIndex].hourIntervals[1].to);
            }

            if (array[scheduleIndex].hourIntervals[1].from === null || array[scheduleIndex].hourIntervals[1].to === null) {
              array[scheduleIndex].hourIntervals.splice(1, 1);
            }
          }
        }

      }
      return array;
    }

    function parseDatesAfterGettingFromDataBaseFn(array) {
      var today = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
      for (var scheduleIndex in array) {
        if (array.hasOwnProperty(scheduleIndex)) {
          if (array[scheduleIndex].hourIntervals[0]) {
            array[scheduleIndex].hourIntervals[0].from = moment(today + array[scheduleIndex].hourIntervals[0].from).toDate();
            array[scheduleIndex].hourIntervals[0].to = moment(today + array[scheduleIndex].hourIntervals[0].to).toDate();
          }
          if (array[scheduleIndex].hourIntervals[1]) {
            array[scheduleIndex].hourIntervals[1].from = moment(today + array[scheduleIndex].hourIntervals[1].from).toDate();
            array[scheduleIndex].hourIntervals[1].to = moment(today + array[scheduleIndex].hourIntervals[1].to).toDate();
          }
        }
      }
      return array;
    }

    function existErrorsInSpecificScheduleFn(isSpecificScheduleChecked) {
      var status = false;
      if (isSpecificScheduleChecked) {
        for (var index in scheduleValidations) {
          for (var key in scheduleValidations[index]) {
            if (scheduleValidations[index].hasOwnProperty(key) &&
              scheduleValidations[index][key]) {
              status = true;
              break;
            }
          }
        }
      }
      return status;
    }

    function initErrorsInSpecificScheduleFn(scheduleCollection) {
      for (var index in scheduleCollection) {
        scheduleValidations.push(Object.assign({}, validationBehavior));
      }
    }

    function convertHourToMilliseconds(input) {
      var date = moment(input);
      return ((date.hour() * 60) + date.minute()) * 60000;
    }

  }

  angular
    .module('neksoFeAdmindashboardApp')
    .service('promotionsService', promotions);

})();
