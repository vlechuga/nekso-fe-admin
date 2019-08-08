'use strict';

/**
 * @ngdoc function
 * @name neksoDashboardApp.controller:PriceSchemaCtrl
 * @description
 * # PriceSchemaCtrl
 * Controller of the neksoDashboardApp
 */

angular.module('neksoFeAdmindashboardApp')
  .controller('PriceSchemaCtrl', priceSchemaFn);

function priceSchemaFn($scope, $filter, adminService){
  var vm = this;

  var schemas;

  vm.currentSchema = undefined;

  vm.countries = [];
  vm.selectedCountry = undefined;
  vm.countrySchema = undefined;

  vm.states = [];
  vm.selectedState = undefined;
  vm.stateSchema = undefined;

  vm.controllers = [];
  vm.selectedController = undefined;
  vm.controllerSchema = undefined;

  $scope.$watch('vm.selectedCountry', function(newVal, oldVal){
    if(newVal !== oldVal){
      if(angular.isDefined(newVal)){
        vm.states = [];
        vm.selectedState = undefined;
        vm.countrySchema = undefined;
        vm.controllers = [];
        vm.selectedController = undefined;
        vm.stateSchema = undefined;
        vm.controllerSchema = undefined;
        getStatesFn(newVal);
      }
    }
  });

  $scope.$watch('vm.selectedState', function(newVal, oldVal){
    if(newVal !== oldVal){
      if(angular.isDefined(newVal)){
        vm.controllers = [];
        vm.selectedController = undefined;
        vm.stateSchema = undefined;
        vm.controllerSchema = undefined;
        getControllersFn(newVal);
      }
    }
  });

  $scope.$watch('vm.selectedController', function(newVal, oldVal){
    if(newVal !== oldVal){
      if(angular.isDefined(newVal) && newVal !== ''){
        if(typeof newVal !== 'object'){
          vm.controllerSchema = JSON.parse(newVal).pricingSchemaVariant;
          if(angular.isDefined(JSON.parse(newVal).pricingSchemaCommission)){
            vm.controllerSchema.pricingSchemaCommission = angular.copy(JSON.parse(newVal).pricingSchemaCommission);
          }
        }
        else {
          vm.controllerSchema = newVal.pricingSchemaVariant;
          if(angular.isDefined(newVal.pricingSchemaCommission)){
            vm.controllerSchema.pricingSchemaCommission = angular.copy(newVal.pricingSchemaCommission);
          }
        }
      }
    }
  });

  getPriceSchemasFn();

  function getPriceSchemasFn(){
    adminService.getPricingSchemas()
      .then(function(data){
        schemas = data;
        for(var i = 0; i < data.length; i++){
          vm.countries.push(data[i].country);
          vm.countries.sort();
        }
      })
      .catch(function(error){
        console.log(error);
      })
  }

  function getStatesFn(country){
    var countrySchema = undefined;
    for(var i = 0; i< schemas.length; i++){
      if(schemas[i].country === country){
        countrySchema = schemas[i];
        break;
      }
    }
    if(angular.isDefined(countrySchema)){
      vm.currentSchema = angular.copy(countrySchema);
      if(angular.isUndefined(vm.countrySchema)){
        vm.countrySchema = angular.copy(countrySchema);
      }
      if(angular.isDefined(countrySchema.states)){
        for(var i = 0; i < countrySchema.states.length; i++){
          vm.states.push(countrySchema.states[i].state);
          vm.states.sort();
        }
      }
    }

  }

  function getControllersFn(state){
    var countrySchema = angular.copy(vm.countrySchema);
    var stateSchema = undefined;

    for(var i = 0; i< countrySchema.states.length; i++){
      if(countrySchema.states[i].state === state){
        stateSchema = countrySchema.states[i];
        break;
      }
    }
    if(angular.isDefined(stateSchema)){
      vm.currentSchema = angular.copy(stateSchema);
      adminService.getControllers(state)
        .then(function(controllers){
          vm.controllers = $filter('orderBy')(controllers, '+name');;
        })
        .catch(function(error){
          console.log(error);
        });
    }
  }
}
