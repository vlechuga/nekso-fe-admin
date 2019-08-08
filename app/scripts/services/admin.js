(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name neksoDashboardApp.controller.admin
   * @description
   * # admin.service
   * Factory in the neksoDashboardApp.
   */

  function adminService(API_BASE_PATH, GOOGLE_API_KEY, GOOGLE_API_SERVER_KEY, AMAZONAWS_API_KEY, AMAZONAWS_API_URL, $http, store, $q) {
    var ADMIN_BASE_PATH = API_BASE_PATH + 'admin/';
    var ADMIN_REPORTS_BASE_PATH = API_BASE_PATH + 'admin/reports/';
    var ADMIN_PASSENGER_BASE_PATH = API_BASE_PATH + 'admin/passengers/';
    var ADMIN_DRIVER_BASE_PATH = API_BASE_PATH + 'admin/drivers/';
    var DRIVER_BASE_PATH = API_BASE_PATH + 'drivers/';
    var UTILITIES_BASE_PATH = API_BASE_PATH + 'utilities/';
    var CONTROLLERS_BASE_PATH = API_BASE_PATH + 'controllers/';
    var CORPORATE_BASE_PATH = ADMIN_BASE_PATH + 'corporate/';

    function editAdministratorFn(id, administrator) {
      return $http.put(API_BASE_PATH + 'administrators/' + id, administrator)
        .then(handleSuccess, handleError('Error editing administrator user'));
    }

    function getGooglePolylineFn(pickup, destination){
      var url = AMAZONAWS_API_URL + 'gmaps/directions?destination='+destination + '&origin='+pickup;
      var config = {
        headers: {
          'x-api-key': AMAZONAWS_API_KEY
        }
      };
      return $http.get(url, config)
        .then(handleSuccess, handleError('Error in getGooglePolylineFn'));
    }

    function getGoogleStaticMapFn(pickup, destination){
      return getGooglePolylineFn(pickup, destination).then(function (data) {
        var url = "https://maps.googleapis.com/maps/api/staticmap?size=800x600&markers=color:green|label:A|"+pickup+"&markers=color:red|label:B|"+destination+"&path=weight:4%7Ccolor:0x0000ff%7Cenc:"+data.polyline+"&key="+GOOGLE_API_KEY;
        return url;
      });
    }

    function getStatesBoundsFn(state, country) {
      return $http({
        method: 'GET',
        url: 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&key=' + GOOGLE_API_SERVER_KEY + '&address=' + state + '&components=country:' + country,
        headers: {
          'Authorization': undefined
        }
      })
        .then(handleSuccess, handleError('Error getting states bounds'));
    }

    function getSupportCategoriesFn() {
      return $http.get(ADMIN_BASE_PATH + 'support/categories', {
        cache: true
      }).then(handleSuccess, handleError('Error getting categories'));
    }

    function getStopUsingReasonsFn() {
      return $http.get(API_BASE_PATH + 'drivers/stop_using_reasons',  {
        cache: true
      }).then(handleSuccess, handleError('Error getting Reasons'));
    }

    function getCouponsFn(limit, skip, order, search, status, country, states) {
      var url = API_BASE_PATH + 'promotions/coupons?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(search)) {
        url += 'search=' + search + '&';
      }
      if (!angular.isUndefined(status) && status !== '') {
        url += 'status=' + status + '&';
      }
      if (!angular.isUndefined(country) && country !== '') {
        url += 'country=' + country.iso + '&';
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting coupons'));
    }

    function getAdministratorsFn(limit, skip, order, status, search, states) {
      var url = API_BASE_PATH + 'administrators?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(status)) {
        if (status === 'ALL' || status === '') {

        } else {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i] + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting administrators'));
    }

    function getAccessRolesFn() {
      return $http.get(API_BASE_PATH + 'administrators/accessLevel', {
        cache: true
      }).then(handleSuccess, handleError('Error getting administrators'));
    }

    function getAllStatesFn() {
      return $http.get(API_BASE_PATH + 'admin/states', {
        cache: true
      }).then(handleSuccessForStates, handleError('Error getting administrators'));
    }

    function createControllerFn(controller) {
      return $http.post(API_BASE_PATH + 'controllers', controller)
        .then(handleSuccess, handleError('Error creating new controller'));
    }

    function createAdministratorFn(user) {
      return $http.post(API_BASE_PATH + 'administrators', user)
        .then(handleSuccess, handleError('Error creating new controller'));
    }

    function editControllerFn(id, controller) {
      return $http.put(API_BASE_PATH + 'controllers/' + id, controller)
        .then(handleSuccess, handleError('Error editing controller profile'));
    }

    function getAllControllersFn(limit, skip, order, from, to, search, states, countryName, exportToCsv) {
      var url = ADMIN_BASE_PATH + 'controllers?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      if (!angular.isUndefined(countryName)) {
        url += 'country=' + countryName + '&';
      }
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      url += '_access_role=ADMIN&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true';
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting controllers'));
    }

    function updateAwardsFn(id, str) {
      var url = API_BASE_PATH + 'promotions/' + id + '/award_description?description=' + str;
      return $http.put(url)
        .then(handleSuccess, handleError('Error getting updating Club Nekso oil field'));
    }

    function redeemClubNeksoFn(id, userId, code) {
      var url = API_BASE_PATH + 'promotions/' + id + '/claim_award?user_id=' + userId + '&code=' + code;
      return $http.put(url)
        .then(handleSuccess, handleError('Error getting Validating Club Nekso redeem code'));
    }

    function getClubNeksoRolesFn(role) {
      var url = API_BASE_PATH + 'achievements?';
      if (!angular.isUndefined(role)) {
        url += 'role=' + role + '&';
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Club Nekso Roles'));
    }

    function getClubNeksoUsersCSVFn(limit, skip, order, from, to, search, country, states, badge, status, role, car_make, car_model) {
      var url = API_BASE_PATH + 'achievements/drivers/csv?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(country)) {
        url += 'country=' + country.iso + '&';
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'state_id=' + states[i].id + '&';
          }
        }
      }
      if (!angular.isUndefined(status) && status !== 'ALL') {
        if (status !== '') {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(car_make) && car_make !== 'ALL') {
        if (car_make !== '') {
          url += 'car_make=' + car_make + '&';
        }
      }
      if (!angular.isUndefined(car_model) && car_model !== 'ALL') {
        if (car_model !== '') {
          url += 'car_model=' + car_model + '&';
        }
      }
      if (!angular.isUndefined(badge) && badge !== 'ALL') {
        if (badge !== '') {
          url += 'achievement=' + badge + '&';
        }
      }

      if (!angular.isUndefined(role)) {
        url += 'role=' + role + '&';
      }
      url += '_access_token=' + store.get('admin_token').refreshToken;

      return url;
    }

    function getClubNeksoUsersFn(limit, skip, order, from, to, search, country, states, make, model, badge, status, role) {
      var url = API_BASE_PATH + 'achievements/drivers?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }

      if (!angular.isUndefined(country)) {
        url += 'country=' + country.iso + '&';
      }

      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'state_id=' + states[i].id + '&';
          }
        }
      }

      if (!angular.isUndefined(make)) {
        url += 'car_make=' + make + '&';
      }

      if (!angular.isUndefined(model)) {
        url += 'car_model=' + model + '&';
      }

      if (!angular.isUndefined(status) && status !== 'ALL') {
        if (status !== '') {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(badge) && badge !== 'ALL') {
        if (badge !== '') {
          url += 'achievement=' + badge + '&';
        }
      }
      // if(!angular.isUndefined(achievements) && achievements.length !=0){
      //   for (var i = 0; i < achievements.length; i++) {
      //     url += 'achievement=' + achievements[i] + '&';
      //   }
      // }
      if (!angular.isUndefined(role)) {
        url += 'role=' + role + '&';
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Club Nekso users'));
    }

    function getAchievementHistoryByDriverIdFn(driverId, limit, skip) {
      var url = API_BASE_PATH + 'achievements/drivers/' + driverId + '?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Club Nekso users'));
    }

    function getClubNeksoFn(limit, skip, order, from, to, search, states, badge, status, role) {
      var url = API_BASE_PATH + 'achievements/history/awards?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i] + '&';
          }
        }
      }
      if (!angular.isUndefined(status) && status !== 'ALL') {
        if (status !== '') {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(badge) && badge !== 'ALL') {
        if (badge !== '') {
          url += 'achievement=' + badge + '&';
        }
      }

      if (!angular.isUndefined(role)) {
        url += 'role=' + role + '&';
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Club Nekso'));
    }

    function getRoyalDriversFn(limit, skip, order, from, to, royal_status, country, states, notification, search, exportToCsv) {
      var url = ADMIN_BASE_PATH + 'royal/drivers?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(royal_status) && royal_status !== 'ALL') {
        url += 'royal_status=' + royal_status + '&';
      }

      if (!angular.isUndefined(country)) {
        url += 'country=' + country + '&';
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      if (!angular.isUndefined(notification) && notification !== 'ALL') {
        url += 'notification=' + notification + '&';
      }
      if (!angular.isUndefined(search) && search !== '') {
        url += 'search=' + search + '&';
      }
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv;
        return url;
      }
      return $http.get(url).then(handleSuccess, handleError('Error getting royal drivers'));
    }

    function getAllDriversFn(limit, skip, order, from, to, rate, status, controller, verified, search, tag, action, rides, states, filterByBankAccount, exportToCsv, type) {
      var url = ADMIN_BASE_PATH + 'drivers?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (filterByBankAccount) {
        if (!angular.isUndefined(from)) {
          url += 'bank_account_updated_at_from=' + from + '&';
        }
        if (!angular.isUndefined(to)) {
          url += 'bank_account_updated_at_to=' + to + '&';
        }
      } else {
        if (!angular.isUndefined(from)) {
          url += 'from=' + from + '&';
        }
        if (!angular.isUndefined(to)) {
          url += 'to=' + to + '&';
        }
      }
      if (!angular.isUndefined(rate)) {
        if (rate !== '') {
          url += 'rate=' + rate + '&';
        }
      }
      if (!angular.isUndefined(status)) {
        if (typeof status === 'string') {
          if (status !== 'ALL' && status !== '') {
            url += 'status=' + status + '&';
          }
        }
        else {
          status.map(function (_status) {
            url += 'status=' + _status + '&';
          });
        }
      }
      if (!angular.isUndefined(controller)) {
        // console.log(typeof controller);
        if (typeof controller === 'string') {
          if (controller !== '' && controller !== 'ALL') {
            url += 'controller=' + controller + '&';
          }
        }
        else {
          for (var i = 0; i < controller.length; i++) {
            url += 'controller=' + controller[i] + '&';
          }
        }

      }
      if (!angular.isUndefined(verified)) {
        if (verified !== '' && verified !== 'ALL') {
          url += 'verified=' + verified + '&';
        }
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(tag)) {
        if (tag === 'ALL') {
          tag = '';
        }
        url += 'tag=' + tag + '&';
      }
      if (!angular.isUndefined(type)) {
        if (type === 'ALL') {
          type = '';
        }
        url += 'type=' + type + '&';
      }
      if (!angular.isUndefined(action)) {
        if (action === 'ALL') {
          action = '';
        }
        url += 'action=' + action + '&';
      }
      if (!angular.isUndefined(rides)) {
        if (rides === null) {
          rides = '';
        }
        url += 'rides=' + rides + '&';
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var j = 0; j < states.length; j++) {
          url += 'states=' + states[j].name + '&';
        }
      }
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv;
        return url;
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting drivers'));
    }

    function getTagDriversFn(tag) {
      var url = ADMIN_BASE_PATH + 'drivers?status=OK';
      if (!angular.isUndefined(tag)) {
        if (tag === null) {
          tag = '';
        }
        url += '&tag=' + tag + '&';
      }
      url += '_access_token=' + store.get('admin_token').refreshToken;
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting drivers'));
    }

    function getSosNotificationsFn(limit, skip, order, from, to, type, status, controller, search, country, states) {
      var url = ADMIN_BASE_PATH + 'sos?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(type)) {
        if (type === 'ALL' || type === '') {

        } else {
          url += 'type=' + type + '&';
        }
      }
      if (!angular.isUndefined(status)) {
        if (status === 'ALL' || status === '') {

        } else {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(controller)) {
        if (controller !== '' && controller !== 'ALL') {
          url += 'controller=' + controller + '&';
        }
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(country)) {
        url += 'country=' + country.iso + '&';
      }
      if (angular.isDefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting SOS notifications'));
    }

    function getNotificationsFn(limit, skip, order, from, to, type, status, controller, search) {
      var url = ADMIN_BASE_PATH + 'notifications?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(type)) {
        if (type === 'ALL' || type === '') {

        } else {
          url += 'type=' + type + '&';
        }
      }
      if (!angular.isUndefined(status)) {
        if (status === 'ALL' || status === '') {

        } else {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(controller)) {
        if (controller !== '' && controller !== 'ALL') {
          url += 'controller=' + controller + '&';
        }
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting notifications'));
    }

    function getCountsFn(states) {
      var url = ADMIN_BASE_PATH + 'counts?';
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting counts'));
    }

    function editSosNotificationStatusFn(id, value) {
      var url = ADMIN_BASE_PATH + 'inbox/' + id + '?';
      url += 'status=OK&';
      if (!angular.isUndefined(value)) {
        url += 'userContacted=' + value + '&';
      }
      return $http.put(url)
        .then(handleSuccess, handleError('Error updating sos notification'));
    }

    function getDriversCountsFn(states) {
      var url = ADMIN_BASE_PATH + 'drivers/counts?';
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i] + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting counts'));
    }

    function getAllDriversCountFn() {
      return $http.get(ADMIN_BASE_PATH + 'drivers?count=true')
        .then(handleSuccess, handleError('Error getting drivers count'));
    }

    function getDriversCountByStatusFn(status) {
      return $http.get(ADMIN_BASE_PATH + 'drivers?count=true&status=' + status)
        .then(handleSuccess, handleError('Error getting drivers count by status'));
    }

    function getAllPassengersFn(limit, skip, order, from, to, rate, verified, search, tag, action, rides, states, status, exportToCsv) {
      var url = ADMIN_BASE_PATH + 'passengers?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(rate)) {
        if (rate !== '') {
          url += 'rate=' + rate + '&';
        }
      }
      if (!angular.isUndefined(verified)) {
        if (verified !== '' && verified !== 'ALL') {
          url += 'verified=' + verified + '&';
        }
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(tag)) {
        if (tag === 'ALL') {
          tag = '';
        }
        url += 'tag=' + tag + '&';
      }
      if (!angular.isUndefined(action)) {
        if (action === 'ALL') {
          action = '';
        }
        url += 'action=' + action + '&';
      }
      if (!angular.isUndefined(rides)) {
        if (rides === null) {
          rides = '';
        }
        url += 'rides=' + rides + '&';
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      if (angular.isDefined(status) && status !== 'ALL') {
        url += 'status=' + status + '&';
      }
      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv + '&';
        return url;
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting passengers'));
    }

    function getAllPassengersCountFn() {
      return $http.get(ADMIN_BASE_PATH + 'passengers?count=true')
        .then(handleSuccess, handleError('Error getting drivers count'));
    }

    function getAllBankTransferFn(limit, skip, order, from, to, status, bank, search, role, sources, exportToCsv) {
      var url = ADMIN_BASE_PATH + 'recharge-balance?role=' + role + '&';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(bank)) {
        if (bank !== '') {
          url += 'toBank=' + bank + '&';
        }
      }
      if (!angular.isUndefined(status)) {
        if (status !== '') {
          url += 'status=' + status + '&';
        }
      }

      if (angular.isUndefined(sources) || sources === 'ALL' || sources === '') {
          url += 'source=MPANDCO&source=MULTIPAGO_BANESCO&';
      } else {
          url += 'source=' + sources + '&';
      }
      if (!angular.isUndefined(search)) {
        url += 'search=' + search + '&';
      }

      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv;
        return url;
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting passengers'));
    }

    function putBankTransferChangeStatusFn(id, status, comment) {
      var url = ADMIN_BASE_PATH + 'recharge-balance/' + id + '/status/';
      var tmp = $.param({
        status: status,
        comment: comment
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      };
      return $http.put(url, tmp, config)
        .then(handleSuccess, handleError('Error in putBankTransferChangeStatusFn'));
    }

    function conciliationBankTransferByCSVFn(bank, csv) {
      var url = ADMIN_BASE_PATH + 'recharge-balance/csv?bank=' + bank;
      var fd = new FormData();
      fd.append('csv', csv);
      return $http({
        url: url,
        data: fd,
        method: 'POST',
        headers: {'Content-Type': undefined}
      })
        .then(handleSuccess, handleError('Error uploading bank transfer csv file'));
    }

    function cashBoxBankTransferFn(from, to) {
      var url = ADMIN_BASE_PATH + 'recharge-balance/box?';

      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      url += '_access_token=' + store.get('admin_token').refreshToken;
      return url;
    }

    function getSupportedBanksForBankTransfersFn(iso, role) {
      return $http.get(UTILITIES_BASE_PATH + 'supported-banks-for-bank-transfer/' + iso + '?role=' + role, {
        cache: true
      }).then(handleSuccess, handleSuccess('Error getting banks for bank transfer list'));
    }

    function createPaymentFn(passengerId, source, amount, comment) {
        var url = ADMIN_BASE_PATH + 'recharge-balance/add';
        var tmp = $.param({
          id: passengerId,
          source: source,
          amount: amount,
          comment: comment
        });
        var config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
          }
        };
        return $http.post(url, tmp, config)
          .then(handleSuccess, handleError('Error in createPaymentFn'));
    }

    function getAllRidesFn(limit, skip, order, from, to, status, controller, search, is_corporate, tag, payment_type, paid_through_nekso_account, states, exportToCsv, only_points, source, promotionCategory, corporate_id) {
      var url = ADMIN_BASE_PATH + 'rides?';
      var updatedBy = '';

      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      if (angular.isDefined(status)) {
        if (typeof status === 'string') {
          if (status === 'ALL' || status === '') {

          }
          else if (status === 'CANCELLED_BY_PASSENGER' || status === 'CANCELLED_BY_DRIVER' || status === 'CANCELLED_BY_SYSTEM') {
            url += 'status=CANCELLED&';
            updatedBy = 'DRIVER';
            if (status === 'CANCELLED_BY_PASSENGER') {
              updatedBy = 'PASSENGER';
            } else if (status === 'CANCELLED_BY_SYSTEM') {
              updatedBy = 'SYSTEM';
            }
            url += 'updated_by=' + updatedBy + '&';
          }
          else if (status === 'CLOSED_BY_PASSENGER' || status === 'CLOSED_BY_SYSTEM') {
            url += 'status=CLOSED&';
            updatedBy = 'DRIVER';
            if (status === 'CLOSED_BY_PASSENGER') {
              updatedBy = 'PASSENGER';
            } else if (status === 'CLOSED_BY_SYSTEM') {
              updatedBy = 'SYSTEM';
            }
            url += 'updated_by=' + updatedBy + '&';
          }
          else {
            url += 'status=' + status + '&';
          }
        }
        else {
          if (status.length === 12) {
            ['CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM', 'CLOSED_BY_PASSENGER', 'CLOSED_BY_SYSTEM'].map(function (s) {
              var index = status.indexOf(s);
              if (index > -1) {
                status.splice(index, 1);
              }
            });
          }
          status.map(function (_status) {
            if (_status === 'CANCELLED_BY_PASSENGER' || _status === 'CANCELLED_BY_DRIVER' || _status === 'CANCELLED_BY_SYSTEM') {
              url += 'status=CANCELLED&';
              updatedBy = 'DRIVER';
              if (_status === 'CANCELLED_BY_PASSENGER') {
                updatedBy = 'PASSENGER';
              } else if (_status === 'CANCELLED_BY_SYSTEM') {
                updatedBy = 'SYSTEM';
              }
              url += 'updated_by=' + updatedBy + '&';
            }
            else if (_status === 'CLOSED_BY_PASSENGER' || _status === 'CLOSED_BY_DRIVER' || _status === 'CLOSED_BY_SYSTEM') {
              url += 'status=CLOSED&';
              updatedBy = 'DRIVER';
              if (_status === 'CLOSED_BY_PASSENGER') {
                updatedBy = 'PASSENGER';
              } else if (_status === 'CLOSED_BY_SYSTEM') {
                updatedBy = 'SYSTEM';
              }
              url += 'updated_by=' + updatedBy + '&';
            }
            else {
              url += 'status=' + _status + '&';
            }
          });
        }

      }
      if (angular.isDefined(controller)) {
        if (typeof controller === 'string') {
          if (controller !== '' && controller !== 'ALL') {
            url += 'controller=' + controller + '&';
          }
        }
        else {
          controller.map(function (_c) {
            url += 'controller=' + _c + '&';
          });
        }
      }
      if (angular.isDefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (angular.isDefined(is_corporate) && is_corporate !== '' && is_corporate !== 'ALL') {
        switch (is_corporate) {
          case 'CORPORATE':
            url += 'is_corporate=true&';
            break;
          case 'STANDARD':
            url += 'type=STANDARD&';
            break;
          case 'ROYAL':
            url += 'type=ROYAL&';
            break;
        }
      }
      if (angular.isDefined(corporate_id) && corporate_id !== '' && corporate_id !== 'ALL') {
        url += 'corporate_id=' + corporate_id + '&';
      }
      if (angular.isDefined(tag) && tag.length > 0) {
        tag.map(function (_tag) {
          switch (_tag) {
            case 'DIGITAL_DRIVER':
              url += 'driver_type=DIGITAL&';
              break;
            case 'STANDARD_DRIVER':
              url += 'driver_type=STANDARD&';
              break;
            case 'BROADCAST':
              url += 'broadcast=true&';
              break;
            case 'NO_BROADCAST':
              url += 'broadcast=false&';
              break;
          }

        });
      }
      if (angular.isDefined(payment_type) && payment_type !== '' && payment_type !== 'ALL') {
        url += 'payment_type=' + payment_type + '&';
      }
      if (angular.isDefined(paid_through_nekso_account)) {
        if (paid_through_nekso_account === 'ALL') {

        } else {
          url += 'paid_through_nekso_account=' + paid_through_nekso_account + '&';
        }
      }
      if (angular.isDefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv + '&';
        return url;
      }
      if (angular.isDefined(only_points)) {
        url += 'only_points=' + only_points + '&';
      }
      if (angular.isDefined(source)) {
        if (typeof source === 'string') {
          if (source !== '' && source !== 'ALL') {
            url += 'source=' + source + '&';
          }
        }
        else {
          source.map(function (_source) {
            url += 'source=' + _source + '&';
          });
        }

      }

      if (angular.isDefined(promotionCategory)) {
        if (typeof promotionCategory === 'string') {
          if (promotionCategory !== '' && promotionCategory !== 'ALL') {
            url += 'promotion_category=' + promotionCategory + '&';
          }
        }
        else {
          promotionCategory.map(function (pCategory) {
            url += 'promotion_category=' + pCategory + '&';
          });
        }
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting rides'));
    }

    function getLiveRideDetailFn(id) {
      var url = ADMIN_BASE_PATH + 'rides/live/' + id;
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting live rides datails'));
    }

    function getLiveRideStatusHistoryFn(id) {
      var url = ADMIN_BASE_PATH + 'rides/' + id + '/status-history';
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting rides status history'));
    }

    function getLivePassengerDetailFn(id) {
      var url = ADMIN_BASE_PATH + 'passengers/live/' + id;
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting live passenger details'));
    }

    function getLiveDriverDetailFn(id) {
      var url = ADMIN_BASE_PATH + 'drivers/live/' + id;
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting live driver details'));
    }

    function getLivePassengerLastRideFn(id, status, rideId) {
      var url = ADMIN_BASE_PATH + 'passengers/' + id + '/last-ride?';
      if (angular.isDefined(rideId)) {
        url += 'ride_id=' + rideId + '&';
      }
      if (angular.isDefined(status)) {
        if (status.isArray(status) && status.length > 1) {
          for (var i = 0; i < status.length; i++) {
            url += 'status=' + status[i] + '&';
          }
        } else if (typeof status === 'string' && status !== '') {
          url += 'status=' + status;
        }
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting live passenger last ride'));
    }

    function getLiveDriverLastRideFn(id, status, rideId) {
      var url = ADMIN_BASE_PATH + 'drivers/' + id + '/last-ride?';
      if (angular.isDefined(rideId)) {
        url += 'ride_id=' + rideId + '&';
      }
      if (angular.isDefined(status)) {
        if (status.isArray(status) && status.length > 1) {
          for (var i = 0; i < status.length; i++) {
            url += 'status=' + status[i] + '&';
          }
        } else if (typeof status === 'string' && status !== '') {
          url += 'status=' + status;
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting live driver last ride'));
    }

    function getLiveRidesFn(limit, skip, order, from, to, status, search, country, states, broadcast, exportToCsv, tags) {
      var url = ADMIN_BASE_PATH + 'rides/live?';
      var updatedBy = '';

      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      if (angular.isDefined(status)) {
        if (typeof status === 'string') {
          if (status === 'ALL' || status === '') {

          }
          else if (status === 'CANCELLED_BY_PASSENGER' || status === 'CANCELLED_BY_DRIVER' || status === 'CANCELLED_BY_SYSTEM') {
            url += 'status=CANCELLED&';
            updatedBy = 'DRIVER';
            if (status === 'CANCELLED_BY_PASSENGER') {
              updatedBy = 'PASSENGER';
            } else if (status === 'CANCELLED_BY_SYSTEM') {
              updatedBy = 'SYSTEM';
            }
            url += 'updated_by=' + updatedBy + '&';
          }
          else if (status === 'CLOSED_BY_PASSENGER' || status === 'CLOSED_BY_SYSTEM') {
            url += 'status=CLOSED&';
            updatedBy = 'DRIVER';
            if (status === 'CLOSED_BY_PASSENGER') {
              updatedBy = 'PASSENGER';
            } else if (status === 'CLOSED_BY_SYSTEM') {
              updatedBy = 'SYSTEM';
            }
            url += 'updated_by=' + updatedBy + '&';
          }
          else {
            url += 'status=' + status + '&';
          }
        }
        else {
          if (status.length === 12) {
            ['CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM', 'CLOSED_BY_PASSENGER', 'CLOSED_BY_SYSTEM'].map(function (s) {
              var index = status.indexOf(s);
              if (index > -1) {
                status.splice(index, 1);
              }
            });
          }
          status.map(function (_status) {
            if (_status === 'CANCELLED_BY_PASSENGER' || _status === 'CANCELLED_BY_DRIVER' || _status === 'CANCELLED_BY_SYSTEM') {
              url += 'status=CANCELLED&';
              updatedBy = 'DRIVER';
              if (_status === 'CANCELLED_BY_PASSENGER') {
                updatedBy = 'PASSENGER';
              } else if (_status === 'CANCELLED_BY_SYSTEM') {
                updatedBy = 'SYSTEM';
              }
              url += 'updated_by=' + updatedBy + '&';
            }
            else if (_status === 'CLOSED_BY_PASSENGER' || _status === 'CLOSED_BY_DRIVER' || _status === 'CLOSED_BY_SYSTEM') {
              url += 'status=CLOSED&';
              updatedBy = 'DRIVER';
              if (_status === 'CLOSED_BY_PASSENGER') {
                updatedBy = 'PASSENGER';
              } else if (_status === 'CLOSED_BY_SYSTEM') {
                updatedBy = 'SYSTEM';
              }
              url += 'updated_by=' + updatedBy + '&';
            }
            else {
              url += 'status=' + _status + '&';
            }
          });
        }

      }
      if (angular.isDefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (angular.isDefined(broadcast)) {
        if (broadcast !== '' && broadcast !== 'all') {
          url += 'broadcast=' + broadcast + '&';
        }
      }
      if (angular.isDefined(country)) {
        if (country !== '') {
          url += 'country=' + country.iso + '&';
        }
      }
      if (angular.isDefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      if (angular.isDefined(tags) && tags.length !== 0) {
        for (var j = 0; j < tags.length; j++) {
          url += 'tag=' + tags[j] + '&';
        }
      }
      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv + '&';
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting rides'));
    }

    function getMonitorRidesFn(limit, skip, from, to, is_corporate, states) {
      var url = ADMIN_BASE_PATH + 'admin/rides?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(status)) {
        if (status === 'ALL' || status === '') {

        }
        else if (status === 'CANCELLED_BY_PASSENGER' || status === 'CANCELLED_BY_DRIVER' || status === 'CANCELLED_BY_SYSTEM') {
          url += 'status=CANCELLED&';
          var updatedBy = 'DRIVER';
          if (status === 'CANCELLED_BY_PASSENGER') {
            updatedBy = 'PASSENGER';
          } else if (status === 'CANCELLED_BY_SYSTEM') {
            updatedBy = 'SYSTEM';
          }
          url += 'updated_by=' + updatedBy + '&';
        }
        else if (status === 'CLOSED_BY_PASSENGER' || status === 'CLOSED_BY_DRIVER' || status === 'CLOSED_BY_SYSTEM') {
          url += 'status=CLOSED&';
          var updatedBy = 'DRIVER';
          if (status === 'CLOSED_BY_PASSENGER') {
            updatedBy = 'PASSENGER';
          } else if (status === 'CLOSED_BY_SYSTEM') {
            updatedBy = 'SYSTEM';
          }
          url += 'updated_by=' + updatedBy + '&';
        }
        else {
          url += 'status=' + status + '&';
        }
      }
      if (!angular.isUndefined(controller)) {
        if (controller !== '' && controller !== 'ALL') {
          url += 'controller=' + controller + '&';
        }
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(is_corporate)) {
        if (is_corporate === 'ALL') {

        } else {
          url += 'is_corporate=' + is_corporate + '&';
        }
      }
      if (!angular.isUndefined(tag)) {
        if (tag === 'ALL') {

        } else if (tag == 'DIGITAL') {
          url += 'tag=' + tag + '&';
        } else {
          url += 'source=' + tag + '&';
        }
      }
      if (!angular.isUndefined(payment_type)) {
        if (payment_type === 'ALL') {

        } else {
          url += 'payment_type=' + payment_type + '&';
        }
      }
      if (!angular.isUndefined(paid_through_nekso_account)) {
        if (paid_through_nekso_account === 'ALL') {

        } else {
          url += 'paid_through_nekso_account=' + paid_through_nekso_account + '&';
        }
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i] + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting rides'));
    }

    function getAllRidesByStatesCountFn(state) {
      var token = JSON.parse(localStorage.admin_token).refreshToken;
      var url = ADMIN_BASE_PATH + 'rides?status=COMPLETED&count=true&states=' + state + '&_access_token=' + token;

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting drivers count'));
    }

    function getHomeCountsFn() {
      return $http.get(ADMIN_BASE_PATH + 'counts')
        .then(handleSuccess, handleError('Error getting home counts'));
    }

    function getRidesCountByStatusFn(status) {
      return $http.get(ADMIN_BASE_PATH + 'rides?status=' + status + '&count=true')
        .then(handleSuccess, handleError('Error getting rides count by status'));
    }

    function getRidesCountByCorporateFn(id, status) {
      return $http.get(API_BASE_PATH + 'corporate/' + id + '/rides?status=' + status + '&count=true')
        .then(handleSuccess, handleError('Error getting rides count by status'));
    }

    function getRidesCountByTypeFn(is_corporate) {
      return $http.get(ADMIN_BASE_PATH + 'rides?is_corporate=' + is_corporate)
        .then(handleSuccess, handleError('Error getting rides count by type'));
    }

    function getPhoneCodeFn(number) {
      return $http.get(ADMIN_BASE_PATH + encodeURIComponent(number) + '/validation_code')
        .then(handleSuccess, handleError('Error getting phone validation code'));
    }

    function getAchieveCodeFn(number) {
      return $http.get(ADMIN_BASE_PATH + encodeURIComponent(number) + '/award_code')
        .then(handleSuccess, handleError('Error getting awards validation code'));
    }

    function getPassengerImageFn(passengerId, pictureId, round, size) {
      var url = getPictureUrlFn(pictureId);

      if (!angular.isUndefined(size)) {
        url += '&size=' + size;
      }
      return url;
    }

    function getAllColorsFn() {
      return [
        {
          hex: '#F5F5DC',
          colorEn: 'Beige',
          colorEs: 'Beige'
        },
        {
          hex: '#000000',
          colorEn: 'Black',
          colorEs: 'Negro',
        },
        {
          hex: '#0000FF',
          colorEn: 'Blue',
          colorEs: 'Azul'
        },
        {
          hex: '#A52A2A',
          colorEn: 'Brown',
          colorEs: 'Marrón'
        },
        {
          hex: '#FF7F50',
          colorEn: 'Coral',
          colorEs: 'Coral'
        },
        {
          hex: '#FF00FF',
          colorEn: 'Fuchsia',
          colorEs: 'Fucsia'
        },
        {
          hex: '#FFD700',
          colorEn: 'Gold',
          colorEs: 'Dorado'
        },
        {
          hex: '#808080',
          colorEn: 'Gray',
          colorEs: 'Gris'
        },
        {
          hex: '#008000',
          colorEn: 'Green',
          colorEs: 'Verde'
        },
        {
          hex: '#800000',
          colorEn: 'Maroon',
          colorEs: 'Vinotinto'
        },
        {
          hex: '#FFA500',
          colorEn: 'Orange',
          colorEs: 'Naranja'
        },
        {
          hex: '#FFC0CB',
          colorEn: 'Pink',
          colorEs: 'Rosado'
        },
        {
          hex: '#800080',
          colorEn: 'Purple',
          colorEs: 'Morado'
        },
        {
          hex: '#FF0000',
          colorEn: 'Red',
          colorEs: 'Rojo'
        },
        {
          hex: '#FA8072',
          colorEn: 'Salmon',
          colorEs: 'Salmón'
        },
        {
          hex: '#C0C0C0',
          colorEn: 'Silver',
          colorEs: 'Plateado'
        },
        {
          hex: '#87CEEB',
          colorEn: 'SkyBlue',
          colorEs: 'Celeste'
        },
        {
          hex: '#40E0D0',
          colorEn: 'Turquoise',
          colorEs: 'Turquesa'
        },
        {
          hex: '#FFFFFF',
          colorEn: 'White',
          colorEs: 'Blanco'
        },
        {
          hex: '#FFFF00',
          colorEn: 'Yellow',
          colorEs: 'Amarillo'
        },
        {
          hex: '#F0F000',
          colorEn: 'Yellow/Black',
          colorEs: 'Amarillo/Negro'
        },
        {
          hex: 'NONE',
          colorEn: 'Other',
          colorEs: 'Otro'
        }
      ];
    }

    function findColorFn(color) {
      var colors = getAllColorsFn();
      for (var i in colors) {
        if (colors[i].hex === color) {
          return colors[i];
        }
      }
    }

    function getRidesTimeSeriesFn(from, to, group_by, states, status) {
      var url = ADMIN_BASE_PATH + 'ts/rides?';

      if (angular.isDefined(group_by)) {
        if (typeof group_by === 'object') {
          group_by.map(function (group) {
            url += 'group_by=' + group + '&';
          })
        } else if (typeof group_by === 'string') {
          url += 'group_by=' + group_by + '&';
        }
      }

      if (!angular.isUndefined(from)) {
        url += '&from=' + from;
      }
      if (!angular.isUndefined(to)) {
        url += '&to=' + to;
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += '&states=' + states[i].name;
          }
        }
      }
      if (angular.isDefined(status) && status !== '' && status !== 'ALL') {
        url += '&status=' + status;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting rides timeseries'));
    }

    function getDriverTimeSeriesByCountryFn(from, to, status) {
      var url = ADMIN_BASE_PATH + 'ts/countries/drivers?';
      if (!angular.isUndefined(from)) {
        url += 'from=' + from
      }
      if (!angular.isUndefined(to)) {
        url += '&to=' + to
      }
      if (!angular.isUndefined(status)) {
        if (status !== '') {
          if (status === 'ALL') {

          } else {
            url += '&status=' + status;
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Driver by country'));
    }

    function getExportDirectFn(url, polygons) {
      $http({
        url: url,
        method: "POST",
        headers: {
          'Content-type': 'application/json'
        },
        data: polygons,
        responseType: "arraybuffer"
      }).success(function (data, status, headers, config) {
        var file = new Blob([data], {type: 'application/binary'});
        var fileURL = URL.createObjectURL(file);
        // window.open(fileURL);
        var link = document.createElement('a');
        link.href = fileURL;
        link.download = "report.csv";
        link.click();
      }).error(function (data, status, headers, config) {
        //upload failed
      });
    }

    function getExportDataFn(from, to, baseUrl, status) {
      var url = ADMIN_BASE_PATH + baseUrl + 'from=' + from + '&to=' + to + '&';

      if (angular.isDefined(status)) {
        url += 'status=' + status + '&';
      }

      url += '_access_token=' + store.get('admin_token').refreshToken;

      return url;
    }

    function getDriversTimeSeriesFn(from, to, group_by, states) {
      var url = ADMIN_BASE_PATH + 'ts/drivers?from=' + from + '&to=' + to;

      if (angular.isDefined(group_by)) {
        url += '&group_by=' + group_by;
      }

      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += '&states=' + states[i].name;
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting drivers timeseries'));
    }

    function getPassengersTimeSeriesFn(from, to, group_by, states) {
      var url = ADMIN_BASE_PATH + 'ts/passengers?from=' + from + '&to=' + to;

      if (angular.isDefined(group_by)) {
        url += '&group_by=' + group_by;
      }

      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += '&states=' + states[i].name;
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting passengers timeseries'));
    }

    function handleSuccess(response) {
      return angular.isDefined(response) ? response.data : response;
    }

    function handleError(error) {
      return error;
    }

    function getAllCorporatesFn(limit, skip, order, from, to, search, status, country, states, exportToCsv) {
      var url = CORPORATE_BASE_PATH + '?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search) && search !== '') {
        url += '&' + 'search=' + search + '&';
      }
      if (!angular.isUndefined(status) && status !== '') {
        url += '&' + 'status=' + status + '&';
      }
      if (!angular.isUndefined(country) && country !== '') {
        url += '&' + 'country=' + country.iso + '&';
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      url += '_access_role=ADMIN&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true';
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting controllers'));
    }

    function getAllCorporatesSalesPackageFn(limit, skip, order, from, to, search, country, states) {
      var url = CORPORATE_BASE_PATH + 'sales-packages?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(country)) {
        url += 'country=' + country.iso + '&';
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getAllCorporatesSalesPackageFn'));
    }

    function getAllCorporatesSalesPackageHistoryFn(limit, skip, corporateId) {
      var url = CORPORATE_BASE_PATH + corporateId + '/sales-packages?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getAllCorporatesSalesPackageHistoryFn'));
    }

    function putCorporatesSalesPackageDetailEditFn(corporateId, transactionId, benefitDeliveredAt, benefitReference) {
      var url = CORPORATE_BASE_PATH + corporateId + '/sales-packages/' + transactionId;

      var tmp = $.param({
        benefitDeliveredAt: benefitDeliveredAt,
        benefitReference: benefitReference
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      }

      return $http.put(url, tmp, config)
        .then(handleSuccess, handleError('Error putCorporatesSalesPackageDetailEditFn'));
    }

    function putCorporatesSalesPackageAddCommentFn(corporateId, notes) {
      var url = CORPORATE_BASE_PATH + corporateId + '/sales-info/notes';
      var tmp = $.param({
        notes: notes
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      }
      return $http.put(url, tmp, config)
        .then(handleSuccess, handleError('Error in putCorporatesSalesPackageAddCommentFn'));
    }


    function editCorporateFn(id, corporate) {
      return $http.put(CORPORATE_BASE_PATH + id, corporate)
        .then(handleSuccess, handleError('Error editing controller profile'));
    }

    function editCorporateStatusFn(id_admin, id_corporate, status, comments) {
      return $http.put(CORPORATE_BASE_PATH + id_corporate + '/request?status=' + status, comments)
        .then(handleSuccess, handleError('Error editing controller profile'));
    }

    function createTaskFn(id, role, object) {
      return $http.put(API_BASE_PATH + 'admin/support/' + id + '?role=' + role, object)
        .then(handleSuccess, handleError('Error creating new task'));
    }

    function getTasksFn(id, role) {
      return $http.get(API_BASE_PATH + 'admin/support?role=' + role + '&user_id=' + id + '&_access_token=' + store.get('admin_token').refreshToken)
        .then(handleSuccess, handleError('Error getting new task'));
    }

    function createFrequencyFn(id, role, params) {
      return $http.put(API_BASE_PATH + 'admin/support/additionalInfo/' + id + '?role=' + role + params)
        .then(handleSuccess, handleError('Error creating new task'));
    }

    function getCommStatisticsFn(limit, skip, order, from, to, search, exportToCsv, country, states) {
      var url = ADMIN_BASE_PATH + 'support/statistics?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(country)) {
        url += 'country=' + country.iso + '&';
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }

      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=' + exportToCsv;
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting administrators'));
    }

    function addTagFn(userId, role, tag, add) {
      return $http.put(API_BASE_PATH + 'admin/tag/' + userId + '?role=' + role + '&tag=' + tag + '&add=' + add)
        .then(handleSuccess, handleError('Error tagging user'));
    }

    function getDriverProfileFn(driverId) {
      return $http.get(DRIVER_BASE_PATH + driverId)
        .then(handleSuccess, handleError('Error getting driver profile'));
    }

    function getInvoiceSettingsFn(country) {
      return $http.get(ADMIN_BASE_PATH + 'configuration/countries/' + country + '/invoicing')
        .then(handleSuccess, handleSuccess('Error getting invoice settings'));
    }

    function setInvoiceSettingsFn(country, obj) {
      return $http.put(ADMIN_BASE_PATH + 'configuration/countries/' + country + '/invoicing', obj)
        .then(handleSuccess, handleSuccess('Error setting invoice settings'));
    }

    function gethdyhauFn() {
      return $http.get(API_BASE_PATH + 'visitors/hdyhau')
        .then(handleSuccess, handleError('Error getting hdyhau'));
    }

    function getActionsTypesFn() {
      return $http.get(API_BASE_PATH + 'visitors/actions/types')
        .then(handleSuccess, handleError('Error getting actions types'));
    }

    function getActionsFn(limit, skip, order, from, to) {
      var url = API_BASE_PATH + 'visitors/actions?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting actions'));
    }

    function getVisitorActionsFn(id) {
      return $http.get(API_BASE_PATH + 'visitors/' + id + '/actions')
        .then(handleSuccess, handleError('Error getting actions'));
    }

    function createVisitorActionFn(visitor) {
      return $http.post(API_BASE_PATH + 'visitors/' + visitor.id + '/action', visitor.action)
        .then(handleSuccess, handleError('Error getting actions'));
    }

    function getPromotersFn() {
      return $http.get(API_BASE_PATH + 'visitors/promoters')
        .then(handleSuccess, handleError('Error getting visitors promoters'));
    }

    function getVisitorsFn(limit, skip, order, from, to, search, country, states) {
      var url = API_BASE_PATH + 'visitors?';
      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (!angular.isUndefined(country)) {
        url += 'country=' + country.iso + '&';
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting visitors'));
    }

    function createVisitorFn(visitor) {
      return $http.post(API_BASE_PATH + 'visitors', visitor)
        .then(handleSuccess, handleError('Error creating new visitor'));
    }

    function editVisitorFn(visitorId, visitor) {
      return $http.put(API_BASE_PATH + 'visitors/' + visitorId, visitor)
        .then(handleSuccess, handleError('Error editing visitor'));
    }

    function getPromotionsFn(limit, skip, order, from, to, search, status, role, category, country, states, exportToCsv) {

      var url = API_BASE_PATH + 'promotions?';

      if (!angular.isUndefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (!angular.isUndefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (!angular.isUndefined(order)) {
        url += 'order=' + order + '&';
      }
      if (!angular.isUndefined(from)) {
        url += 'from=' + from + '&';
      }
      if (!angular.isUndefined(to)) {
        url += 'to=' + to + '&';
      }
      if (!angular.isUndefined(search)) {
        if (search !== '') {
          url += 'search=' + search + '&';
        }
      }
      if (angular.isDefined(status)) {
        if (status !== '' && status !== 'ALL') {
          url += 'status=' + status + '&';
        }
      }
      if (angular.isDefined(role)) {
        if (role !== '' && role !== 'All') {
          url += 'role=' + role + '&';
        }
      }
      if (angular.isDefined(category)) {
        if (category === '' || category === 'ALL') {
          url += 'category=SYSTEM&';
          url += 'category=COUPON&';
          url += 'category=PROMOTIONAL_CODE&';
        } else {
          url += 'category=' + category + '&';
        }
      } else {
        url += 'category=SYSTEM&';
        url += 'category=COUPON&';
        url += 'category=PROMOTIONAL_CODE&';
      }
      if (!angular.isUndefined(country)) {
        url += 'country_iso=' + country.iso + '&';
      }
      if (angular.isDefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      url += '_access_role=ADMIN&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true&';
        return url;
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting promotions'));
    }

    function getPromotionFn(promotionId) {
      return $http.get(API_BASE_PATH + 'promotions/' + promotionId)
        .then(handleSuccess, handleError('Error getting promotion: ' + promotionId));
    }

    function createPromotionFn(promotion) {
      return $http.post(API_BASE_PATH + 'promotions', promotion)
        .then(handleSuccess, handleError('Error creating new promotion'));
    }

    function editPromotionFn(promotionId, promotion) {
      return $http.put(API_BASE_PATH + 'promotions/' + promotionId, promotion)
        .then(handleSuccess, handleError('Error editing promotion'));
    }

    function uploadMessageImageFn(image, promotionId) {
      var fd = new FormData();
      fd.append('image', image);

      var url = API_BASE_PATH + 'admin/inbox-messages/' + promotionId + '/picture';

      return $http({
        url: url,
        data: fd,
        method: 'PUT',
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      })
        .then(handleSuccess, handleError('Error uploading controller profile image'));
    }

    function uploadPromotionImageFn(image, promotionId) {
      var fd = new FormData();
      fd.append('image', image);

      var url = API_BASE_PATH + 'promotions/' + promotionId + '/picture';

      return $http({
        url: url,
        data: fd,
        method: 'PUT',
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      })
        .then(handleSuccess, handleError('Error uploading controller profile image'));
    }

    function copyPromotionImageFn(promotionIdNew, promotionIdOld) {
      var url = API_BASE_PATH + 'promotions/' + promotionIdNew + '/picture/copy-from/' + promotionIdOld;

      return $http({
        url: url,
        method: 'POST',
        transformRequest: angular.identity
      })
        .then(handleSuccess, handleError('Error copying controller profile image'));
    }

    function getPictureUrlFn(pictureId, size) {
      var url = API_BASE_PATH + 'utilities/pictures/' + pictureId + '?' + new Date().getTime();
      if (!angular.isUndefined(size)) {
        url += '&size=' + size;
      }
      return url;
    }

    function validPictureUrlFn(url) {
      return $http.get(url)
        .then(
          handleSuccess,
          handleError('Error getting image'));
    }

    function setPromotionStatusFn(promotionId, status, reason) {
      return $http.put(API_BASE_PATH + 'promotions/' + promotionId + '/status/' + status, reason)
        .then(handleSuccess, handleError('Error editing promotion'));
    }

    function approveDigitalDriverFn(driverId, controllerId) {
      return $http.put(ADMIN_BASE_PATH + 'drivers/' + driverId + '/subscription?status=OK&controllerId=' + controllerId)
        .then(handleSuccess, handleSuccess('Error approving digital driver'));
    }

    function rejectDigitalDriverFn(driverId, reasons) {
      var url = ADMIN_BASE_PATH + 'drivers/' + driverId + '/subscription?status=REJECTED';

      if (reasons.length > 0) {
        for (var i = 0; i < reasons.length; i++) {
          url += '&reject_reason=' + reasons[i];
        }
      }

      return $http.put(url)
        .then(handleSuccess, handleError('Error rejecting driver'));
    }

    function getRejectReasonsFn() {
      return $http.get(API_BASE_PATH + 'drivers/reject_reasons', {
        cache: true
      }).then(handleSuccess, handleSuccess('Error getting reject reasons'));
    }

    function getRoyalCountriesFn() {
      return $http.get(ADMIN_BASE_PATH + 'royal/settings/countries')
        .then(handleSuccess, handleSuccess('Error getting royal countries'));
    }

    function getRoyalCountriesStatesFn(countryCode) {
      return $http.get(ADMIN_BASE_PATH + 'royal/settings/countries/' + countryCode + '/states')
        .then(handleSuccess, handleSuccess('Error getting royal country states'));
    }

    function getCarsFn(countryCode) {
      return $http.get(API_BASE_PATH + 'cars/', {
        cache: true
      }).then(handleSuccess, handleSuccess('Error getting cars list'));
    }

    function getCarMakesFn() {
      return $http.get(API_BASE_PATH + 'cars/makes', {
        cache: true
      }).then(handleSuccess, handleSuccess('Error getting cars makes list'));
    }

    function getCarModelsFn(make) {
      var url = API_BASE_PATH + 'cars?';
      if (angular.isDefined(make)) {
        url += 'make=' + make;
      }
      return $http.get(url)
        .then(handleSuccess, handleSuccess('Error getting cars makes list'));
    }

    function getRoyalCountriesStatesConfigFn(countryCode, state) {
      return $http.get(ADMIN_BASE_PATH + 'royal/settings/countries/' + countryCode + '/states/' + state)
        .then(handleSuccess, handleSuccess('Error getting royal country state config'));
    }

    function editRoyalCountriesStatesConfigFn(countryCode, state, config) {
      if (config.driverType == 'ALL') {
        delete config.driverType;
      }
      if (config.driverStatus == 'ALL') {
        delete config.driverStatus;
      }
      return $http.put(ADMIN_BASE_PATH + 'royal/settings/countries/' + countryCode + '/states/' + state, config)
        .then(handleSuccess, handleSuccess('Error getting royal country state config'));
    }

    function getSuspendReasonsFn() {
      return $http.get(API_BASE_PATH + 'drivers/suspend_reasons', {
        cache: true
      }).then(handleSuccess, handleSuccess('Error getting suspend reasons'));
    }

    function getCountriesFn() {
      return $http.get(UTILITIES_BASE_PATH + 'countries?detailed=true', {
        cache: true
      }).then(handleSuccess, handleError('Error getting countries'));
    }

    function getStatesByCountryFn(country) {
      return $http.get(UTILITIES_BASE_PATH + 'states?country=' + country, {
        cache: true
      }).then(handleSuccess, handleError('Error getting country states'));
    }

    function testPricingSchemaFn(data, pricingSchema) {
      var url = CONTROLLERS_BASE_PATH + 'quotation?origin=' + data.origin + '&destination=' + data.destination + '&date=' + data.date;
      return $http.post(url, pricingSchema)
        .then(handleSuccess, handleError('Error getting price quotation'));
    }

    function getPlaceByLatLngFn(lat, lng) {
      var url = AMAZONAWS_API_URL + 'gmaps/rgeocode?latlng=' + lat + ',' + lng;
      var config = {
        headers: {
          'x-api-key': AMAZONAWS_API_KEY
        }
      };
      return $http.get(url, config)
        .then(handleSuccess, handleError('Error getting places from lat and lng'));
    }

    function getPricingSchemasFn() {
      return $http.get(ADMIN_BASE_PATH + 'configuration/pricing_schemas')
        .then(handleSuccess, handleError('Error getting pricing schemas'));
    }

    function getControllersFn(state) {
      var url = CONTROLLERS_BASE_PATH + 'pricing_schemas?';

      if (angular.isDefined(state)) {
        url += 'state=' + state + '&';
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting controllers'));
    }

    function getPaymentsTxtFn() {
      var url = ADMIN_BASE_PATH + 'drivers/payment-file?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      return url;
    }

    function getPaymentsFn(limit, skip, order, from, to, status, method, payment_reason, with_suspicious, states, search, exportToCsv, type) {
      var url = ADMIN_BASE_PATH + 'drivers/payments?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      if (angular.isDefined(status)) {
        if (typeof status === 'string' && status !== '') {
          if (status !== 'ALL') {
            url += 'status=' + status + '&';
          }
        }
        else {
          status.map(function (_status) {
            url += 'status=' + _status + '&';
          });
        }
      }
      if (angular.isDefined(method)) {
        if (method !== 'ALL') {
          url += 'method=' + method + '&';
        }
      }
      if (angular.isDefined(payment_reason)) {
        if (typeof payment_reason === 'string') {
          if (payment_reason !== 'ALL' && payment_reason !== '') {
            url += 'payment_reason=' + payment_reason + '&';
          }
          else {
            if (type == 1) {
              url += 'payment_reason=SYSTEM&';
              url += 'payment_reason=ACHIEVEMENT&';
              url += 'payment_reason=CREDIT_CARD&';
              url += 'payment_reason=CORPORATE&';
            } else {
              url += 'payment_reason=REFERRAL_NEW_DRIVER&';
              url += 'payment_reason=REFERRAL_DISCOUNT&';
              url += 'payment_reason=REFERRAL_DRIVER_BONUS&';
            }
          }
        }
        else {
          payment_reason.map(function (_payment_reason) {
            url += 'payment_reason=' + _payment_reason + '&';
          });
        }
      } else {
        if (type == 1) {
          url += 'payment_reason=SYSTEM&';
          url += 'payment_reason=ACHIEVEMENT&';
          url += 'payment_reason=CREDIT_CARD&';
          url += 'payment_reason=CORPORATE&';
        } else {
          url += 'payment_reason=REFERRAL_NEW_DRIVER&';
          url += 'payment_reason=REFERRAL_DISCOUNT&';
          url += 'payment_reason=REFERRAL_DRIVER_BONUS&';
        }
      }
      if (angular.isDefined(with_suspicious)) {
        if (with_suspicious !== 'ALL') {
          url += 'with_suspicious=' + with_suspicious + '&';
        }
      }
      if (!angular.isUndefined(states) && states.length !== 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i] + '&';
          }
        }
      }
      if (angular.isDefined(search) && search !== '') {
        url += 'search=' + search + '&';
      }
      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true&';

        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting drivers payments'));
    }

    function getDriverPaymentsFn(limit, skip, order, from, to, status, method, country, states, search, exportToCsv, detailedExportToCsv) {
      var url = ADMIN_BASE_PATH + 'drivers/payments?';

      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      if (angular.isDefined(status) && status !== null) {
        if (typeof status === 'string' && status !== '') {
          if (status !== 'ALL') {
            url += 'status=' + status + '&';
          }
        }
        else {
          for (var i = 0; i < status.length; i++) {
            url += 'status=' + status[i] + '&';
          }
        }
      }
      if (angular.isDefined(method)) {
        if (method !== 'ALL') {
          url += 'method=' + method + '&';
        }
      }
      if (angular.isDefined(country) && country !== null) {
        url += 'country=' + country.iso + '&';
      }

      if (!angular.isUndefined(states) && states.length > 0) {
        for (var j = 0; j < states.length; j++) {
          url += 'stateId=' + states[j].id + '&';
        }
      }
      if (angular.isDefined(search) && search !== '') {
        url += 'search=' + search + '&';
      }

      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      url += '_access_role=ADMIN&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true&';
        if (angular.isDefined(detailedExportToCsv) && detailedExportToCsv) {
          url += 'detailed=true&';
        }
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Driver payments'));
    }

    function getDriverPaymentsDetailFn(limit, skip, order, driverPaymentId, status, paymentReason, withSuspicious, exportToCsv) {
      var url = ADMIN_BASE_PATH + 'drivers/payments/' + driverPaymentId + '/?';

      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(status)) {
        if (typeof status === 'string' && status !== '') {
          if (status !== 'ALL') {
            url += 'status=' + status + '&';
          }
        } else {
          status.map(function (_status) {
            url += 'status=' + _status + '&';
          });
        }
      }
      if (angular.isDefined(paymentReason)) {
        if (typeof paymentReason === 'string' && paymentReason !== '') {
          if (paymentReason !== 'ALL') {
            url += 'reason=' + paymentReason + '&';
          }
        } else {
          paymentReason.map(function (_paymentReason) {
            url += 'reason=' + _paymentReason + '&';
          });
        }
      }
      if (!angular.isUndefined(withSuspicious) && withSuspicious !== 'ALL') {
        url += 'with_suspicious=' + withSuspicious + '&';
      }
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      url += '_access_role=ADMIN&';

      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true&';
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting Driver payments'));
    }

    function getCorporateTransactionsFn(limit, skip, order, from, to, operation, status, search, exportToCsv) {
      var url = CORPORATE_BASE_PATH + 'transactions?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      if (angular.isDefined(operation)) {
        url += 'operation=' + operation + '&';
      }
      if (angular.isDefined(status)) {
        if (status !== 'ALL' && status !== '') {
          url += 'status=' + status + '&';
        }
      }
      if (angular.isDefined(search) && search !== '') {
        url += 'search=' + search + '&';
      }
      if (angular.isDefined(exportToCsv) && exportToCsv) {
        url += 'export_to_csv=true&';
        return url;
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting corporate transactions payments'));
    }

    function getPaymentFn(paymentId) {
      return $http.get(ADMIN_BASE_PATH + 'drivers/payments/' + paymentId)
        .then(handleSuccess, handleError('Error getting drivers payments'));
    }

    function updatePaymentStatusFn(payments, data, comments) {
      var promises = payments.map(function (payment) {
        if (payment.status !== 'PAID' && (payment.status !== data.status)) {
          var obj = {
            id: payment.id,
            status: data.status,
            comment: comments
          };
          if (data.method === 'MERCADOPAGO') {
            obj.transactionId = data.transactionId;
          }
          if (data.reason) {
            obj.reason = data.reason;
          }
          var tmp = $.param(obj);
          var config = {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
            }
          };
          return $http.put(ADMIN_BASE_PATH + 'drivers/payments/' + payment.id, tmp, config);
        }
      });

      return $q.all(promises)
        .then(handleSuccess, handleError('Error updating payments'));
    }

    function getCommunicationChannelMessagesFn(limit, skip, order, from, to, search, status, target, states, export_to_csv) {
      var url = ADMIN_BASE_PATH + 'inbox-messages?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        // url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        // url += 'to=' + to + '&';
      }
      if (angular.isDefined(status)) {
        if (typeof status === 'string' && status !== '') {
          if (status !== 'ALL') {
            url += 'status=' + status + '&';
          }
        }
      }
      if (angular.isDefined(search) && search !== '') {
        url += 'search=' + search + '&';
      }
      if (angular.isDefined(target) && target !== '') {
        url += 'target=' + target + '&';
      }
      if (!angular.isUndefined(states) && states.length > 0) {
        for (var i = 0; i < states.length; i++) {
          if (states[i]) {
            url += 'states=' + states[i].name + '&';
          }
        }
      }
      if (angular.isDefined(export_to_csv) && export_to_csv) {
        url += 'export_to_csv=true&';
        return url;
      }
      return $http.get(url)
        .then(handleSuccess, handleError('Error getting driver communication channel messages'));
    }

    function createCommunicationChannelMessageFn(message) {
      return $http.post(ADMIN_BASE_PATH + 'inbox-messages', message)
        .then(handleSuccess, handleError('Error creating new message'));
    }

    function getFormParam(obj) {
      var str = [];
      for (var p in obj) {
        if (angular.isArray(obj[p])) {
          for (var i = 0; i < obj[p].length; i++) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p][i]));
          }
        } else {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      }
      return str.join("&");
    }

    function setCorporationRechargeFn(id, operation, amount) {
      var url = CORPORATE_BASE_PATH + id + '/recharge';
      var tmp = $.param({
        operation: operation,
        amount: amount
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      };
      return $http.put(url, tmp, config)
        .then(handleSuccess, handleError('Error creating corporation recharge'));
    }

    function getRechargeableCorporationsFn() {
      return $http.get(CORPORATE_BASE_PATH + 'rechargeable')
        .then(handleSuccess, handleError('Error getting Rechargeable Corporations'));
    }

    function editCommunicationChannelMessageFn(message) {
      return $http.put(ADMIN_BASE_PATH + 'inbox-messages/' + message.id, message)
        .then(handleSuccess, handleError('Error editing message'));
    }

    function setTransactionStatusFn(corporateId, transactionId, obj) {
      var str = [];
      for (var p in obj) {
        if (angular.isArray(obj[p])) {
          for (var i = 0; i < obj[p].length; i++) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p][i]));
          }
        } else {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }

      }
      var result = str.join("&");
      return $http.put(CORPORATE_BASE_PATH + corporateId + '/transactions/' + transactionId, result, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      })
        .then(handleSuccess, handleError('Error setting status of corporate transaction'));
    }

    function getCommunicationChannelMessageFn(id) {
      return $http.get(ADMIN_BASE_PATH + 'inbox-messages/' + id)
        .then(handleSuccess, handleError('Error getting message'));
    }

    function getCommunicationChannelMessageReportFn(limit, skip, order, from, to, search, status, target, export_to_csv) {
      var url = ADMIN_BASE_PATH + 'inbox-messages/drivers?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';

      if (angular.isDefined(limit)) {
        url += 'limit=' + limit + '&';
      }
      if (angular.isDefined(skip)) {
        url += 'skip=' + skip * limit + '&';
      }
      if (angular.isDefined(order)) {
        url += 'order=' + order + '&';
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      if (angular.isDefined(status)) {
        if (typeof status === 'string' && status !== '') {
          if (status !== 'ALL') {
            url += 'status=' + status + '&';
          }
        }
      }
      if (angular.isDefined(search) && search !== '') {
        url += 'search=' + search + '&';
      }
      if (angular.isDefined(target) && target !== '') {
        url += 'target=' + target + '&';
      }
      if (angular.isDefined(export_to_csv) && export_to_csv) {
        url += 'export_to_csv=true&';
        return url;
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error getting driver communication channel messages'));
    }

    function invoiceReportAccumulativeRidesByDriverFn(countryCode, statesId, date, controllerId) {
      var url = ADMIN_REPORTS_BASE_PATH + 'invoicing/drivers?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(countryCode)) {
        url += 'country=' + countryCode + '&';
      }
      if (!angular.isUndefined(statesId) && statesId.length > 0) {
        for (var i = 0; i < statesId.length; i++) {
          url += 'state_id=' + statesId[i].id + '&';
        }
      }
      if (angular.isDefined(date)) {
        url += 'date=' + date + '&';
      }
      if (angular.isDefined(controllerId)) {
        url += 'controller_id=' + controllerId;
      }
      return url;
    }

    function invoiceReportAccumulativeRidesByTaxiLineFn(countryCode, statesId, year, month, controllerId) {
      var url = ADMIN_REPORTS_BASE_PATH + 'invoicing/controllers?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(countryCode)) {
        url += 'country=' + countryCode + '&';
      }
      if (!angular.isUndefined(statesId) && statesId.length > 0) {
        for (var i = 0; i < statesId.length; i++) {
          url += 'state_id=' + statesId[i].id + '&';
        }
      }
      if (angular.isDefined(year)) {
        url += 'year=' + year + '&';
      }
      if (angular.isDefined(month)) {
        url += 'month=' + month + '&';
      }
      if (angular.isDefined(controllerId)) {
        url += 'controller_id=' + controllerId;
      }
      return url;
    }

    function corporateRechargeFn(countryCode, statesId, year, month, corporationId) {
      var url = ADMIN_REPORTS_BASE_PATH + 'invoicing/corporations?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(countryCode)) {
        url += 'country=' + countryCode + '&';
      }
      if (!angular.isUndefined(statesId) && statesId.length > 0) {
        for (var i = 0; i < statesId.length; i++) {
          url += 'state_id=' + statesId[i].id + '&';
        }
      }
      if (angular.isDefined(year)) {
        url += 'year=' + year + '&';
      }
      if (angular.isDefined(month)) {
        url += 'month=' + month + '&';
      }
      if (angular.isDefined(corporationId)) {
        url += 'corporation_id=' + corporationId;
      }
      return url;
    }

    function invoiceReportSystemFn(countryCode, statesId, year, month) {
      var url = ADMIN_REPORTS_BASE_PATH + 'invoicing/system?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(countryCode)) {
        url += 'country=' + countryCode + '&';
      }
      if (!angular.isUndefined(statesId) && statesId.length > 0) {
        for (var i = 0; i < statesId.length; i++) {
          url += 'state_id=' + statesId[i].id + '&';
        }
      }
      if (angular.isDefined(year)) {
        url += 'year=' + year + '&';
      }
      if (angular.isDefined(month)) {
        url += 'month=' + month + '&';
      }
      return url;
    }

    function invoiceReportPendingCommissionsFn(countryCode, statesId, from, to) {
      var url = ADMIN_REPORTS_BASE_PATH + 'drivers/pending-commissions?';
      url += '_access_token=' + store.get('admin_token').refreshToken + '&';
      if (angular.isDefined(countryCode)) {
        url += 'country=' + countryCode + '&';
      }
      if (!angular.isUndefined(statesId) && statesId.length > 0) {
        for (var i = 0; i < statesId.length; i++) {
          url += 'state_id=' + statesId[i].id + '&';
        }
      }
      if (angular.isDefined(from)) {
        url += 'from=' + from + '&';
      }
      if (angular.isDefined(to)) {
        url += 'to=' + to + '&';
      }
      return url;
    }

    function getCorporationSizesFn() {
      return $http.get(CORPORATE_BASE_PATH + 'corporation-sizes', {
        cache: true
      }).then(handleSuccess, handleError('Error getting corporation-sizes'));
    }

    function getCorporationTypesFn() {
      return $http.get(CORPORATE_BASE_PATH + 'corporation-types', {
        cache: true
      }).then(handleSuccess, handleError('Error getting corporation-types'));
    }

    function getTaxIdTypesFn(iso) {
      return $http.get(UTILITIES_BASE_PATH + 'tax-id-types/' + iso)
        .then(handleSuccess, handleError('Error getting tax-id-types'));
    }

    function getCorporateDocumentsFn() {
      return $http.get(CORPORATE_BASE_PATH + 'documents', {
        cache: true
      }).then(handleSuccess, handleError('Error getting corporate/documents'));
    }

    function postPaymentDriverDebitNoteFn(id, transactionId, amount, reason) {
      var url = ADMIN_BASE_PATH + 'drivers/payments/' + id + '/transactions/' + transactionId + '/debit-note';
      var tmp = $.param({
        amount: amount,
        reason: reason
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      };
      return $http.post(url, tmp, config)
        .then(handleSuccess, handleError('Error in postPaymentDriverDebitNoteFn'));
    }

    function postPaymentDriverCreditNoteFn(id, transactionId, amount, reason) {
      var url = ADMIN_BASE_PATH + 'drivers/payments/' + id + '/transactions/' + transactionId + '/credit-note';
      var tmp = $.param({
        amount: amount,
        reason: reason
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      };
      return $http.post(url, tmp, config)
        .then(handleSuccess, handleError('Error in postPaymentDriverCreditNoteFn'));
    }

    function postPaymentDriverCloseDayFn(from, to, country, statesId) {
      var url = ADMIN_BASE_PATH + 'drivers/payments/close';
      var tmp = $.param({
        from: from,
        to: to,
        country: country.iso,
        stateId: statesId
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      };
      return $http.post(url, tmp, config)
        .then(handleSuccess, handleError('Error in postPaymentDriverCloseFn'));
    }

    function getPromotionCodesByRoleFn(from, to, role) {
      var url = ADMIN_REPORTS_BASE_PATH + 'promotional-codes?' + 'from=' + from + '&to=' + to + '&role=' + role + '&codes=true&';
      url += '_access_token=' + store.get('admin_token').refreshToken;

      return $http.get(url)
        .then(handleSuccess, handleError('Error in getPromotionCodesByRoleFn'));
    }

    function getPromotionCodesReportingFn(from, to, role, promotionId) {
      var url = ADMIN_REPORTS_BASE_PATH + 'promotional-codes?' + 'from=' + from + '&to=' + to + '&role=' + role + '&promotion_id=' + promotionId + '&';
      url += '_access_token=' + store.get('admin_token').refreshToken;
      return url;
    }

    function getSuspiciousHistoryFn(params) {
      var properties = Object.assign({}, params);

      var url = ADMIN_BASE_PATH + properties.role.toLowerCase() + '/' + properties.userId + '/suspicious?';

      if (angular.isDefined(properties.limit)) {
        url += 'limit=' + properties.limit + '&';
      }
      if (angular.isDefined(properties.skip)) {
        url += 'skip=' + properties.skip * properties.limit + '&';
      }
      if (angular.isDefined(properties.order)) {
        url += 'order=' + properties.order + '&';
      }
      if (angular.isDefined(properties.from)) {
        url += 'from=' + properties.from + '&';
      }
      if (angular.isDefined(properties.to)) {
        url += 'to=' + properties.to + '&';
      }

      return $http.get(url)
        .then(handleSuccess, handleError('Error in getSuspiciousHistoryFn'));
    }

    function getAllBanksByIsoFn(countryCode) {
      return $http.get(UTILITIES_BASE_PATH + 'banks/' + countryCode, {
        cache: true
      }).then(handleSuccess, handleSuccess('Error getting cars list'));
    }

    function getPaymentMethodsFn() {
      return $http.get(UTILITIES_BASE_PATH + 'payment-methods', {
        cache: true
      }).then(handleSuccessForPaymentMethodsFn, handleError('Error getting payment-methods'));
    }

    function updateRoyalStatusFn(userId, status) {
      var url = ADMIN_BASE_PATH + 'royal/drivers/' + userId;
      var tmp = $.param({
        royalStatus: status
      });
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      };
      return $http.put(url, tmp, config)
        .then(handleSuccess, handleError('Error tagging user'));
    }

    function handleSuccessForPaymentMethodsFn(response) {
      var methods = [];
      if(angular.isDefined(response)) {
        angular.forEach(response.data, function(key) {
          var name = (key === 'WALLET') ? 'NEKSO CREDIT': key;
          methods.push({key:key, name: name});
        });
      }
      return methods;
    }

    function handleSuccessForStates(response) {
      var states = _.uniqBy(response.data, 'name');
      return states;
    }

    return {
      createController: createControllerFn,
      editController: editControllerFn,
      getAllControllers: getAllControllersFn,
      getAllDrivers: getAllDriversFn,
      getRoyalDrivers: getRoyalDriversFn,
      getCounts: getCountsFn,
      getDriversCounts: getDriversCountsFn,
      getSosNotifications: getSosNotificationsFn,
      getNotifications: getNotificationsFn,
      getAllDriversCount: getAllDriversCountFn,
      getDriversCountByStatus: getDriversCountByStatusFn,
      getAllPassengers: getAllPassengersFn,
      getAllPassengersCount: getAllPassengersCountFn,
      getAllRides: getAllRidesFn,
      getLiveRides: getLiveRidesFn,
      getLiveRideDetail: getLiveRideDetailFn,
      getLiveRideStatusHistory: getLiveRideStatusHistoryFn,
      getLivePassengerDetail: getLivePassengerDetailFn,
      getLiveDriverDetail: getLiveDriverDetailFn,
      getLivePassengerLastRide: getLivePassengerLastRideFn,
      getLiveDriverLastRide: getLiveDriverLastRideFn,
      getMonitorRides: getMonitorRidesFn,
      getAllRidesByStatesCount: getAllRidesByStatesCountFn,
      getRidesCountByStatus: getRidesCountByStatusFn,
      getRidesCountByType: getRidesCountByTypeFn,
      getRidesCountByCorporate: getRidesCountByCorporateFn,
      getPhoneCode: getPhoneCodeFn,
      getAchieveCode: getAchieveCodeFn,
      findColor: findColorFn,
      editSosNotificationStatus: editSosNotificationStatusFn,
      getRidesTimeSeries: getRidesTimeSeriesFn,
      getDriverTimeSeriesByCountry: getDriverTimeSeriesByCountryFn,
      editAdministrator: editAdministratorFn,
      getDriversTimeSeries: getDriversTimeSeriesFn,
      getExportData: getExportDataFn,
      getExportDirect: getExportDirectFn,
      getAdministrators: getAdministratorsFn,
      getPassengersTimeSeries: getPassengersTimeSeriesFn,
      createAdministrator: createAdministratorFn,
      getAccessRoles: getAccessRolesFn,
      getAllStates: getAllStatesFn,
      getHomeCounts: getHomeCountsFn,
      getAllCorporates: getAllCorporatesFn,
      getAllCorporatesSalesPackage: getAllCorporatesSalesPackageFn,
      getAllCorporatesSalesPackageHistory: getAllCorporatesSalesPackageHistoryFn,
      putCorporatesSalesPackageDetailEdit: putCorporatesSalesPackageDetailEditFn,
      putCorporatesSalesPackageAddComment: putCorporatesSalesPackageAddCommentFn,
      editCorporate: editCorporateFn,
      editCorporateStatus: editCorporateStatusFn,
      createTask: createTaskFn,
      getTasks: getTasksFn,
      createFrequency: createFrequencyFn,
      getCommStatistics: getCommStatisticsFn,
      getTagDrivers: getTagDriversFn,
      addTag: addTagFn,
      getDriverProfile: getDriverProfileFn,
      getInvoiceSettings: getInvoiceSettingsFn,
      setInvoiceSettings: setInvoiceSettingsFn,
      gethdyhau: gethdyhauFn,
      getActionsTypes: getActionsTypesFn,
      getActions: getActionsFn,
      getPromoters: getPromotersFn,
      createVisitorAction: createVisitorActionFn,
      getVisitors: getVisitorsFn,
      createVisitor: createVisitorFn,
      editVisitor: editVisitorFn,
      getVisitorActions: getVisitorActionsFn,
      getPromotions: getPromotionsFn,
      getPromotion: getPromotionFn,
      createPromotion: createPromotionFn,
      editPromotion: editPromotionFn,
      uploadPromotionImage: uploadPromotionImageFn,
      copyPromotionImage: copyPromotionImageFn,
      uploadMessageImage: uploadMessageImageFn,
      getPictureUrl: getPictureUrlFn,
      getClubNekso: getClubNeksoFn,
      getClubNeksoUsersCSV: getClubNeksoUsersCSVFn,
      getClubNeksoUsers: getClubNeksoUsersFn,
      getClubNeksoRoles: getClubNeksoRolesFn,
      getAchievementHistoryByDriverId: getAchievementHistoryByDriverIdFn,
      updateAwards: updateAwardsFn,
      getCoupons: getCouponsFn,
      redeemClubNekso: redeemClubNeksoFn,
      setPromotionStatus: setPromotionStatusFn,
      approveDigitalDriver: approveDigitalDriverFn,
      getStatesBounds: getStatesBoundsFn,
      rejectDigitalDriver: rejectDigitalDriverFn,
      getRejectReasons: getRejectReasonsFn,
      getRoyalCountries: getRoyalCountriesFn,
      getRoyalCountriesStates: getRoyalCountriesStatesFn,
      getCars: getCarsFn,
      getCarMakes: getCarMakesFn,
      getCarModels: getCarModelsFn,
      getRoyalCountriesStatesConfig: getRoyalCountriesStatesConfigFn,
      editRoyalCountriesStatesConfig: editRoyalCountriesStatesConfigFn,
      getSuspendReasons: getSuspendReasonsFn,
      getCountries: getCountriesFn,
      getSupportCategories: getSupportCategoriesFn,
      getStopUsingReasons: getStopUsingReasonsFn,
      getStatesByCountry: getStatesByCountryFn,
      testPricingSchema: testPricingSchemaFn,
      getPlaceByLatLng: getPlaceByLatLngFn,
      getPricingSchemas: getPricingSchemasFn,
      getControllers: getControllersFn,
      getPaymentsTxt: getPaymentsTxtFn,
      getPayments: getPaymentsFn,
      getDriverPayments: getDriverPaymentsFn,
      getDriverPaymentsDetail: getDriverPaymentsDetailFn,
      getCorporateTransactions: getCorporateTransactionsFn,
      getPayment: getPaymentFn,
      getAllColors: getAllColorsFn,
      updatePaymentStatus: updatePaymentStatusFn,
      createCommunicationChannelMessage: createCommunicationChannelMessageFn,
      getCommunicationChannelMessages: getCommunicationChannelMessagesFn,
      getCommunicationChannelMessage: getCommunicationChannelMessageFn,
      editCommunicationChannelMessage: editCommunicationChannelMessageFn,
      setCorporationRecharge: setCorporationRechargeFn,
      getRechargeableCorporations: getRechargeableCorporationsFn,
      setTransactionStatus: setTransactionStatusFn,
      getCommunicationChannelMessageReport: getCommunicationChannelMessageReportFn,
      accumulativeRidesByDriver: invoiceReportAccumulativeRidesByDriverFn,
      accumulativeRidesByTaxiLine: invoiceReportAccumulativeRidesByTaxiLineFn,
      invoiceReportPendingCommissions: invoiceReportPendingCommissionsFn,
      invoiceReportSystem: invoiceReportSystemFn,
      corporateRecharge: corporateRechargeFn,
      getCorporationSizes: getCorporationSizesFn,
      getCorporationTypes: getCorporationTypesFn,
      getTaxIdTypes: getTaxIdTypesFn,
      getCorporateDocuments: getCorporateDocumentsFn,
      postPaymentDriverDebitNote: postPaymentDriverDebitNoteFn,
      postPaymentDriverCreditNote: postPaymentDriverCreditNoteFn,
      postPaymentDriverCloseDay: postPaymentDriverCloseDayFn,
      getPromotionCodesByRole: getPromotionCodesByRoleFn,
      getGooglePolyline: getGooglePolylineFn,
      getGoogleStaticMap: getGoogleStaticMapFn,
      getPromotionCodesReporting: getPromotionCodesReportingFn,
      getSuspiciousHistory: getSuspiciousHistoryFn,
      validPictureUrl: validPictureUrlFn,
      getPaymentMethods: getPaymentMethodsFn,
      updateRoyalStatus: updateRoyalStatusFn,
      getAllBankTransfer: getAllBankTransferFn,
      putBankTransferChangeStatus: putBankTransferChangeStatusFn,
      getAllBanksByIso: getAllBanksByIsoFn,
      conciliationBankTransferByCSV: conciliationBankTransferByCSVFn,
      cashBoxBankTransfer: cashBoxBankTransferFn,
      getSupportedBanksForBankTransfers: getSupportedBanksForBankTransfersFn,
      createPayment: createPaymentFn
    };

  }

  angular.module('neksoFeAdmindashboardApp')
    .constant('_', window._)
    .factory('adminService', adminService);

})();
