(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:RoyalSettingsCtrl
   * @description
   * # RoyalSettingsCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('RoyalSettingsCtrl', royalSettingsCtrl);

  function royalSettingsCtrl($scope, adminService, blockUI, $filter, utilService, ngToast, $timeout) {
    if (utilService.getUserPermissionBase('read:passengers')) {
      return true;
    };

    var vm = this;
    vm.statesArr = utilService.getUserPermissionStates() || [];
    vm.states={};
    vm.states.country=[];
    adminService.getRoyalCountries()
    .then(function(data){
      vm.countries = data;
    });

    vm.colors = adminService.getAllColors();

    adminService.getCars()
    .then(function(data){
      vm.make=[];
      for (var i = 0; i < data.length; i++) {
        data[i].text=data[i].model;
        if (vm.make.indexOf(data[i].make)==-1) {
          vm.make.push(data[i].make);
        }
      }
      vm.cars = data;
    });

    adminService.getAllStates()
    .then(function(data){
      var tmp=vm.statesArr;
      vm.statesArr=[];
      vm.states.data=data;
      if (tmp.length==0) {
        for (var j = 0; j < data.length; j++) {
          vm.statesArr.push(data[j]);
        }
        for (var i = 0; i < vm.statesArr.length; i++) {
          if(vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country)==-1){
            vm.states.country.push(vm.statesArr[i].country);
          }
        }
      } else {
        for (var i = 0; i < tmp.length; i++) {
          for (var j = 0; j < data.length; j++) {
            if (data[j].name==tmp[i]) {
              vm.statesArr.push(data[j]);
            }
          }
        }
        for (var i = 0; i < vm.statesArr.length; i++) {
          if(vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country)==-1){
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

    // vm.selectCountry='';
    vm.selectStates='';
    vm.selectedMake='';
    vm.bankAccountRequired=false;
    vm.showData=false;
    vm.selectStateDisable=true;
    vm.tagsLoaded=[];
    vm.searchCars = searchCarsFn;
    vm.addedTag = addedTagFn;
    vm.getYear = getYearFn;
    vm.editConfig = editConfigFn;
    vm.selectAllTest = selectAllTestFn;

    $scope.$watch('vm.selectCountry', function(newVal, oldVal){
      if(newVal !== oldVal){
        vm.selectStateDisable=true;
        adminService.getRoyalCountriesStates(vm.selectCountry).then(function(data){
          vm.countriesStates = data;
          vm.selectStateDisable = false;
        });
      }
    });

    $scope.$watch('vm.selectState', function(newVal, oldVal){
      if(newVal !== oldVal){
        adminService.getRoyalCountriesStatesConfig(vm.selectCountry, vm.selectState).then(function(data){
          vm.driverType=data.driverType;
          vm.driverStatus=data.driverStatus;
          vm.bankAccountRequired=data.bankAccountRequired;
          vm.from=data.carYearFrom.toString();
          vm.to=data.carYearTo.toString();
          vm.tagsLoaded=data.cars;
          vm.selectedColors=data.carColors;
          vm.showData=true;
        },function (error) {
          vm.driverType='';
          vm.driverStatus='';
          vm.bankAccountRequired=false;
          vm.from='';
          vm.to='';
          vm.tagsLoaded=[];
          vm.selectedColors=[];
          vm.showData=true;
        });
      }
    });

    $scope.$watch('vm.filter.country', function(newVal, oldVal){
      if(newVal !== oldVal){
        setTimeout(function(){$('select[multiple="multiple"]').multipleSelect("refresh");},100);
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.rating, vm.filter.emailVerified, vm.filter.state]', function(newVal, oldVal){
      if(newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4]){
        vm.controls.currentPage = 1;
        getPassengers();
      }
    }, true);

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }

    function addedTagFn(tag){
      console.log(tag);
    }

    function getYearFn(tag){
      var arr=[];
      for (var i = 1970; i <= new Date().getFullYear(); i++) {
        arr.push(i);
      }
      return arr;
    }

    function editConfigFn(){
      var obj= {};
      if (vm.selectState==undefined || vm.selectState=='') {
        ngToast.create({
          className: 'warning',
          content: 'Please choose State. '
        });
        return true;
      }
      if(vm.driverType==undefined || vm.driverType==''){
        ngToast.create({
          className: 'warning',
          content: 'Please choose Type of Driver. '
        });
        return true;
      }
      if (vm.driverStatus==undefined || vm.driverStatus=='') {
        ngToast.create({
          className: 'warning',
          content: 'Please choose Status. '
        });
        return true;
      }
      if (!vm.from) {
        ngToast.create({
          className: 'warning',
          content: 'Please choose Year. '
        });
        return true;
      }
      if (!vm.to) {
        ngToast.create({
          className: 'warning',
          content: 'Please choose Year. '
        });
        return true;
      }
      if (vm.from > vm.to) {
        ngToast.create({
          className: 'warning',
          content: 'FROM Year is greater than TO Year. '
        });
        return true;
      }
      if (vm.tags.length==0 && vm.tagsLoaded.length==0) {
        ngToast.create({
          className: 'warning',
          content: 'Please choose Car Model. '
        });
        return true;
      } else{
        if (vm.tags.length==0) {
          obj.cars = vm.tagsLoaded;
        } else {
          obj.cars = vm.tags;
        }
      }
      obj.driverType = vm.driverType;
      obj.driverStatus = vm.driverStatus;
      obj.bankAccountRequired = vm.bankAccountRequired;
      obj.carYearFrom = vm.from;
      obj.carYearTo = vm.to;
      obj.carColors = vm.selectedColors;

      var myBlock = blockUI.instances.get('list');
      myBlock.start();
      adminService.editRoyalCountriesStatesConfig(vm.selectCountry, vm.selectState, obj)
        .then(function(edit){
          ngToast.create({
              className: 'success',
              content: 'Configuration Edited!'
            });
          myBlock.stop();
        }, function(error){
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          };
        });
    }

    function selectAllTestFn() {
      var arr=[];
      for (var i = 0; i < vm.colors.length; i++) {
        arr.push(vm.colors[i].hex);
      }
      vm.selectedColors = arr;
    };

    function fromYearFn(tag){
      console.log(tag);
    }

    function searchCarsFn(str){
      var arr=[];
      var tmp=[];
      for (var i = 0; i < vm.cars.length; i++) {
        if(vm.cars[i].make==vm.selectedMake){
          arr.push(vm.cars[i]);
        }
      }
      var re = new RegExp(str,'i');
      for (var i = 0; i < arr.length; i++) {
        if(re.test(arr[i].model)){
          tmp.push(arr[i]);
        }
      }
      return tmp;
    }

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getPassengers();
    }

    function searchDriversFn(){
      // console.log('buscando');
        if((vm.filter.searchText.indexOf("@") > -1) && (vm.filter.searchText.indexOf(".") > vm.filter.searchText.indexOf("@"))) {
          vm.filter.searchText = '"' + vm.filter.searchText + '"';
          // console.log("you've got an email");
          // console.log(vm.filter.searchText);
        }else{
          // console.log('no hay email');
        }
      searchFlag = true;
      getPassengers();
    };

    function searchDriversOnEnterFn(event){
      if(event.keyCode == 13){
        searchFlag = true;
        getPassengers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getPassengers();
    };

    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      return adminService.getAllPassengers(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.rating, vm.filter.emailVerified, vm.filter.searchText,
        undefined, undefined, undefined, undefined, vm.filter.state, false)
        .then(function(passengers){
          var toExport = [];
          for(var i = 0, len = passengers.data.length; i < len; i++){
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
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
          vm.loading.export = false;
        });
    }

  }
})();
