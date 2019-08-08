(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name neksoFeAdmindashboardApp.authenticationService
   * @description
   * # authenticationService
   * Factory in the neksoFeAdmindashboardApp.
   */
  angular
    .module('neksoFeAdmindashboardApp')
    .factory('authenticationService', authenticationService);

  function authenticationService(API_BASE_PATH, store, $http, $rootScope, $q) {
    return {
      authenticate: authenticateFn,
      getAdminProfile: getAdminProfileFn,
      clearCredentials: clearCredentialsFn,
      recoverPassword: recoverPasswordFn,
      refreshToken: refreshTokenFn
    };

    function refreshTokenFn() {
      var defered = $q.defer();
      var promise = defered.promise;

      if ($rootScope.refresh_token == true) {
        defered.reject();
      } else {
        $rootScope.refresh_token = true;
        var token = JSON.parse(localStorage.admin_token).refreshToken;
        $http.get(API_BASE_PATH + 'auth/refresh?refresh_token=' + token + '&platform=WEB')
          .then(function (response) {
            $rootScope.refresh_token = false;
            if (angular.isUndefined((response))) {
              defered.reject();
            } else {
              var remember = JSON.parse(localStorage.admin_remember).user != '' ? true : false;
              var username = JSON.parse(localStorage.admin_remember).user;
              saveCredentialsFn(response.data, remember, username);
              defered.resolve(response.data);
              $rootScope.$broadcast('refresh_token', {
                refresh: true
              });
            }
          }, function (error) {
            $rootScope.refresh_token = false;
            defered.reject(error);
          });
      }
      return promise;
    }

    function authenticateFn(username, password, remember) {
      var defered = $q.defer();
      var promise = defered.promise;

      $http({
        url: API_BASE_PATH + 'auth/token?role=ADMIN&platform=WEB',
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + base64Encode(username + ':' + password)
        },
        ignoreAuthModule: true
      })
        .then(function (response) {
          if (response.status === 401) {
            defered.reject(response);
          } else if (response.status === 404) {
            defered.reject(response);
          } else {
            clearCredentialsFn();
            saveCredentialsFn(response.data, remember, username);
            defered.resolve(response.data);
          }
        }, function (error) {
          defered.reject(error);
        });
      return promise;
    }

    function getAdminProfileFn(id) {
      return $http.get(API_BASE_PATH + 'administrators/' + id);
    }

    function clearCredentialsFn() {
      $rootScope.admin_token = {};
      $http.defaults.headers.common.Authorization = undefined;
      localStorage.clear();
    }

    function recoverPasswordFn(email) {
      return $http.get(API_BASE_PATH + 'administrators/password/reset?email=' + email)
        .then(function (response) {
          return response.data;
        }, function (error) {
          return error;
        });
    }

    function saveCredentialsFn(tokenInfo, remember, username) {
      $rootScope.admin_token = tokenInfo;
      store.set('admin_token', tokenInfo);
      $http.defaults.headers.common.Authorization = tokenInfo.tokenType + ' ' + tokenInfo.authToken;
      var temp_remember = {};
      temp_remember.remember = remember;
      if (remember) {
        temp_remember.user = username;
      } else {
        temp_remember.user = '';
      }
      store.set('admin_remember', temp_remember);
    }

    function base64Encode(input) {
      var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;

      do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }

        output = output +
          keyStr.charAt(enc1) +
          keyStr.charAt(enc2) +
          keyStr.charAt(enc3) +
          keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
      } while (i < input.length);

      return output;
    }

  }
})();
