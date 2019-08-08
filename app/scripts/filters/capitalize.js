'use strict';

/*
 * Return only the last 7 digits of the ID
 */

angular.module('neksoFeAdmindashboardApp')
  .filter('capitalize', function() {
    return function(input){
      if(!angular.isUndefined(input)){
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
      }else{
        return input;
      }
    };
  });
