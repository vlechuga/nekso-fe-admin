(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.directive:imgWithLoading
   * @description
   * # imgWithLoading
   * Directive of the neksoDashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .directive('imgWithLoading', imgWithLoading);

  function imgWithLoading() {
    return {
      restrict: 'E',
      template: '<div/>',
      transclude: false,
      replace: true,
      scope: {
        imgSrc: '@',
        imgSize: '=',
        imgVerticalSize: '=',
        imgDefault: '='
      },
      link: function(scope, element, attrs){
        var img = angular.element(new Image());
        var flag = true;

        function onLoad(evt){
          stopLoadingCSS();
        }

        function onError(evt){
          stopLoadingCSS();
          element.removeClass(attrs.spinnerClass);
          img.addClass('img-responsive');
          img.attr('src', scope.imgDefault);
        }

        var unbind1 = img.on('load', onLoad);
        var unbind2 = img.on('error', onError);

        if(attrs.imgType === 'profile'){
          img.css({
            'width': scope.imgSize + 'px',
            'height': scope.imgSize + 'px'
          });
        }else{
          element.css({
            'height': scope.imgVerticalSize + 'px'
          });
        }

        element.addClass('text-center');

        if(attrs.imgSrc){
          img.attr('src', attrs.imgSrc);
          startLoadingCSS();
        }

        element.append(img);

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
          img.css({
            visibility: 'hidden'
          });
          element.addClass(attrs.spinnerClass);
        }

        function stopLoadingCSS(){
          element.removeClass(attrs.spinnerClass);
          img.css({
            visibility: 'visible',
            'max-width': '100%',
            'max-height': '100%'
          });
          if(attrs.imgType === 'profile'){
            img.css({
              'border-radius': '50%'
            });
          }
          img.removeClass('img-responsive');
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
