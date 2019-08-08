(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:InvoiceSettingsCtrl
   * @description
   * # InvoiceSettingsCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('InvoiceSettingsCtrl', invoiceSettingsCtrl);

  function invoiceSettingsCtrl($scope, adminService, blockUI, $filter, utilService, ngToast, $timeout, $modal, $window, $location) {
    if (utilService.getUserPermissionBase('read:invoice')) {
      return true;
    }

    var vm = this;
    vm.paymentMethods = undefined;

    vm.statesArr = utilService.getUserPermissionStates() || [];
    vm.states = {};
    vm.states.country = [];
    adminService.getRoyalCountries()
      .then(function (data) {
        vm.countries = data;
      });

    vm.colors = adminService.getAllColors();

    adminService.getCars()
      .then(function (data) {
        vm.make = [];
        for (var i = 0; i < data.length; i++) {
          data[i].text = data[i].model;
          if (vm.make.indexOf(data[i].make) == -1) {
            vm.make.push(data[i].make);
          }
        }
        vm.cars = data;
      });

    adminService.getAllStates()
      .then(function (data) {
        var tmp = vm.statesArr;
        vm.statesArr = [];
        vm.states.data = data;
        if (tmp.length == 0) {
          for (var j = 0; j < data.length; j++) {
            vm.statesArr.push(data[j]);
          }
          for (var i = 0; i < vm.statesArr.length; i++) {
            if (vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country) == -1) {
              vm.states.country.push(vm.statesArr[i].country);
            }
          }
        } else {
          for (var i = 0; i < tmp.length; i++) {
            for (var j = 0; j < data.length; j++) {
              if (data[j].name == tmp[i]) {
                vm.statesArr.push(data[j]);
              }
            }
          }
          for (var i = 0; i < vm.statesArr.length; i++) {
            if (vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country) == -1) {
              vm.states.country.push(vm.statesArr[i].country);
            }
          }
        }
        vm.loadingMultiSelect = true;
      })
    vm.loadingMultiSelect = false;

    var searchFlag = false;
    vm.loading = {};
    vm.passengers = [];
    vm.tags = [];
    vm.totalPassengers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.filter = {
      searchText: '',
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
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.exportToCsv = exportToCsvFn;
    vm.showCalendar = showCalendar;

    vm.selectStates = '';
    vm.selectedMake = '';
    vm.bankAccountRequired = false;
    vm.showData = false;
    vm.selectStateDisable = true;
    vm.tagsLoaded = [];
    vm.searchCars = searchCarsFn;
    vm.addedTag = addedTagFn;
    vm.getYear = getYearFn;
    vm.selectAllTest = selectAllTestFn;
    vm.addRow = addRowFn;
    vm.merchantCommissions = [{}];
    vm.settings = [];
    vm.querySearch = querySearchFn;
    vm.editConfig = editConfigFn;
    vm.edit = false;
    vm.setEdit = setEditFn;
    vm.deleteItem = deleteItemFn;
    vm.type = '';
    vm.payment = '';

    $timeout(function () {
      getPaymentMethodsFn();
    }, 50);

    var myBlock = blockUI.instances.get('list');
    myBlock.start();
    adminService.getAllControllers(0, 0, 'name', '2015-11-02T00:00:00-04:00', '2017-04-05T23:59:59-04:00', undefined, undefined, 'Venezuela', false).then(function (response) {
      myBlock.stop();
      vm.controllers = response.data;
      getInvoiceSettings('VE');
    });

    $scope.$watch('vm.selectCountry', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.selectStateDisable = true;
        adminService.getRoyalCountriesStates(vm.selectCountry).then(function (data) {
          vm.countriesStates = data;
          vm.selectStateDisable = false;
        });
      }
    });

    $scope.$watch('vm.selectState', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        adminService.getRoyalCountriesStatesConfig(vm.selectCountry, vm.selectState).then(function (data) {
          vm.driverType = data.driverType;
          vm.driverStatus = data.driverStatus;
          vm.bankAccountRequired = data.bankAccountRequired;
          vm.from = data.carYearFrom.toString();
          vm.to = data.carYearTo.toString();
          vm.tagsLoaded = data.cars;
          vm.selectedColors = data.carColors;
          vm.showData = true;
        }, function (error) {
          vm.driverType = '';
          vm.driverStatus = '';
          vm.bankAccountRequired = false;
          vm.from = '';
          vm.to = '';
          vm.tagsLoaded = [];
          vm.selectedColors = [];
          vm.showData = true;
        });
      }
    });

    $scope.$watch('vm.filter.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        setTimeout(function () {
          $('select[multiple="multiple"]').multipleSelect("refresh");
        }, 100);
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.rating, vm.filter.emailVerified, vm.filter.state]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4]) {
        vm.controls.currentPage = 1;
        getInvoiceSettings('VE');
      }
    }, true);

    $window.onbeforeunload = function (event) {
      if (vm.edit == true) {
        return "Edit mode. if you leave without saving, any modification mode won't be updated";
      }
    }

    $scope.$on('$locationChangeStart', function (event, next, current) {
      if (vm.edit == true) {
        event.preventDefault();
        var controllerProfileModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/confirmation.modal.html',
          size: 'sm',
          controller: 'ConfirmationModalCtrl',
          controllerAs: 'confirmationModalVm',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            data: function () {
              return {
                title: "Leave without save",
                description: "Edit mode. if you leave without saving, any modification mode won't be updated",
                accept: "Leave",
                reject: "Go back"
              };
            }
          }
        });
        controllerProfileModalInstance.result.then(function (result) {
        }, function (value) {
          if (value === true) {
            vm.edit = false;
            $location.path(next.split('#')[1]);
          } else {

          }
        });
      }
    });

    function showCalendar() {
      angular.element('#calendar-input').triggerHandler('click');
    }

    function cancelFn() {
      if (vm.edit == true) {
        var controllerProfileModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/confirmation.modal.html',
          size: 'sm',
          controller: 'ConfirmationModalCtrl',
          controllerAs: 'confirmationModalVm',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            data: function () {
              return {
                title: "Leave without save",
                description: "Edit mode. if you leave without saving, any modification mode won't be updated",
                accept: "Leave",
                reject: "Go back"
              };
            }
          }
        });
        controllerProfileModalInstance.result.then(function (result) {
        }, function (value) {
          if (value === true) {
            vm.edit = false;
          } else {

          }
        });
      }
    }

    function deleteItemFn(row) {
      if (vm.edit == true) {
        var controllerProfileModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/confirmation.modal.html',
          size: 'sm',
          controller: 'ConfirmationModalCtrl',
          controllerAs: 'confirmationModalVm',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            data: function () {
              return {
                title: "Delete the adjusment",
                description: "By confirming to delete this adjustment it will stop affecting the rides immediately",
                accept: "Confirm",
                reject: "Cancel"
              };
            }
          }
        });
        controllerProfileModalInstance.result.then(function (result) {
        }, function (value) {
          if (value === true) {
            row.delete = true;
          } else {

          }
        });
      }
    }

    function searchBy(str, by, arr) {
      var tmp = '';
      for (var i = 0; i < arr.length; i++) {
        if (arr[i][by] == str) {
          tmp = arr[i];
          break;
        }
      }
      return tmp;
    }

    function getInvoiceSettings(country) {
      var myBlock = blockUI.instances.get('list');
      myBlock.start();
      adminService.getInvoiceSettings(country).then(function (response) {
        vm.merchantCommissions = response.merchantCommissions || [];
        var settings = response.settings;
        for (var i = 0; i < settings.length; i++) {
          if (settings[i].controller && settings[i].controller.userId) {
            settings[i].controller = searchBy(settings[i].controller.userId, 'id', vm.controllers);
            console.log(searchBy(settings[i].controller.userId, 'id', vm.controllers));
          }
        }
        vm.settings = settings;
        myBlock.stop();
      });
    }

    function querySearchFn(query) {
      var results = query ? vm.controllers.filter(createFilterFor(query)) : vm.controllers,
        deferred;
      return results;
    }

    function setEditFn() {
      vm.edit = vm.edit == true ? false : true;
    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(item) {
        var str = new RegExp(lowercaseQuery);
        var res = str.test(item.name.toLowerCase());
        return (res);
      };

    }

    function addedTagFn(tag) {
      console.log(tag);
    }

    function addRowFn() {
      vm.settings.push({new: true, enabled: true});
    }

    function getYearFn(tag) {
      var arr = [];
      for (var i = 1970; i <= new Date().getFullYear(); i++) {
        arr.push(i);
      }
      return arr;
    }

    function editConfigFn() {
      var obj = {}
      if (vm.merchantCommissions[0].commission == undefined || vm.merchantCommissions[0].commission == '') {
        ngToast.create({
          className: 'warning',
          content: 'Please fill platform cost. '
        });
        return true;
      }
      if (vm.merchantCommissions[0].assumedBy == undefined || vm.merchantCommissions[0].assumedBy == '') {
        ngToast.create({
          className: 'warning',
          content: 'Please user who will be charge of the platform cost. '
        });
        return true;
      }
      if (vm.settings[0].length == 0) {
        ngToast.create({
          className: 'warning',
          content: 'Please fill the adjusments. '
        });
        return true;
      }
      for (var i = 0; i < vm.settings.length; i++) {

        if (vm.settings[i].delete === true) {
          vm.settings.splice(i, 1);
          continue;
        }
        vm.settings[i].enabled == true;

        if (vm.settings[i].controller && vm.settings[i].controller.id != undefined && vm.settings[i].controller.id != '') {
          vm.settings[i].controller.userId = vm.settings[i].controller.id;
        } else {
          // vm.settings[i].controller=undefined;
        }
        if (vm.settings[i].rideType == undefined || vm.settings[i].rideType == '') {
          ngToast.create({
            className: 'warning',
            content: 'Please select type of ride. '
          });
          return true;
        }

        if (vm.settings[i].rideType == "STANDARD" && (vm.settings[i].paymentType == undefined || vm.settings[i].paymentType == '')) {
          ngToast.create({
            className: 'warning',
            content: 'Please select payment type of rides with type Standard. '
          });
          return true;
        }

        if (vm.settings[i].neksoCommission === undefined || vm.settings[i].neksoCommission === '') {
          ngToast.create({
            className: 'warning',
            content: 'Please fill nekso commission. '
          });
          return true;
        }
        if (vm.settings[i].controllerCommission === undefined || vm.settings[i].controllerCommission === '') {
          ngToast.create({
            className: 'warning',
            content: 'Please fill controller commision. '
          });
          return true;
        }
        if (vm.settings[i].commission === undefined || vm.settings[i].commission === '') {
          ngToast.create({
            className: 'warning',
            content: 'Please fill commision. '
          });
          return true;
        }
      }
      var myBlock = blockUI.instances.get('list');
      myBlock.start();
      obj.merchantCommissions = [{}];
      obj.merchantCommissions[0].commission = vm.merchantCommissions[0].commission;
      obj.merchantCommissions[0].assumedBy = vm.merchantCommissions[0].assumedBy;
      obj.settings = vm.settings;

      adminService.setInvoiceSettings('VE', obj)
        .then(function (edit) {
          ngToast.create({
            className: 'success',
            content: 'Configuration Edited!'
          });
          vm.edit = false;
          myBlock.stop();
        }, function (error) {
          if ((error.status == 401 || error.status == 403) && (error.data.code == 618)) {
            vm.notAuthMsg = error.data.description;
          } else {
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          }
          ;
        });
    }

    function selectAllTestFn() {
      var arr = [];
      for (var i = 0; i < vm.colors.length; i++) {
        arr.push(vm.colors[i].hex);
      }
      vm.selectedColors = arr;
    };

    function fromYearFn(tag) {
      console.log(tag);
    }

    function searchCarsFn(str) {
      var arr = [];
      var tmp = [];
      for (var i = 0; i < vm.cars.length; i++) {
        if (vm.cars[i].make == vm.selectedMake) {
          arr.push(vm.cars[i]);
        }
      }
      var re = new RegExp(str, 'i');
      for (var i = 0; i < arr.length; i++) {
        if (re.test(arr[i].model)) {
          tmp.push(arr[i]);
        }
      }
      return tmp;
    }

    function getUserPermissionFn(code) {
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn() {
      vm.filter.searchText = '';
      searchFlag = false;
      getInvoiceSettings('VE');
    }

    function searchDriversFn() {
      // console.log('buscando');
      if ((vm.filter.searchText.indexOf("@") > -1) && (vm.filter.searchText.indexOf(".") > vm.filter.searchText.indexOf("@"))) {
        vm.filter.searchText = '"' + vm.filter.searchText + '"';
        // console.log("you've got an email");
        // console.log(vm.filter.searchText);
      } else {
        // console.log('no hay email');
      }
      searchFlag = true;
      getInvoiceSettings('VE');
    };

    function searchDriversOnEnterFn(event) {
      if (event.keyCode == 13) {
        searchFlag = true;
        getInvoiceSettings('VE');
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getInvoiceSettings('VE');
    }

    function exportToCsvFn() {
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      return adminService.getAllPassengers(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.rating, vm.filter.emailVerified, vm.filter.searchText, undefined, undefined, undefined, vm.filter.state)
        .then(function (passengers) {
          var toExport = [];
          for (var i = 0, len = passengers.data.length; i < len; i++) {
            var passenger = passengers.data[i];
            var tmp = {};
            tmp.name = passenger.firstName + ' ' + passenger.lastName;
            tmp.email = passenger.email;
            tmp.phone = passenger.phone;
            tmp.createdDate = $filter('date')(new Date(passenger.createdDate), 'dd/MM/yyyy hh:mm a');
            tmp.completedRides = passenger.ridesCount;
            tmp.rating = passenger.rating;
            toExport.push(tmp);
          }
          vm.loading.export = false;
          return toExport;
        }, function (error) {
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
          vm.loading.export = false;
        });
    }

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
