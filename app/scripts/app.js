(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @name neksoFeAdmindashboardApp
   * @description
   * # neksoFeAdmindashboardApp
   *
   * Main module of the application.
   */

  function configuration($routeProvider, $httpProvider, blockUIConfig, ngToast, storeProvider) {

    getHomeFn($routeProvider);

    $routeProvider
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'vm'
      })
      .when('/overview', {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl',
        controllerAs: 'homeVm'
      })
      .when('/drivers', {
        templateUrl: 'views/drivers.html',
        controller: 'DriversCtrl',
        controllerAs: 'vm'
      })
      .when('/passengers', {
        templateUrl: 'views/passengers.html',
        controller: 'PassengersCtrl',
        controllerAs: 'vm'
      })
      .when('/rides', {
        templateUrl: 'views/rides.html',
        controller: 'RidesCtrl',
        controllerAs: 'vm'
      })
      .when('/reports', {
        templateUrl: 'views/reports.html',
        controller: 'ReportsCtrl',
        controllerAs: 'vm'
      })
      .when('/controllers', {
        templateUrl: 'views/controllers.html',
        controller: 'ControllersCtrl',
        controllerAs: 'vm'
      })
      .when('/monitor', {
        templateUrl: 'views/ride.monitor.html',
        controller: 'RideMonitorCtrl',
        controllerAs: 'vm'
      })
      .when('/live', {
        templateUrl: 'views/live_rides.html',
        controller: 'LiveRidesCtrl',
        controllerAs: 'vm'
      })
      .when('/sos', {
        templateUrl: 'views/sos.html',
        controller: 'SosCtrl',
        controllerAs: 'vm'
      })
      .when('/notifications', {
        templateUrl: 'views/notifications.html',
        controller: 'NotificationsCtrl',
        controllerAs: 'vm'
      })
      .when('/validation_code', {
        templateUrl: 'views/phone_code.html',
        controller: 'PhoneCodeCtrl',
        controllerAs: 'vm'
      })
      .when('/administration', {
        templateUrl: 'views/permissions.html',
        controller: 'PermissionsCtrl',
        controllerAs: 'vm'
      })
      .when('/corporate', {
        templateUrl: 'views/corporate.html',
        controller: 'CorporateCtrl',
        controllerAs: 'vm'
      })
      .when('/corporate/sales_package', {
        templateUrl: 'views/corporate_sales_package.html',
        controller: 'CorporateSalesPackageCtrl',
        controllerAs: 'vm'
      })
      .when('/club_nekso/drivers', {
        templateUrl: 'views/clubdrivers.html',
        controller: 'ClubDriversCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/passengers', {
        templateUrl: 'views/commpassengers.html',
        controller: 'CommPassengersCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/drivers', {
        templateUrl: 'views/commdrivers.html',
        controller: 'CommDriversCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/drivers/digital', {
        templateUrl: 'views/digital-drivers.html',
        controller: 'DigitalDriversCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/statistics', {
        templateUrl: 'views/commstatistics.html',
        controller: 'CommStatisticsCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/visitors', {
        templateUrl: 'views/commvisitors.html',
        controller: 'CommVisitorsCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/channel/messages', {
        templateUrl: 'views/communication_channel.html',
        controller: 'CommunicationChannelCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/channel/messages/new', {
        templateUrl: 'views/communication_channel_new.html',
        controller: 'CommChannelNewMessageCtrl',
        controllerAs: 'vm'
      })
      .when('/communication/channel/messages/:messageId', {
        templateUrl: 'views/communication_channel_edit.html',
        controller: 'CommChannelEditMessageCtrl',
        controllerAs: 'vm'
      })
      .when('/promotions', {
        templateUrl: 'views/promotions.html',
        controller: 'PromotionsCtrl',
        controllerAs: 'vm'
      })
      .when('/promotions/new', {
        templateUrl: 'views/promotions_new_v2.html',
        controller: 'NewPromotionCtrl',
        controllerAs: 'vm'
      })
      .when('/promotions/corporate', {
        templateUrl: 'views/corporates_promotions.html',
        controller: 'CorporatesPromotionsCtrl',
        controllerAs: 'vm'
      })
      .when('/promotions/:promotionId', {
        templateUrl: 'views/promotions_edit_v2.html',
        controller: 'EditPromotionCtrl',
        controllerAs: 'vm'
      })
      .when('/promotions/:promotionId/copy', {
        templateUrl: 'views/promotions_copy_v2.html',
        controller: 'CopyPromotionCtrl',
        controllerAs: 'vm'
      })
      .when('/price_calculator', {
        templateUrl: 'views/price_calculator.html',
        controller: 'PriceCalculatorCtrl',
        controllerAs: 'vm'
      })
      .when('/royal', {
        templateUrl: 'views/royal.html',
        controller: 'RoyalCtrl',
        controllerAs: 'vm'
      })
      .when('/royal_settings', {
        templateUrl: 'views/royal_settings.html',
        controller: 'RoyalSettingsCtrl',
        controllerAs: 'vm'
      })
      .when('/invoice_report', {
        templateUrl: 'views/invoice_report.html',
        controller: 'InvoiceReportCtrl',
        controllerAs: 'vm'
      })
      .when('/invoice_settings', {
        templateUrl: 'views/invoice_settings.html',
        controller: 'InvoiceSettingsCtrl',
        controllerAs: 'vm'
      })
      .when('/price_schema', {
        templateUrl: 'views/price_schema.html',
        controller: 'PriceSchemaCtrl',
        controllerAs: 'vm'
      })
      .when('/payments/corporate', {
        templateUrl: 'views/payments_corporate.html',
        controller: 'PaymentsCorporateCtrl',
        controllerAs: 'vm'
      })
      .when('/payments/driver', {
        templateUrl: 'views/payments_driver.html',
        controller: 'PaymentsDriverCtrl',
        controllerAs: 'vm'
      })
      .when('/payments/driver/detail/:paymentId/:driverId', {
        templateUrl: 'views/payments_driver_history.html',
        controller: 'PaymentDriverHistoryCtrl',
        controllerAs: 'vm'
      })
      .when('/payments/passenger/bank-transfer', {
        templateUrl: 'views/passengers_bank_transfer.html',
        controller: 'PassengersBankTransferCtrl',
        controllerAs: 'vm'
      })
      .when('/payments/passenger/recharge-balance', {
        templateUrl: 'views/passengers_recharge_balance.html',
        controller: 'PassengersRechargeBalanceCtrl',
        controllerAs: 'vm'
      })
      .when('/payments/driver/bank-transfer', {
        templateUrl: 'views/drivers_bank_transfer.html',
        controller: 'DriversBankTransferCtrl',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/'
      });

    $httpProvider.interceptors.push(function ($q, $injector, $timeout, store, $location, ngToast) {
      return {
        request: function (request) {
          return request;
        },
        responseError: function (rejection) {
          var authenticationService = $injector.get('authenticationService');
          var authService = $injector.get('authService');
          if (rejection.status === 401) {
            //access level not authorized
            if (rejection.data.code === 638) {
              ngToast.create({
                className: 'danger',
                content: 'UNAUTHORIZED OPERATION'
              });
              return;
            }
            if (rejection.data.code !== 619 && rejection.data.code !== 630) {
              if (rejection.config.url.indexOf('/auth/refresh?refresh_token=') === -1) {
                if (angular.isDefined(localStorage.admin_token)) {
                  authenticationService.refreshToken()
                    .then(function (response) {
                      var token = response.tokenType + ' ' + response.authToken;
                      authService.loginConfirmed('success', function (config) {
                        config.headers.Authorization = token;
                        return config;
                      });
                    }, function (error) {
                      goLoginFn(authService, $timeout, $location);
                      return rejection;
                    });
                } else {
                  goLoginFn(authService, $timeout, $location);
                  return rejection;
                }
              } else {
                goLoginFn(authService, $timeout, $location);
                return rejection;
              }
            } else if (rejection.data.code === 630) {
              goLoginFn(authService, $timeout, $location);
              return;
            }
          }
          if (rejection.status === 503) {
            goLoginFn(authService, $timeout, $location);
          }

          return $q.reject(rejection);
        }
      };
    });

    ngToast.configure({
      horizontalPosition: 'right',
      animation: 'slide',
      maxNumber: 4
    });

    //Default overlay message
    blockUIConfig.message = 'Loading data...';
    blockUIConfig.delay = 100;
    blockUIConfig.autoBlock = false;

    storeProvider.setCaching(false);
  }

  configuration.$inject = ['$routeProvider', '$httpProvider', 'blockUIConfig', 'ngToastProvider', 'storeProvider'];

  function runBlock123($rootScope, $modalStack) {
    $rootScope.$on('$locationChangeStart', function () {
      $modalStack.dismissAll();
    });
  }

  runBlock123.$inject = ['$rootScope', '$modalStack'];

  function runBlock($rootScope, $location, store, $http, authenticationService, $timeout) {
    var token = store.get('admin_token') || {};
    if (angular.isDefined(token.userId)) {
      $http.defaults.headers.common.Authorization = token.tokenType + ' ' + token.authToken;
    }

    $rootScope.$on('$locationChangeStart', function () {

      var restrictedPage = $location.path() === '/login';
      var authenticated;
      if (store.get('admin_user')) {
        if (store.get('admin_user').authenticated) {
          authenticated = true;
          authenticationService.getAdminProfile(store.get('admin_token').userId);
        }
      }
      if (!restrictedPage && !authenticated) {
        authenticationService.clearCredentials();
        $timeout(function () {
          $location.path('/login');
        }, 100);
      }
    });
  }

  runBlock.$inject = ['$rootScope', '$location', 'store', '$http', 'authenticationService', '$timeout'];

  function getHomeFn($routeProvider) {
    var hasHome;
    if (localStorage && localStorage.admin_user &&
      JSON.parse(localStorage.admin_user).accessLevel &&
      JSON.parse(localStorage.admin_user).accessLevel.length > 0) {

      var accessLevel = JSON.parse(localStorage.admin_user).accessLevel;
      for (var i = 0; i < accessLevel.length; i++) {
        if (accessLevel[i].code.split(':')[0] === 'read') {
          if (accessLevel[i].code.split(':')[1].indexOf('_') === -1) {
            hasHome = '/' + accessLevel[i].code.split(':')[1];
            break;
          }
        }
      }
    }

    if (angular.isDefined(hasHome)) {
      $routeProvider
        .when('/', {
          redirectTo: hasHome
        });
    }
  }

  function goLoginFn(authService, $timeout, $location) {
    authService.loginCancelled();
    localStorage.clear();
    $timeout(function () {
      $location.path('/login');
    }, 100);
  }

  angular.module('neksoFeAdmindashboardApp', [
    'ngAnimate',
    'ngAria',
    'ngMaterial',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'config',
    'ui.bootstrap',
    'chart.js',
    'ngCsv',
    'angular-storage',
    'ngToast',
    'blockUI',
    'angular-ladda',
    'angular.filter',
    'daterangepicker',
    'mwl.confirm',
    'ngFileUpload',
    'http-auth-interceptor',
    'checklist-model',
    'ngTagsInput'
  ])
    .config(configuration)
    .run(runBlock)
    .run(runBlock123)
    .constant('_', window._);
})();
