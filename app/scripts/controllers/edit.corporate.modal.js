(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.corporate:EditCorporateModalCtrl
   * @description
   * # EditCorporateModalCtrl
   * Corporate of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('EditCorporateModalCtrl', editCorporateModalCtrl);

  function editCorporateModalCtrl($scope, $modalInstance, $filter, $window, ngToast, adminService, utilService, store, dataSourceTypes, dataSourceSizes, dataSourceCountries, dataSourceCountryStates, dataSourceDocuments, corporate, getUserPermission) {

    var vm = this;

    vm.modalTitle = 'Corporate profile';
    vm.loading = {};
    vm.editable = false;
    vm.new = false;
    vm.shortLocation = undefined;
    vm.types = dataSourceTypes;
    vm.sizes = dataSourceSizes;
    vm.countries = dataSourceCountries;
    vm.countryStates = dataSourceCountryStates;
    vm.dataSourceDocuments = dataSourceDocuments;
    vm.dataSourceTaxIdTaypes = [];
    vm.phone = {
      first: undefined,
      secondPhoneNumber: undefined,
      callingCode: undefined
    };
    vm.comments = null;
    vm.getUserPermission = getUserPermission;

    function init() {
      vm.corporate = corporate;
      vm.corporate.address = getlocationToStringFn(corporate);
      getShortLocation();
    }

    init();

    vm.close = closeFn;
    vm.setEditable = setEditableFn;
    vm.removeEditable = removeEditableFn;
    vm.editCorporate = editCorporateFn;
    vm.editCorporateStatus = editCorporateStatusFn;
    vm.getStatesByCountry = getStatesByCountryFn;

    function getShortLocation() {
      if (vm.corporate && vm.corporate.shortLocation) {
        vm.shortLocation = {};
        vm.shortLocation.country = utilService.searchBy(vm.corporate.shortLocation.countryCode, "iso", vm.countries);
        for (var i = 0; i < vm.countryStates.length; i++) {
          if (vm.countryStates[i].country && vm.countryStates[i].iso === vm.corporate.shortLocation.countryCode &&
            vm.countryStates[i].name && vm.countryStates[i].name === vm.corporate.shortLocation.state) {
            vm.shortLocation.state = vm.countryStates[i];
            vm.shortLocation.city = vm.corporate.shortLocation.city;
            break;
          }
        }
      }
      if (vm.shortLocation && vm.shortLocation.country) {
        vm.phone.callingCode = vm.shortLocation.country.callingCode;
        vm.phone.first = angular.copy(vm.corporate.phone.substring(vm.phone.callingCode.length));
        if (vm.corporate.secondPhoneNumber) {
          vm.phone.secondPhoneNumber = angular.copy(vm.corporate.secondPhoneNumber.substring(vm.phone.callingCode.length));
        }
      } else {
        if (vm.countries) {
          for (var i = 0; i < vm.countries.length; i++) {
            if (vm.corporate.phone.indexOf(vm.countries[i].callingCode) !== -1) {
              vm.phone.callingCode = vm.countries[i].callingCode;
              vm.phone.first = angular.copy(vm.corporate.phone.substring(vm.phone.callingCode.length));
              if (vm.corporate.secondPhoneNumber) {
                vm.phone.secondPhoneNumber = angular.copy(vm.corporate.secondPhoneNumber.substring(vm.phone.callingCode.length));
              }
              break;
            }
          }
        }
      }
    }

    function getStatesByCountryFn() {
      var array = [];
      if (vm.shortLocation && vm.shortLocation.country) {
        array = $filter('orderBy')($filter('filter')(vm.countryStates, {'iso': vm.shortLocation.country.iso}), 'name');
        vm.phone.callingCode = vm.shortLocation.country.callingCode;
      }
      return array;
    }

    $scope.$watch('vm.shortLocation.country', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        vm.corporate.taxIdType = undefined;
      }
    });

    function getlocationToStringFn(corporate) {
      var address = '';
      if (corporate && corporate.location) {
        address = corporate.location.countryName + ' - ' + corporate.location.provinceName + ' - ' +
          corporate.location.cityName + ' - ' + corporate.location.localityName + ' - ' +
          corporate.location.address + ' - ' + corporate.location.referenceAddress;
      }
      return address;
    }

    function closeFn() {
      $modalInstance.close();
    }

    function setEditableFn() {
      vm.editable = true;
    }

    function removeEditableFn() {
      vm.editable = false;
    }

    function editCorporateStatusFn(status) {
      if ((!vm.corporate.emailVerified) && (status === 'OK')) {
        ngToast.create({
          className: 'danger',
          content: 'Error Email not verified. '
        });
      } else {
        if ($window.confirm("Are you sure?")) {
          if (status === 'OK') {
            vm.corporate.status = 'OK';
          } else if (status === 'REJECTED') {
            vm.corporate.status = 'REJECTED';
          } else if (status === 'SUSPENDED') {
            vm.corporate.status = 'SUSPENDED';
          } else if (status === 'IN_REVIEW') {
            vm.corporate.status = 'IN_REVIEW';
          }
          //show_prompt();
          vm.loading.status = true;
          adminService.editCorporateStatus(store.get('admin_user').id, vm.corporate.id, vm.corporate.status, vm.comments)
            .then(function (data) {
              ngToast.create('Corporate profile updated.');
              vm.editable = false;
              $modalInstance.dismiss();
              vm.loading.status = false;
            }, function (error) {
              var msg = '';
              vm.loading.status = false;
              ngToast.create({
                className: 'danger',
                content: 'Error updating corporate. ' + msg
              });
            });
        }
      }
    }

    function editCorporateFn() {
      if ($window.confirm("Are you sure?")) {
        vm.loading.update = true;
        var corporate = {
          companyName: angular.copy(vm.corporate.companyName),
          taxIdType: angular.copy(vm.corporate.taxIdType),
          taxIdNumber: angular.copy(vm.corporate.taxIdNumber),

          countryInfo: angular.copy(vm.shortLocation.country),
          shortLocation: {
            country: angular.copy(vm.shortLocation.country.name),
            countryCode: angular.copy(vm.shortLocation.country.iso),
            state: angular.copy(vm.shortLocation.state.name),
            city: angular.copy(vm.shortLocation.city)
          },

          contactName: angular.copy(vm.corporate.contactName),
          email: angular.copy(vm.corporate.email),

          salesInfo: {
            type: angular.copy(vm.corporate.salesInfo.type),
            size: angular.copy(vm.corporate.salesInfo.size),
            transportationNeed: angular.copy(vm.corporate.salesInfo.transportationNeed),
            invoiceAddress: angular.copy(vm.corporate.salesInfo.invoiceAddress),
            fiscalAddress: angular.copy(vm.corporate.salesInfo.fiscalAddress)
          }
        };

        if (angular.isDefined(vm.phone.secondPhoneNumber) && vm.phone.secondPhoneNumber.length > 0) {
          corporate.secondPhoneNumber = angular.copy(vm.phone.callingCode + vm.phone.secondPhoneNumber);
        }
        if (angular.isDefined(vm.phone.first)) {
          corporate.phone = angular.copy(vm.phone.callingCode + vm.phone.first);
        }
        if (angular.isDefined(vm.corporate.salesInfo.documents) && vm.corporate.salesInfo.documents.length > 0) {
          corporate.salesInfo.documents = angular.copy(vm.corporate.salesInfo.documents);
        }
        // console.log(corporate);
        adminService.editCorporate(vm.corporate.id, corporate)
          .then(function (data) {
            vm.loading.update = false;
            ngToast.create('Corporate profile updated.');
            vm.editable = false;
            $modalInstance.dismiss();
          }, function (error) {
            var msg = '';
            if (error.data.code === 602) {
              msg = 'Duplicate email or phone.';
            }
            vm.loading.update = false;
            ngToast.create({
              className: 'danger',
              content: 'Error updating corporate. ' + msg
            });
          });
      }
    }

    function show_prompt() {
      var text;
      do {
        text = prompt("Agregue un comentario");
      }
      while (text.length <= 0);
      vm.comments = text;
      // console.log(text);
    }

    setTimeout(function () {
      $('#filter_documents').multipleSelect({
        placeholder: "Select documents"
      });
    }, 10);


  }
})();
