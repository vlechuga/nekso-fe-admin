(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DriversCtrl
   * @description
   * # DriversCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('ClubPassengersCtrl', ClubPassengersCtrl);

  function ClubPassengersCtrl($scope, $modal, adminService, blockUI, $filter, utilService, ngToast, store) {
    if (utilService.getUserPermissionBase('read:communication')) {
      return true;
    }

    var vm = this;
    var searchFlag = false;

    vm.loading = {};
    vm.drivers = [];
    vm.totalDrivers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.filter = {
      status: '',
      taxiLine: '',
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

    console.log('testing');
    return true;

    vm.taxiLines = [];
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.order = orderFn;
    vm.openCarInformation = openCarInformationFn;
    vm.getDriverStatus = getDriverStatusFn;
    vm.exportToCsv = exportToCsvFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.openDriverDetail = openDriverDetailFn;
    vm.addTaskView = addTaskViewFn;
    vm.selectAction = selectActionFn;
    vm.cancelTask = cancelTaskFn;
    vm.addTask = addTaskFn;
    vm.checkFrequency = checkFrequencyFn;
    vm.addFrequency = addFrequencyFn;
    vm.editFrequency = editFrequencyFn;
    vm.cancelEditFrequency = cancelEditFrequencyFn;
    vm.cancelFrequency = cancelFrequencyFn;
    vm.showCalendar = showCalendar;

    getControllers();

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          getDrivers();
        }
      }
    });

    $scope.$watch('[vm.controls.currentPage, vm.controls.numPerPage, vm.filter.date, vm.filter.rating, vm.filter.status, vm.filter.taxiLine, vm.filter.emailVerified, vm.filter.tag, vm.filter.action, vm.filter.rides]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5] || newVal[6] !== oldVal[6] || newVal[7] !== oldVal[7] || newVal[8] !== oldVal[8] || newVal[9] !== oldVal[9])){
        getDrivers();
      }
    }, true);

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function getDrivers(){
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      var myBlock = blockUI.instances.get('driversList');
      myBlock.start();
      adminService.getAllDrivers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.rating, vm.filter.status, vm.filter.taxiLine, vm.filter.emailVerified, vm.filter.searchText, vm.filter.tag, vm.filter.action, vm.filter.rides)
        .then(function(drivers) {
          for(var i = 0; i < drivers.data.length; i++){
            drivers.data[i].fullName = drivers.data[i].firstName + ' ' + drivers.data[i].lastName;
            drivers.data[i].controllerId = drivers.data[i].controller.id;
            if(typeof drivers.data[i].tags !== 'undefined'){
              drivers.data[i].tagRole = 'fa fa-briefcase';
            }
            if(typeof drivers.data[i].memberSupport !== 'undefined'){
              drivers.data[i].memberSupport.totalSms = setFieldNull(drivers.data[i].memberSupport.totalSms, 0);
              drivers.data[i].memberSupport.totalEmail = setFieldNull(drivers.data[i].memberSupport.totalEmail,0);
              drivers.data[i].memberSupport.totalCall = setFieldNull(drivers.data[i].memberSupport.totalCall,0);
              drivers.data[i].memberSupport.totalTraining = setFieldNull(drivers.data[i].memberSupport.totalTraining,0);
            }
          }
          vm.drivers = drivers.data;
          vm.totalDrivers = drivers.total;
          myBlock.stop();
        }, function(error) {
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          };
        });
    }

    function openCarInformationFn(driver){
      if (getUserPermissionFn('read:drivers')) {
        var carModalInstance = $modal.open({
          animate: true,
          templateUrl: '../../views/modals/car.html',
          size: 'md',
          controller: 'CarModalCtrl',
          controllerAs: 'carModalVm',
          resolve: {
            driver: function(){
              return driver;
            }
          }
        });
      };
    }

    function getControllers(){
      adminService.getAllControllers()
        .then(function(controllers){
          for(var i = 0, len = controllers.data.length; i < len; i++){
            var controller = {};
            controller.id = controllers.data[i].id;
            controller.name = controllers.data[i].name;

            vm.taxiLines.push(controller);
          }
        }, function(error){
          console.log(error);
        });
    }

    function getDriverStatusFn(status){
      if(!angular.isUndefined(status)){
        var state = '';
        switch (status){
          case "OK":
            state = 'Approved';
            break;
          case "IN_REVIEW":
            state = 'In review';
            break;
          case "APPROVAL_EXPIRED":
            state = 'Approval time expired';
            break;
          case "SUSPENDED":
            state = 'Suspended';
            break;
          case "REJECTED":
            state = 'Rejected';
            break;
          case "PENDING_RESIGNATION":
            state = "Pending resignation"
            break;
          default:
            break;
        }
        return state;
      }
    }

    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = '';
      if(vm.reverse){
        orderBy += '-' + vm.predicate;
      }else{
        orderBy += vm.predicate;
      }
      return adminService.getAllDrivers(0, 0, orderBy, utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate), vm.filter.rating, vm.filter.status, vm.filter.taxiLine, vm.filter.emailVerified, vm.filter.searchText, vm.filter.tag, vm.filter.action, vm.filter.rides)
        .then(function(drivers){
          var toExport = [];
          for(var i = 0, len = drivers.data.length; i < len; i++){
            var driver = drivers.data[i];
            var tmp = {};
            tmp.name = driver.firstName + ' ' + driver.lastName;
            tmp.email = driver.email;
            tmp.phone = driver.phone;
            tmp.createdDate = $filter('date')(new Date(driver.createdDate), 'dd/MM/yyyy hh:mm a');
            tmp.taxiLine = driver.controller.name;
            tmp.completedRides = driver.ridesCount;
            tmp.rating = driver.rating;
            if(typeof driver.memberSupport !== 'undefined'){
              tmp.totalCall = driver.memberSupport.totalCall;
              tmp.totalEmail = driver.memberSupport.totalEmail;
              tmp.totalSms = driver.memberSupport.totalSms;
              tmp.totalTraining = driver.memberSupport.totalTraining;
            }else{
              tmp.totalCall = 0;
              tmp.totalEmail = 0;
              tmp.totalSms = 0;
              tmp.totalTraining = 0;
            }
            if(typeof driver.frequencyApp !== 'undefined'){
              tmp.frequencyApp = driver.frequencyApp;
            }else{
             tmp.frequencyApp = '';
            }
            tmp.status = getDriverStatusFn(driver.status);
            toExport.push(tmp);
          }
          vm.loading.export = false;
          return toExport;
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
          vm.loading.export = false;
        });
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag  = false;
      getDrivers();
    }

    function searchDriversFn(){
      searchFlag = true;
      getDrivers();
    }

    function searchDriversOnEnterFn(event){
      if(event.which == 13){
        searchFlag = true;
        getDrivers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getDrivers();
    };

    /* Communications functions */

    function openDriverDetailFn(driver){
      vm.currentDriver = {};
      vm.currentDriver = driver;

      $('#details-view').removeClass('hidden');
      utilService.goToByScroll('user-selected');
      var myBlock = blockUI.instances.get('detailDriversList');
      myBlock.start();
      vm.tasks = [];
      var data = {};
      adminService.getTasks(driver.id, 'DRIVER')
        .then(function(result){

          vm.totalTasks = result.tasks.length;
          if(vm.totalTasks === 0){
            $('#block-ui-task').addClass('hidden');
          }else{
            $('#block-ui-task').removeClass('hidden');
          }
          for(var x=0; x<vm.totalTasks; x++){
            if(result.tasks[x].type === 'CALL'){
              result.tasks[x].action = 'phone';
            }else if(result.tasks[x].type === 'SMS'){
              result.tasks[x].action = 'sms';
            }else if(result.tasks[x].type === 'EMAIL'){
              result.tasks[x].action = 'email';
            }else if(result.tasks[x].type === 'TRAINING'){
              result.tasks[x].action = 'group';
            }
            result.tasks[x].dateFormatted = $filter('date')(new Date(result.tasks[x].createdDate), 'dd/MM/yyyy hh:mm a');
            result.tasks[x].resultFormatted = result.tasks[x].result.replace("_", " ");
            vm.tasks.push(result.tasks[x]);
          }

          vm.newtask = {};
          vm.newtask.result = '';
          vm.newtask.comment = '';
          vm.newtask.type = '';
          vm.newtask.id = driver.id;
          vm.newMoreInfo = {};
          var flag = false;
          if(typeof vm.currentDriver.frequencyApp !== 'undefined'){
            vm.newMoreInfo.frequencyApp = vm.currentDriver.frequencyApp;
            flag = true;
          }
          if(angular.isDefined(vm.currentDriver.tags)){
            vm.newMoreInfo.tag = vm.currentDriver.tags
          }

          if(typeof vm.currentDriver.inconsistentData !== 'undefined'){
            for(var x=0; x<vm.currentDriver.inconsistentData.length; x++){
              if(vm.currentDriver.inconsistentData[x] === 'NAME'){
                vm.newMoreInfo.inconsistentDataName = true;
                flag =  true;
              }else if(vm.currentDriver.inconsistentData[x] === 'EMAIL'){
                vm.newMoreInfo.inconsistentDataEmail = true;
                flag =  true;
              }else if(vm.currentDriver.inconsistentData[x] === 'PHONE'){
                vm.newMoreInfo.inconsistentDataPhone = true;
                flag =  true;
              }
            }
          }
          if(flag){
            $('#frequencyApp').prop("disabled",true);
            $('#tagSelect').prop("disabled",true);
            $('#inconsistentData-name').prop("disabled",true);
            $('#inconsistentData-email').prop("disabled",true);
            $('#inconsistentData-phone').prop("disabled",true);
            $('#frequency-buttons').addClass("hidden");
            $('#edit-frequency').removeClass("hidden");
          }else{
            $('#frequencyApp').prop("disabled",false);
            $('#tagSelect').prop("disabled",false);
            $('#inconsistentData-name').prop("disabled",false);
            $('#inconsistentData-email').prop("disabled",false);
            $('#inconsistentData-phone').prop("disabled",false);
            $('#frequency-buttons').removeClass("hidden");
            $('#cancelFrequency').removeClass("hidden");
            $('#cancelEditFrequency').addClass("hidden");
            $('#edit-frequency').addClass("hidden");
          }
          myBlock.stop();

        }, function(error){
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            ngToast.create({
              className: 'danger',
              content: 'Error getting the tasks. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          };
        });
    }

    function addTaskViewFn(){
      $('#add-task-view').removeClass('hidden');
    }

    function selectActionFn(value, ico){
      $('#action').val(value);
      vm.newtask.type = value;
      $('#dropdownMenu1').html('<span><i class="material-icons">'+ico+'</i>' + value + '</span>');
      if(value == 'CALL'){
        $('#task-result').removeClass('hidden');
      }else{
        $('#task-result').addClass('hidden');
      }
    }

    function cancelTaskFn(){
      $('#formAction').find('input').val('');
      $('#formAction').find('textarea').val('');
      $('#dropdownMenu1').html('Action <span class="caret"></span>');
      $('#task-result').addClass('hidden');
      $('#commentContainer').removeClass('has-error');
      $('#actionContainer .dropdown').removeClass('exist-error');
      $('#task-result').removeClass('has-error');
    }

    function addTaskFn(){
      if(((vm.newtask.comment === '') || (vm.newtask.type === '')) || ((vm.newtask.type ==='CALL') && (vm.newtask.result === ''))){
        ngToast.create({
              className: 'danger',
              content: 'Missing fields required. '
            });
        if(vm.newtask.comment === ''){
          $('#commentContainer').addClass('has-error');
        }else{
          $('#commentContainer').removeClass('has-error');
        }
        if(vm.newtask.type === ''){
          $('#actionContainer .dropdown').addClass('exist-error');
        }else{
          $('#actionContainer .dropdown').removeClass('exist-error');
        }
        if((vm.newtask.result === '') && (vm.newtask.type ==='CALL')){
          $('#task-result').addClass('has-error');
        }else{
          $('#task-result').removeClass('has-error');
        }
      }else{
        if ((typeof vm.newtask.result === undefined) || (vm.newtask.result === '')){
            vm.newtask.result = 'SENT';
          }
          vm.newtask.motive = "motive";
          vm.newtask.requestUpdatedBy = store.get('admin_user').id;
          adminService.createTask(vm.newtask.id,'DRIVER',JSON.stringify(vm.newtask))
            .then(function(result){
              ngToast.create({
                className: 'success',
                content: 'Data Added to User.'
              });
              openDriverDetailFn(vm.currentDriver);
              getDrivers();
              cancelTaskFn();
            }, function(error){
              ngToast.create({
                className: 'danger',
                content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
              });
            });
          vm.newtask = {};
        }
    }

    function checkFrequencyFn(){
      if ($('#frequencyCheck').is(':checked')) {
        $('#frequencyApp').removeClass('hidden');
      }else{
        $('#frequencyApp').addClass('hidden');
      }
    }

    function addFrequencyFn(){
      var params = '';
      params += checkField(vm.newMoreInfo.inconsistentDataName,'inconsistency',"NAME");
      params += checkField(vm.newMoreInfo.inconsistentDataEmail,'inconsistency',"EMAIL");
      params += checkField(vm.newMoreInfo.inconsistentDataPhone,'inconsistency',"PHONE");
      params += checkField(vm.newMoreInfo.frequencyApp,'frequencyApp',vm.newMoreInfo.frequencyApp);
      for(var i = 0; i < vm.newMoreInfo.tag.length; i++){
        params += checkField(vm.newMoreInfo.tag[i],'tags',vm.newMoreInfo.tag[i]);
      }

      adminService.createFrequency(vm.newtask.id,'DRIVER',params)
        .then(function(result){
          ngToast.create({
            className: 'success',
            content: 'Data Added to User.'
          });
          getDrivers();
        }, function(error){
          ngToast.create({
            className: 'danger',
            content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
          });
        });
    }

    function checkField(field,bdfield,value){
      var text = '';
      if(typeof field !== 'undefined'){
        if(field){
          text = '&' + bdfield + '=' + value;
        }
      }
      return text;
    }

    function setFieldNull(field,value){
      var text = '';
      if(typeof field !== 'undefined'){
        if(field === value){
          text = '';
        }else{
          text = field;
        }
      }
      return text;
    }

    function editFrequencyFn(){
      $('#frequencyApp').prop("disabled",false);
      $('#tagSelect').prop("disabled",false);
      $('#inconsistentData-name').prop("disabled",false);
      $('#inconsistentData-email').prop("disabled",false);
      $('#inconsistentData-phone').prop("disabled",false);
      $('#frequency-buttons').removeClass("hidden");
      $('#edit-frequency').addClass("hidden");
      $('#cancelFrequency').addClass("hidden");
      $('#cancelEditFrequency').removeClass("hidden");
    }

    function cancelEditFrequencyFn(){
      openDriverDetailFn(vm.currentDriver);
    }

    function cancelFrequencyFn(){
      $('#formFrequency').find('select').prop('selectedIndex',0);
      $('#formFrequency').find('input').removeAttr('checked');
    }
  }
})();
