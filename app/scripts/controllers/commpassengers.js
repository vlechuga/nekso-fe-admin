(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:PassengersCtrl
   * @description
   * # PassengersCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('CommPassengersCtrl', commPassengersCtrl);

  function commPassengersCtrl($scope, $modal, adminService, blockUI, $filter, utilService, ngToast, store) {
    if (utilService.getUserPermissionBase('read:communication')) {
      return true;
    }

    var vm = this;

    vm.countryData=[];
    vm.categoryArr=[];
    vm.leaveArr=[];
    adminService.getSupportCategories()
    .then(function(data){
      vm.categoryArr=data;
    });
    adminService.getStopUsingReasons()
    .then(function(data){
      vm.leaveArr=data;
    });


    var searchFlag = false;
    vm.loading = {};
    vm.passengers = [];
    vm.totalPassengers = 0;
    vm.controls = {
      numPerPage: 10,
      currentPage: 1
    };
    vm.predicate = 'createdDate';
    vm.reverse = true;
    vm.filter = {
      states: undefined,
      country: undefined,
      searchText: '',
      tag: '',
      action: '',
      rides: '',
      date: {
        startDate: moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0),
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
    vm.order = orderFn;
    vm.clearSearchField = clearSearchFieldFn;
    vm.searchDrivers = searchDriversFn;
    vm.searchDriversOnEnter = searchDriversOnEnterFn;
    vm.getUserPermission = getUserPermissionFn;
    vm.exportToCsv = exportToCsvFn;
    vm.openPassengerDetail = openPassengerDetailFn;
    vm.addTaskView = addTaskViewFn;
    vm.selectAction = selectActionFn;
    vm.selectCategory = selectCategoryFn;
    vm.cancelTask = cancelTaskFn;
    vm.addTask = addTaskFn;
    vm.checkFrequency = checkFrequencyFn;
    vm.addFrequency = addFrequencyFn;
    vm.editFrequency = editFrequencyFn;
    vm.cancelEditFrequency = cancelEditFrequencyFn;
    vm.cancelFrequency = cancelFrequencyFn;
    vm.showCalendar = showCalendar;
    vm.openPassengerProfile = openPassengerProfileFn;

    $scope.$watch('vm.filter.searchText', function(newVal, oldVal){
      if(newVal !== oldVal){
        if(newVal === '' && searchFlag){
          searchFlag = false;
          vm.controls.currentPage = 1;
          getPassengers();
        }
      }
    });

    $scope.$watch('vm.controls.currentPage', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && newVal !== oldVal){
        getPassengers();
      }
    });

    $scope.$watch('[vm.controls.numPerPage, vm.filter.emailVerified, vm.filter.date, vm.filter.tag, vm.filter.action, vm.filter.rides]', function(newVal, oldVal){
      if(angular.isDefined(vm.filter.country) && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3] || newVal[4] !== oldVal[4] || newVal[5] !== oldVal[5])) {
        vm.controls.currentPage = 1;
        getPassengers();
      }
    }, true);

    $scope.$watch('vm.filter.states', function (newVal, oldVal) {
      if (newVal !== oldVal) {
          getPassengers();
      }
    }, true);

    function showCalendar(){
      angular.element('#calendar-input').triggerHandler('click');
    }

    function getUserPermissionFn(code){
      return utilService.getUserPermission(code);
    }

    function clearSearchFieldFn(){
      vm.filter.searchText = '';
      searchFlag = false;
      getPassengers();
    }

    function searchDriversFn(){
      searchFlag = true;
      getPassengers();
    }


    function searchDriversOnEnterFn(event){
      if(event.keyCode == 13){
        searchFlag = true;
        getPassengers();
      }
    }

    function orderFn(predicate) {
      vm.reverse = (vm.predicate === predicate) ? !vm.reverse : false;
      vm.predicate = predicate;
      getPassengers();
    }

    function getPassengers(){
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      var myBlock = blockUI.instances.get('passengersList');
      myBlock.start();
      adminService.getAllPassengers(vm.controls.numPerPage, vm.controls.currentPage - 1, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.rating, vm.filter.emailVerified, vm.filter.searchText,
        vm.filter.tag, vm.filter.action, vm.filter.rides, vm.filter.states, undefined, false)
        .then(function(passengers){
          for(var i = 0, len = passengers.data.length; i < len; i++){
            passengers.data[i].fullName = passengers.data[i].firstName + ' ' + passengers.data[i].lastName;
            if(angular.isDefined(passengers.data[i].corporation)){
              passengers.data[i].corporateImg = 'icon-corporate.png';
              console.log('hay imagen');
            }else{
              passengers.data[i].corporateImg = 'icon-empty.png';
              console.log('no hay');
            }
            passengers.data[i].roleImg = 'icon-empty.png';
            if(typeof passengers.data[i].tags !== 'undefined'){
              if(passengers.data[i].tags.indexOf("SECRETARY")>-1){
                passengers.data[i].roleImg = 'icon-secretary.png';
              }else if(passengers.data[i].tags.indexOf("PRESIDENT")>-1){
                passengers.data[i].roleImg = 'icon-president.png';
              }else if(passengers.data[i].tags.indexOf("EXECUTIVE")>-1){
                passengers.data[i].roleImg = 'icon-executive.png';
              }else if(passengers.data[i].tags.indexOf("DISPATCHER")>-1){
                passengers.data[i].roleImg = 'icon-dispatcher.png';
              }
              if(passengers.data[i].tags.indexOf("URBE")>-1){
                passengers.data[i].corporateImg = 'icon-urbe.png';
                console.log('es urbe');
              }
            }
            if(typeof passengers.data[i].memberSupport !== 'undefined'){
              passengers.data[i].memberSupport.totalSms = setFieldNull(passengers.data[i].memberSupport.totalSms, 0);
              passengers.data[i].memberSupport.totalEmail = setFieldNull(passengers.data[i].memberSupport.totalEmail,0);
              passengers.data[i].memberSupport.totalCall = setFieldNull(passengers.data[i].memberSupport.totalCall,0);
              passengers.data[i].memberSupport.totalTraining = setFieldNull(passengers.data[i].memberSupport.totalTraining,0);
            }
          }
          vm.passengers = passengers.data;
          vm.totalPassengers = passengers.total;
          myBlock.stop();
        }, function(error){
          if ((error.status == 401 || error.status == 403) && (error.data.code==618)) {
            vm.notAuthMsg = error.data.description;
          } else{
            ngToast.create({
              className: 'danger',
              content: 'Error processing your request. ' + error.status + ' - ' + error.statusText
            });
            myBlock.stop();
          }
        });
    }

    function exportToCsvFn(){
      vm.loading.export = true;
      var orderBy = (vm.reverse) ? '-' + vm.predicate : vm.predicate;
      return adminService.getAllPassengers(0, 0, orderBy,
        utilService.toStringDate(vm.filter.date.startDate), utilService.toStringDate(vm.filter.date.endDate),
        vm.filter.rating, vm.filter.emailVerified, vm.filter.searchText,
        vm.filter.tag, vm.filter.action, vm.filter.rides, vm.filter.states, undefined, false)
        .then(function(passengers){
          var toExport = [];
          for(var i = 0, len = passengers.data.length; i < len; i++){
            var passenger = passengers.data[i];
            var tmp = {};
            tmp.name = passenger.firstName + ' ' + passenger.lastName;
            tmp.email = passenger.email;
            tmp.phone = passenger.phone;
            tmp.createdDate = $filter('date')(new Date(passenger.createdDate), 'dd/MM/yyyy hh:mm a');
            tmp.country = passenger.registrationLocation.country;
            tmp.state = passenger.registrationLocation.state;
            tmp.completedRides = passenger.ridesCount;
            tmp.rating = passenger.rating;
            if(typeof passenger.memberSupport !== 'undefined'){
              tmp.totalCall = passenger.memberSupport.totalCall;
              tmp.totalEmail = passenger.memberSupport.totalEmail;
              tmp.totalSms = passenger.memberSupport.totalSms;
              tmp.totalTraining = passenger.memberSupport.totalTraining;
            }else{
              tmp.totalCall = 0;
              tmp.totalEmail = 0;
              tmp.totalSms = 0;
              tmp.totalTraining = 0;
            }
            if(typeof passenger.frequencyApp !== 'undefined'){
              tmp.frequencyApp = passenger.frequencyApp;
            }else{
             tmp.frequencyApp = '';
            }
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

    function openPassengerDetailFn(passenger){
      vm.currentPassenger = {};
      vm.currentPassenger = passenger;

      $('#details-view').removeClass('hidden');
      utilService.goToByScroll('user-selected');
      var myBlock = blockUI.instances.get('detailPassengersList');
      myBlock.start();
      vm.tasks = [];
      var data = {};
      adminService.getTasks(passenger.id, 'PASSENGER')
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
          vm.newtask.id = passenger.id;
          vm.newMoreInfo = {};
          vm.newMoreInfo.tag='';
          vm.newMoreInfo.frequencyAppNumber=0;
          var flag = false;
          if(typeof vm.currentPassenger.timesUsedPerFrequency !== 'undefined'){
            vm.newMoreInfo.frequencyAppNumber = vm.currentPassenger.timesUsedPerFrequency;
            flag = true;
          }
          if(typeof vm.currentPassenger.frequencyApp !== 'undefined'){
            vm.newMoreInfo.frequencyApp = vm.currentPassenger.frequencyApp;
            flag = true;
          }
          if(angular.isDefined(vm.currentPassenger.tags)){
            vm.newMoreInfo.tag = vm.currentPassenger.tags[0];
          }
          if(typeof vm.currentPassenger.inconsistentData !== 'undefined'){
            for(var x=0; x<vm.currentPassenger.inconsistentData.length; x++){
              if(vm.currentPassenger.inconsistentData[x] === 'NAME'){
                vm.newMoreInfo.inconsistentDataName = true;
                flag =  true;
              }else if(vm.currentPassenger.inconsistentData[x] === 'EMAIL'){
                vm.newMoreInfo.inconsistentDataEmail = true;
                flag =  true;
              }else if(vm.currentPassenger.inconsistentData[x] === 'PHONE'){
                vm.newMoreInfo.inconsistentDataPhone = true;
                flag =  true;
              }
            }
          }
          if(flag){
            $('#frequencyApp').prop("disabled",true);
            $('#usedTimes').prop("disabled",true);
            $('#tagSelect').prop("disabled",true);
            $('#inconsistentData-name').prop("disabled",true);
            $('#inconsistentData-email').prop("disabled",true);
            $('#inconsistentData-phone').prop("disabled",true);
            $('#frequency-buttons').addClass("hidden");
            $('#edit-frequency').removeClass("hidden");
          } else {
            $('#frequencyApp').prop("disabled",false);
            $('#usedTimes').prop("disabled",false);
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
          }
        });
    }

    function openPassengerProfileFn(passenger) {
      var passengerModalInstance = $modal.open({
        animate: true,
        templateUrl: '../../views/modals/passenger.html',
        size: 'sm',
        controller: 'PassengerModalCtrl',
        controllerAs: 'vm',
        resolve: {
          passenger: function () {
            return {id: passenger.id};
          },
          addSuspicious: function () {
            return false;
          },
          rideId: function () {
            return undefined;
          }
        }
      });
    }

    function addTaskViewFn(){
      $('#add-task-view').removeClass('hidden');
    }

    function selectActionFn(value, ico){
      $('#action').val(value);
      vm.newtask.type = value;
      if (value=='TRAINING') {
        $('#dropdownMenu1').html('<span><i class="material-icons">'+ico+'</i>Punto Nekso</span>');
      } else {
        $('#dropdownMenu1').html('<span><i class="material-icons">'+ico+'</i>' + value + '</span>');
      }
      if(value == 'CALL'){
        $('#task-result').removeClass('hidden');
      }else{
        $('#task-result').addClass('hidden');
      }
    }

    function selectCategoryFn(category){
      vm.newtask.category = category.id;
      $('#dropdownMenu2').html('<span>'+category.name+'</span>');
    }

    function cancelTaskFn(){
      $('#formAction').find('input').val('');
      $('#formAction').find('textarea').val('');
      $('#dropdownMenu1').html('Action <span class="caret"></span>');
      $('#dropdownMenu2').html('Category <span class="caret"></span>');
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
          $('#actionContainer #dropdownMenu1').addClass('exist-error');
        }else{
          $('#actionContainer #dropdownMenu1').removeClass('exist-error');
        }
        if(vm.newtask.category === ''){
          $('#actionContainer #dropdownMenu2').addClass('exist-error');
        }else{
          $('#actionContainer #dropdownMenu2').removeClass('exist-error');
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
          adminService.createTask(vm.newtask.id,'PASSENGER',JSON.stringify(vm.newtask))
            .then(function(result){
              ngToast.create({
                className: 'success',
                content: 'Data Added to User.'
              });
              openPassengerDetailFn(vm.currentPassenger);
              getPassengers();
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
      params += checkField(vm.newMoreInfo.frequencyApp,'frequency',vm.newMoreInfo.frequencyApp);
      params += checkField(vm.newMoreInfo.frequencyAppNumber,'times_used',vm.newMoreInfo.frequencyAppNumber);
      adminService.createFrequency(vm.newtask.id,'PASSENGER',params)
        .then(function(result){
          ngToast.create({
            className: 'success',
            content: 'Data Added to User.'
          });
          getPassengers();
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
      $('#usedTimes').prop("disabled",false);
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
      openPassengerDetailFn(vm.currentPassenger);
    }

    function cancelFrequencyFn(){
      $('#formFrequency').find('select').prop('selectedIndex',0);
      $('#formFrequency').find('input').removeAttr('checked');
    }
  }
})();
