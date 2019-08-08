(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.directive:RideDetailCtrl
   * @description
   * # averageStarRating
   * Directive of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .directive("averageStarRating", averageStarRating);

  function averageStarRating() {
    return {
      restrict : "EA",
      template : "<div class='average-rating-container'>" +
      "  <ul class='rating background' class='readonly'>" +
      "    <li ng-repeat='star in stars' class='star'>" +
        //"      <i class='fa fa-star'></i>" + //&#9733
      "<i class='material-icons'>star_rate</i>"+
      "    </li>" +
      "  </ul>" +
      "  <ul class='rating foreground' class='readonly' style='width:{{filledInStarsContainerWidth}}%'>" +
      "    <li ng-repeat='star in stars' class='star filled'>" +
        //"      <i class='fa fa-star'></i>" + //&#9733
      "<i class='material-icons'>star_rate</i>"+
      "    </li>" +
      "  </ul>" +
      "</div>",
      scope : {
        average : "=",
      },
      link : function(scope, elem, attrs) {
        scope.max = 5;

        function updateStars() {
          scope.stars = [];
          for (var i = 0; i < scope.max; i++) {
            scope.stars.push({});
          }
          var ceil = Math.round(scope.average * 2) / 2;
          var starContainerMaxWidth = 100; //%
          var filledStarsContainer = (ceil / scope.max * starContainerMaxWidth);
          if(filledStarsContainer > 0 && filledStarsContainer < 100){
            filledStarsContainer -= 1;
          }
          scope.filledInStarsContainerWidth = filledStarsContainer;
        };
        scope.$watch("average", function(newVal) {
          if (!angular.isUndefined(newVal)) {
            updateStars();
          }
        });
      }
    };
  }
})();
