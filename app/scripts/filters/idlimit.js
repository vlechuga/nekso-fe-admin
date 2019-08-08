'use strict';

/*
 * Return only the last 7 digits of the ID
 */

angular.module('neksoFeAdmindashboardApp')
  .filter('idlimit', function() {
    return function(val){
      if(!angular.isUndefined(val)){
        return val.substr(val.length - 7);
      }else{
        return '';
      }
    };
  });
