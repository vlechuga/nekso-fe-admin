/**
 * Created by abarazarte on 17/02/17.
 */
(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CommChannelEditMessageCtrl
   * @description
   * # CommChannelEditMessageCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CommChannelEditMessageCtrl', commChannelEditMessageCtrlFn);

  function commChannelEditMessageCtrlFn($scope, $location, $timeout, adminService, utilService, ngToast, $routeParams, blockUI){
    var vm = this;

    $('select[multiple="multiple"]').multipleSelect("refresh");

    vm.countries = [];
    vm.countryStates = [];
    vm.selectedStates = [];
    vm.editMessage = editMessageFn;
    vm.redirectTo = redirectToFn;
    vm.isActive=true;
    var messageId = $routeParams.messageId;
    vm.wait=1;
    $scope.form={};

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

    function run(){
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

    }

    getCountriesFn();

    function getCountriesFn(){
      adminService.getCountries()
        .then(function(countries){
          vm.countries = countries;

          adminService.getCommunicationChannelMessage(messageId).then(function(message){
            message.validity.from = moment(message.validity.from).toDate();
            message.validity.to = moment(message.validity.to).toDate();
            for (var i = 0; i < message.descriptions.length; i++) {
              if(message.descriptions[i].language=='EN'){
                message.english=message.descriptions[i];
              } else if (message.descriptions[i].language=='ES'){
                message.spanish=message.descriptions[i];
              }
            }
            for (var i = 0; i < vm.countries.length; i++) {
              if(vm.countries[i].name==message.country.name){
                vm.selectedCountry = JSON.stringify(vm.countries[i]);
                break;
              }
            }

            vm.message = message;
            if (message.status=='EXPIRED') {
              vm.isActive=true;
              ngToast.create({
                className: 'warning',
                content: 'Cannot edit EXPIRED messages.'
              });
              redirectToFn('communication/channel/messages');
            } else if(message.status=='ACTIVE'){
              vm.isActive=true;
            } else {
              vm.isActive=false;
            }
            if (message.recipientsFromEmails) {
              vm.role='SELECTED';
            } else {
              vm.role=message.target;
            }

            console.log(message);

            getCountryStatesFn(JSON.parse(vm.selectedCountry).iso);


          });
        }, function(error){
          console.log(error);
        })
    }

    function refreshSavedStates(message){
      if (vm.countryStates.length==0) {
        $timeout(function() {
          refreshSavedStates(message);
        }, 100);
        return true;
      } else {
        var tmp=[];
        for (var i = 0; i < message.states.length; i++) {
          for (var j = 0; j < vm.countryStates.length; j++) {
            if(message.states[i].name==vm.countryStates[j].name){
              tmp.push(vm.countryStates[j].id);
              break;
            }
          }
        }
        run();
        $timeout(function() {
          vm.selectedStates=tmp;
          $('select[multiple="multiple"]').multipleSelect("refresh");
        }, 300);
      }
    }

    function getCountryStatesFn(countryIso){
      adminService.getStatesByCountry(countryIso)
        .then(function(states){
          vm.countryStates = states;
          if (vm.wait==1) {
            vm.wait=0;
            refreshSavedStates(vm.message);
          }
          $timeout(function() {
            $('select[multiple="multiple"]').multipleSelect("refresh");
          }, 10);
        }, function(error){
          console.log(error);
        })
    }

    function editMessageFn(){
      vm.loading  = true;
      if(vm.role === 'SELECTED' && (angular.isUndefined(vm.csvResult) || vm.csvResult.length < 1) && vm.message.emails.length < 1){
        ngToast.create({
          className: 'danger',
          content: 'Please upload your CSV file.'
        });
        vm.loading  = false;
        return;
      }

      if (!vm.message.pictureUrl) {
        if(!vm.file){
          ngToast.create({
            className: 'danger',
            content: 'Please upload image.'
          });
          vm.loading  = false;
          return;
        }
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
        tmp.target = vm.role
      }
      else if(vm.role === 'SELECTED'){
        if(angular.isDefined(vm.csvResult)){
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
            tmp.target = 'ALL'
          }
        } else {
          tmp.emails = vm.message.emails;
          tmp.target = 'ALL'
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
          for (var j = 0; j < vm.countryStates.length; j++) {
            if(state==vm.countryStates[j].id){
              tmp.states.push(vm.countryStates[j]);
              break;
            }
          }
        });
      }

      tmp.id=messageId;

      adminService.editCommunicationChannelMessage(tmp)
        .then(function(message){
          if (!vm.file) {
            ngToast.create({
              className: 'success',
              content: 'A message has been edited.'
            });
            // clearFn();
            vm.loading  = false;
            redirectToFn('communication/channel/messages');
          } else {
            adminService.uploadMessageImage(vm.file, message.id)
              .then(function(data){
                ngToast.create({
                  className: 'success',
                  content: 'A message has been edited.'
                });
                // clearFn();
                vm.loading  = false;
                redirectToFn('communication/channel/messages');
              }, function(error){
                $location.path('communication/channel/messages/' + message.id);
                ngToast.create({
                  className: 'danger',
                  content: 'Error uploading message image. Please edit the message and upload it again.'
                });
              });
            }
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

      $scope.form.new_message.field_to.$setValidity("endBeforeStart", to >= from);
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

    function redirectToFn(path){
      $location.path(path);
    }
  }
})();
