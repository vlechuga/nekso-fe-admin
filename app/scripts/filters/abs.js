angular.module('neksoFeAdmindashboardApp')
  .filter('abs', function() {
    return function(input){
      return Math.abs(input);
    };
  });
