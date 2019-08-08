(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.directive:profileImg
   * @description
   * # profileImg
   * Directive of the neksoDashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .directive('profileImg', profileImg);

  function profileImg() {
    return {
      restrict: 'E',
      template: '<div/>',
      transclude: false,
      replace: true,
      scope: {
        imgSrc: '@',
        imgSize: '='
      },
      link: function(scope, element, attrs){
        var img = angular.element(new Image());
        var flag = true;

        var unbind1 = img.on('load', function(evt){
          //stopLoadingCSS();
          element.addClass('profile-img');
          element.css({
            'background-image': 'url(' + scope.imgSrc + ')'
          });
        });

        var unbind2 = img.on('error', function(evt){
          stopLoadingCSS();
          element.addClass('profile-img');
          element.css({
            'background-image': 'url("images/bg-user-profile.png")'
          });
        });

        element.addClass('text-center');
        element.css({
          'width': scope.imgSize + 'px',
          'height': scope.imgSize + 'px',
          'border-radius': '50%'
        });
        if(attrs.imgSrc){
          img.attr('src', attrs.imgSrc);
          startLoadingCSS();
        }
        //Watch for changes
        var unbind3 = scope.$watch('imgSrc', function(newVal, oldVal) {
          if(newVal === img.attr('src')) return;
          startLoadingCSS();
          setHeight();
          img.attr('src', newVal);
        });

        scope.$on('destroy', function(){
          unbind1();
          unbind2();
          unbind3();
        });

        // Local functions

        function startLoadingCSS(){
          element.addClass('profile-img-loading');
        }

        function stopLoadingCSS(){
          element.removeClass('profile-img-loading');
        }

        function setHeight(){
          var w = element.prop('offsetWidth');
          var h = attrs.heightMultiplier * w;
          if (w && h) {
            element.css('height', h + 'px');
            // if (!scope.$$phase) scope.$apply();
          } else {}
        }
      }

    };
  }
})();
