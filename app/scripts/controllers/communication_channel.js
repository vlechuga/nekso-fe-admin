/**
 * Created by abarazarte on 17/02/17.
 */
(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:CommunicationChannelCtrl
   * @description
   * # CommunicationChannelCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CommunicationChannelCtrl', communicationChannelCtrlFn);

  function communicationChannelCtrlFn($scope, $location, $modal, adminService, utilService, blockUI, ngToast, $timeout){
    var vm = this;

    var searchFlag = true;
    var loadingMessages = false;
    var loadingMessagesReport = false;

    vm.messages = [];
    vm.totalMessages = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      country: undefined,
      states: undefined,
      target: '',
      status: '',
      searchText: '',
      date: {
        startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
        endDate: moment().hours(23).minutes(59).seconds(59).milliseconds(999),
        opts: {
          timePicker: true,
          timePicker24Hour: true,
          locale: {
            applyClass: 'btn-green',
            applyLabel: "Apply",
            fromLabel: "From",
            format: "DD/MM/YYYY hh:mm A",
            toLabel: "To",
            cancelLabel: 'Cancel',
            customRangeLabel: 'Custom range'
          },
          ranges: {
            'Today': [moment().hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Yesterday': [moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().subtract(1, 'days').hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Last 7 Days': [moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'Last 30 Days': [moment().subtract(30, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
            'All': [moment().year(2015).month(10).days(1).hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)]
          }
        }
      }
    };
    vm.predicate = 'createdAt';
    vm.reverse = true;
    vm.loading = {};
    vm.report = {
      load: false,
      messages: [],
      totalMessages: 0,
      controls: {
        numPerPage: 10,
        currentPage: 1
      },
      filter: {
        target: '',
        status: '',
        searchText: '',
        country: {},
        states: undefined,
        report: {
          country: {},
          states: undefined
        },
        date: {
          startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
          endDate: moment().hours(23).minutes(59).seconds(59).milliseconds(999),
          opts: {
            timePicker: true,
            timePicker24Hour: true,
            locale: {
              applyClass: 'btn-green',
              applyLabel: "Apply",
              fromLabel: "From",
              format: "DD/MM/YYYY hh:mm A",
              toLabel: "To",
              cancelLabel: 'Cancel',
              customRangeLabel: 'Custom range'
            },
            ranges: {
              'Today': [moment().hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
              'Yesterday': [moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().subtract(1, 'days').hours(23).minutes(59).seconds(59).milliseconds(999)],
              'Last 7 Days': [moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
              'Last 30 Days': [moment().subtract(30, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
              'All': [moment().year(2015).month(10).days(1).hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)]
            }
          }
        }
      },
      predicate: 'message.createdAt',
      reverse: true
    };

    vm.searchMessagesOnEnter = searchMessagesOnEnterFn;
    vm.searchMessagesReportOnEnter = searchMessagesReportOnEnterFn;
    vm.createNewMessage = createNewMessageFn;
    vm.exportToCsv = exportToCsvFn;
    vm.getCsvUrl = getCsvUrlFn;
    vm.openMessageDetail = openMessageDetailFn;
    vm.getMessagesReport = getMessagesReportFn;

    $scope.$watch('vm.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.controls.currentPage = 1;
          getMessagesFn();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getMessagesFn();
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.date, vm.filter.status, vm.filter.target]', function (newVal, oldVal) {
      if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3]) {
        vm.controls.currentPage = 1;
        getMessagesFn();
      }
    }, true);

    $scope.$watch('vm.report.filter.searchText', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal === '' && searchFlag) {
          searchFlag = false;
          vm.report.controls.currentPage = 1;
          getMessagesReportFn();
        }
      }
    });

    $scope.$watch('[vm.filter.states]', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(vm.filter.states) && vm.filter.states.length > 0) {
          getMessagesFn();
        }
      }
    }, true);

    $scope.$watch('[vm.report.filter.states]', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(angular.isDefined(vm.report.filter.states) && vm.report.filter.states.length > 0) {
          getMessagesReportFn();
        }
      }
    }, true);

    $scope.$watch('vm.report.controls.currentPage', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        getMessagesReportFn();
      }
    });

    $scope.$watch('[vm.report.controls.numPerPage, vm.report.filter.date, vm.report.filter.status, vm.report.filter.target]', function (newVal, oldVal) {
      if (vm.report.load && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3])) {
        vm.report.controls.currentPage = 1;
        getMessagesReportFn();
      }
    }, true);

    function getMessagesFn() {
      vm.report.load = false;
      if (!loadingMessages) {
        var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
        var myBlock = blockUI.instances.get('messagesList');
        myBlock.start();
        loadingMessages = true;
        adminService.getCommunicationChannelMessages(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.searchText, vm.filter.status, vm.filter.target, vm.filter.states, false)
          .then(function (response) {
            vm.messages = response.data;
            vm.totalMessages = response.total;
            myBlock.stop();
            loadingMessages = false;
          }, function (error) {
            if ((error.status == 401 || error.status == 403) && (error.data.code == 618)) {
              vm.notAuthMsg = error.data.description;
            } else {
              ngToast.create({
                className: 'danger',
                content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
              });
              myBlock.stop();
              loadingMessages = false;
            }
          });
      }
    }

    function searchMessagesOnEnterFn(event) {
      if (event.keyCode == 13) {
        searchFlag = true;
        getMessagesFn();
      }
    }

    function searchMessagesReportOnEnterFn(event) {
      if (event.keyCode == 13) {
        searchFlag = true;
        getMessagesReportFn();
      }
    }

    function createNewMessageFn() {
      $location.path('/communication/channel/messages/new');
    }

    function getMessagesReportFn() {
      vm.report.load = true;
      if (!loadingMessagesReport) {
        var orderBy = (vm.report.reverse) ? '-' + vm.report.predicate : vm.report.predicate;
        var myBlock = blockUI.instances.get('reportMessagesList');
        myBlock.start();
        loadingMessagesReport = true;
        adminService.getCommunicationChannelMessageReport(vm.report.controls.numPerPage, vm.report.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.report.filter.date.startDate), utilService.toStringDate(vm.report.filter.date.endDate), vm.report.filter.searchText, vm.report.filter.status, vm.report.filter.target, undefined)
          .then(function (response) {
            vm.report.messages = response.data;
            vm.report.totalMessages = response.total;
            myBlock.stop();
            loadingMessagesReport = false;
          }, function (error) {
            if ((error.status == 401 || error.status == 403) && (error.data.code == 618)) {
              vm.notAuthMsg = error.data.description;
            } else {
              ngToast.create({
                className: 'danger',
                content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
              });
              myBlock.stop();
              loadingMessagesReport = false;
            }
          });
      }
    }

    function exportToCsvFn() {
      vm.loading.export = true;
      $timeout(function () {
        vm.loading.export = false;
      }, 10 * 1000);
    }

    function getCsvUrlFn() {
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      return adminService.getCommunicationChannelMessageReport(undefined, undefined, orderBy, utilService.toStringDate(vm.report.filter.date.startDate), utilService.toStringDate(vm.report.filter.date.endDate), vm.report.filter.searchText, vm.report.filter.status, vm.report.filter.target, true)
    }

    function openMessageDetailFn(message, from) {
      var messageModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/communication_channel_preview.html',
        size: 'md',
        controller: 'CommChannelPreviewModalCtrl',
        controllerAs: 'vm',
        resolve: {
          message: function () {
            return message;
          }
        }
      });
    }
  }
})();
