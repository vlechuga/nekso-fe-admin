/**
 * Created by abarazarte on 17/02/17.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CommChannelNewMessageCtrl
   * @description
   * # CommChannelNewMessageCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CommChannelNewMessageCtrl', commChannelNewMessageCtrlFn);

  function commChannelNewMessageCtrlFn($scope, $location, $timeout, adminService, utilService, ngToast){
    var vm = this;

    vm.countries = [];
    vm.countryStates = [];
    vm.selectedStates = [];
    vm.createMessage = createMessageFn;
    vm.back = backFn;
    vm.clear = clearFn;

    function clearFn() {
      vm.countryStates = [];
      vm.selectedStates = [];
      vm.role = undefined;
      vm.selectedCountry = undefined;
      vm.message = {
        validity: {
          from: moment().add(10, 'minutes').seconds(0).milliseconds(0).toDate(),
          to: moment().hours(23).minutes(59).seconds(59).milliseconds(0).toDate()
        },
        english: {},
        spanish: {},
        fixed: false,
        detailUrl: undefined
      };
      vm.csvResult = undefined;
      vm.file = null;
      $timeout(function() {
        $('#field_states').multipleSelect({
          placeholder: "Select States"
        });
      }, 300);
    }

    vm.message = {
      validity: {
        from: moment().add(10, 'minutes').seconds(0).milliseconds(0).toDate(),
        to: moment().hours(23).minutes(59).seconds(59).milliseconds(0).toDate()
      },
      english: {},
      spanish: {},
      fixed: false
    };
    vm.csvResult = undefined;

    $scope.$watch('vm.message.validity.from', validateStartDateFn);
    $scope.$watch('vm.message.validity.to', validateStartDateFn);

    $scope.$watch('vm.selectedCountry', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(newVal)){
          getCountryStatesFn(JSON.parse(newVal).iso);
        }
      }
    });

    $scope.$watch('vm.csvFile', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(newVal)){
          vm.csvResult = csvToJSONFn(newVal);
        }
      }
    });

    $timeout(function() {
      $('#field_states').multipleSelect({
        placeholder: "Select States"
      });
    }, 300);

    getCountriesFn();

    function getCountriesFn(){
      adminService.getCountries()
        .then(function(countries){
          vm.countries = countries;
        }, function(error){
          console.log(error);
        });
    }

    function getCountryStatesFn(countryIso){
      adminService.getStatesByCountry(countryIso)
        .then(function(states){
          vm.countryStates = states;
          setTimeout(function() {
            $('select[multiple="multiple"]').multipleSelect("refresh");
          }, 10);
        }, function(error){
          console.log(error);
        });
    }

    function createMessageFn(){
      vm.loading  = true;
      if(vm.role === 'SELECTED' && (angular.isUndefined(vm.csvResult) || vm.csvResult.length < 1)){
        ngToast.create({
          className: 'danger',
          content: 'Please upload your CSV file.'
        });
        vm.loading  = false;
        return;
      }

      if(!vm.file){
        ngToast.create({
          className: 'danger',
          content: 'Please upload image.'
        });
        vm.loading  = false;
        return;
      }

      var tmp = {
        descriptions: [],
        validity: {
          to: utilService.toStringDate(moment(vm.message.validity.to.getTime())),
          from: utilService.toStringDate(moment(vm.message.validity.from.getTime()))
        },
        pictureUrl: vm.message.pictureUrl,
        detailUrl: vm.message.detailUrl,
        fixed: vm.message.fixed,
        country: JSON.parse(vm.selectedCountry)
      };

      if(vm.role !== 'SELECTED'){
        tmp.target = vm.role;
      }
      else if(vm.role === 'SELECTED' && angular.isDefined(vm.csvResult)){
        if(vm.csvResult.length > 0){
          tmp.emails = [];
          vm.csvResult.map(function(driver){
            if(angular.isDefined(driver.email)){
              tmp.emails.push(driver.email);
            }
            else if(angular.isDefined(driver.Email)){
              tmp.emails.push(driver.Email);
            }
          });
          tmp.target = 'ALL';
        }

      }

      var enDescription = {
        language: 'EN',
        title: vm.message.english.title,
        shortDescription: vm.message.english.shortDescription,
        longDescription: vm.message.english.longDescription
      };
      var esDescription = {
        language: 'ES',
        title: vm.message.spanish.title,
        shortDescription: vm.message.spanish.shortDescription,
        longDescription: vm.message.spanish.longDescription
      };

      if(angular.isDefined(vm.message.detailUrl)){
        delete enDescription.longDescription;
        delete esDescription.longDescription;
      }

      tmp.descriptions.push(enDescription);
      tmp.descriptions.push(esDescription);

      if(vm.selectedStates.length > 0){
        tmp.states = [];

        vm.selectedStates.map(function(state){
          if(typeof state === 'string'){
            tmp.states.push(JSON.parse(state));
          }
          else{
            tmp.states.push(state);
          }
        });
      }

      adminService.createCommunicationChannelMessage(tmp)
        .then(function(message){
          adminService.uploadMessageImage(vm.file, message.id)
            .then(function(data){
              ngToast.create({
                className: 'success',
                content: 'A new message has been created.'
              });
              vm.loading  = false;
              backFn();
            }, function(error){
              $location.path('communication/channel/messages/' + message.id);
              ngToast.create({
                className: 'danger',
                content: 'Error uploading message image. Please edit the message and upload it again.'
              });
            });
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.data.description + '.'
          });
          vm.loading  = false;
        });
    }

    function validateStartDateFn() {
      var from = vm.message.validity.from.getTime();
      var to = vm.message.validity.to.getTime();

      $scope.new_message.field_to.$setValidity("endBeforeStart", to >= from);
    }

    function csvToJSONFn(content) {
      var lines = content.split(new RegExp('\n(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'));
      var result = [];
      var start = 1;
      var columnCount = lines[0].split(',').length;

      var headers = lines[0].replace(/\r/g,"").split(',');

      for (var i = start; i<lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split(new RegExp(',' + '(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'));
        if ( currentline.length === columnCount ) {
          for (var j = 0; j<headers.length; j++) {
            obj[headers[j]] = cleanCsvValueFn(currentline[j]);
          }
          result.push(obj);
        }
      }
      return result;
    }

    function cleanCsvValueFn (value) {
      return value
        .replace(/^\s*|\s*$/g,"") // remove leading & trailing space
        .replace(/^"|"$/g,"") // remove " on the beginning and end
        .replace(/\r/g,"") // remove \r carriage return
        .replace(/""/g,'"'); // replace "" with "
    }

    function backFn(){
      $location.path('communication/channel/messages');
    }
  }
})();
