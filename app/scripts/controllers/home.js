(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:HomeCtrl
   * @description
   * # HomeCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('HomeCtrl', homeCtrl);

  function homeCtrl($scope, $filter, adminService, utilService, $timeout, $q) {
    if (utilService.getUserPermissionBase('read:overview')) {
      return true;
    }

    var vm = this;
    var date = $filter('date');

    vm.filter = {};
    vm.date = {
      startDate: moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0),
      endDate: moment().hours(23).minutes(59).seconds(59).milliseconds(999),
      opts: {
        timePicker: false,
        timePicker24Hour: false,
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
          'Last 90 Days': [moment().subtract(90, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
          'All': [moment().year(2015).month(10).days(1).hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)]
        }
      }
    };
    vm.dateTags = {
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
    };
    vm.counter = {
      drivers: 0,
      passengers: 0,
      completedRides: 0,
      passengersToday: 0,
      ridesToday: 0
    };
    vm.addSeparator = addSeparatorFn;
    vm.search = searchFn;

    $("#btn_openEndCalendar").on("click", function () {
      $("#calendar-input").trigger("click");
      console.log('should happen');
    });

    $("#btn_openEndCalendar1").on("click", function () {
      $("#calendar-input1").trigger("click");
      console.log('should happen');
    });

    function searchFn() {
      getCounts();
      getRidesLineChartData();
      getRidesLineSourceChartData();
      getDriversPieChartData();
      getUsersLineChartData();
    }

    function getCounts() {
      adminService.getCounts(vm.filter.states)
        .then(function (data) {
          for (var i = 0; i < data.length; i++) {
            if (data[i].id === "DRIVERS") {
              vm.counter.drivers = data[i].count;
            } else if (data[i].id === "PASSENGERS") {
              vm.counter.passengers = data[i].count;
            } else if (data[i].id === "RIDES") {
              vm.counter.completedRides = data[i].count;
            } else if (data[i].id === "PASSENGERS_TODAY") {
              vm.counter.passengersToday = data[i].count;
            } else if (data[i].id === "RIDES_TODAY") {
              vm.counter.ridesToday = data[i].count;
            }
          }
        }, function (error) {
          console.log(error);
        });
    }

    function getStatesPieChartData() {
      adminService.getDriversCounts(vm.filter.state).then(function (data) {
        // console.log(data);
        var zulia;
        var df;
        var miranda;
        var pieChartData = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].id == "IN_REVIEW") {
            var review = data[i].count;
            pieChartData.push({"label": "In review", "value": review, color: '#ff9800'});
          } else if (data[i].id == "SUSPENDED") {
            var suspended = data[i].count;
            pieChartData.push({"label": "Suspended", "value": suspended, color: '#414141'});
          } else if (data[i].id == "REJECTED") {
            var rejected = data[i].count;
            pieChartData.push({"label": "Rejected", "value": rejected, color: '#e51c23'});
          } else if (data[i].id == "APPROVAL_EXPIRED") {
            var expired = data[i].count;
            pieChartData.push({"label": "Approval expired", "value": expired, color: '#9c27b0'});
          } else if (data[i].id == "PENDING_RESIGNATION") {
            var pending = data[i].count;
            pieChartData.push({"label": "Pending reassignment", "value": pending, color: '#1f77b4'});
          } else if (data[i].id == "OK") {
            var ok = data[i].count;
            pieChartData.push({"label": "Approved", "value": ok, color: '#4caf50'});
          } else {
          }
        }
        utilService.renderPieGraph('rideStatePieChart', pieChartData);
      });

    }

    function getDriversPieChartData() {
      var from = utilService.toStringDate(vm.date.startDate);
      var to = utilService.toStringDate(vm.date.endDate);

      adminService.getDriverTimeSeriesByCountry(from, to, 'OK').then(function (data) {
        // console.log(data);
        var chartData = [];
        var obj = {};
        obj.key = 'Total';
        // obj.color='#f00';
        obj.values = [];

        for (var i = 0; i < data.length; i++) {
          if (data[i].id) {
            obj.values.push({"label": data[i].id, "value": data[i].count, color: '#ff9800'});
          } else {
            obj.values.push({"label": "Unknown", "value": data[i].count, color: '#ff9800'});
          }
        }

        chartData.push(obj);

        /*var pieChartData = [
         {
         "label": "In review",
         "value" : review,
         color: '#ff9800'
         } ,
         {
         "label": "Approved",
         "value" : ok,
         color: '#4caf50'
         } ,
         {
         "label": "Suspended",
         "value" : suspended,
         color: '#414141'
         } ,
         {
         "label": "Approval expired",
         "value" : expired,
         color: '#9c27b0'
         } ,
         {
         "label": "Rejected",
         "value" : rejected,
         color: '#e51c23'
         },
         {
         "label": "Pending reassignment",
         "value" : pending
         }
         ];*/

        utilService.renderHorizontalBarGraph('driversStatusPieChart', chartData);
      });
    }

    function getCompletedRidesStatesPieChartData() {
      var distritoCapital;
      var miranda;
      var zulia;

      // vm.statesArr
      vm.pieChartDataStates = [];
      vm.pieChartDataCountry = [];
      var promises = [];
      for (var i = 0; i < vm.statesArr.length; i++) {
        var name = vm.statesArr[i].name;
        var country = vm.statesArr[i].country;
        promises.push(getCountsByStates(name, country));
      }
      $q.all(promises).then(function () {
        for (var key in vm.pieChartDataStates) {
          vm.pieChartDataCountry.push({"label": key, "value": vm.pieChartDataStates[key], color: getRandomColor()});
        }
        utilService.renderPieGraph('completedRidesStatesPieChart', vm.pieChartDataCountry);
      });
    }

    function getRidesLineSourceChartData() {
      var from = utilService.toStringDate(vm.date.startDate);
      var to = utilService.toStringDate(vm.date.endDate);

      var oneDay = 24 * 60 * 60 * 1000;
      var dif = +moment(to) - +moment(from);
      var isOneDay = false;
      var dateFormat = 'YYYY-MM-DD';
      var dateAdd = 'd';
      var nvd3TimeFormat = '%b %d';

      var group_by;
      if (dif > oneDay) {
        group_by = 'SOURCE';
        isOneDay = false;
        dateFormat = 'YYYY-MM-DD';
        dateAdd = 'd';
        nvd3TimeFormat = '%b %d';
      } else {
        group_by = ['SOURCE', 'HOUR'];
        isOneDay = true;
        dateFormat = 'YYYY-MM-DD HH';
        dateAdd = 'h';
        nvd3TimeFormat = '%-I:%M%p';
      }

      adminService.getRidesTimeSeries(from, to, group_by, vm.filter.states, 'COMPLETED')
        .then(function (response) {
          var range = {
            min: from,
            max: to
          };

          var standard = [];
          var qr = [];
          var corporate_guests = [];
          var corporate_employees = [];

          response.map(function (data) {
            var tmp = {
              id: data.id.date,
              count: data.count
            };
            if (isOneDay) {
              tmp.id += ' ' + data.id.hour;
            }
            switch (data.id.source) {
              case '':
                standard.push(tmp);
                break;
              case null:
                standard.push(tmp);
                break;
              case undefined:
                standard.push(tmp);
                break;
              case 'STANDARD':
                standard.push(tmp);
                break;
              case 'QR':
                qr.push(tmp);
                break;
              case 'CORPORATE_GUESTS':
                corporate_guests.push(tmp);
                break;
              case 'CORPORATE_EMPLOYEES':
                corporate_employees.push(tmp);
                break;
              default:
                break;
            }
          });
          var overTimeGraph = [
            {
              "key": "Standard",
              "values": utilService.nvd3Parse(standard, range, dateFormat, dateAdd),
              color: '#3c844e',
              area: false
            },
            {
              "key": "QR",
              "values": utilService.nvd3Parse(qr, range, dateFormat, dateAdd),
              color: '#bc2727',
              area: false
            },
            {
              "key": "Corporate guests",
              "values": utilService.nvd3Parse(corporate_guests, range, dateFormat, dateAdd),
              color: '#ea1ecf',
              area: false
            },
            {
              "key": "Corporate employees",
              "values": utilService.nvd3Parse(corporate_employees, range, dateFormat, dateAdd),
              color: '#414141',
              area: false
            }
          ];

          utilService.renderGraph('rideSourceOverviewChart', overTimeGraph, undefined, nvd3TimeFormat);


        }, function (error) {
          console.log(error);
        });

    }

    function getRidesLineChartData() {
      var from = utilService.toStringDate(vm.date.startDate);
      var to = utilService.toStringDate(vm.date.endDate);

      var oneDay = 24 * 60 * 60 * 1000;
      var dif = +moment(to) - +moment(from);
      var isOneDay = false;
      var dateFormat = 'YYYY-MM-DD';
      var dateAdd = 'd';
      var nvd3TimeFormat = '%b %d';

      var group_by;
      if (dif > oneDay) {
        group_by = 'STATUS';
        isOneDay = false;
        dateFormat = 'YYYY-MM-DD';
        dateAdd = 'd';
        nvd3TimeFormat = '%b %d';
      } else {
        group_by = ['STATUS', 'HOUR'];
        isOneDay = true;
        dateFormat = 'YYYY-MM-DD HH';
        dateAdd = 'h';
        nvd3TimeFormat = '%-I:%M%p';
      }

      adminService.getRidesTimeSeries(from, to, group_by, vm.filter.states)
        .then(function (allResponse) {
          var range = {
            min: from,
            max: to
          };

          var completed = [];
          var cancelled = [];
          var no_response = [];
          var closed = [];
          var rejected = [];
          var ongoing = [];
          var all = [];

          allResponse.map(function (data) {
            var tmp = {
              id: data.id.date,
              count: data.count
            };
            if (isOneDay) {
              tmp.id += ' ' + data.id.hour;
            }
            all.push(tmp);
            switch (data.id.status) {
              case 'COMPLETED':
                completed.push(tmp);
                break;
              case 'CANCELLED':
                cancelled.push(tmp);
                break;
              case 'NO_RESPONSE':
                no_response.push(tmp);
                break;
              case 'CLOSED':
                closed.push(tmp);
                break;
              case 'REJECTED':
                rejected.push(tmp);
                break;
              case 'ONGOING':
                ongoing.push(tmp);
                break;
              default:
                break;
            }
          });

          var overTimeGraph = [
            {
              "key": "Completed",
              "values": utilService.nvd3Parse(completed, range, dateFormat, dateAdd),
              color: '#3c844e',
              area: false
            },
            {
              "key": "Cancelled",
              "values": utilService.nvd3Parse(cancelled, range, dateFormat, dateAdd),
              color: '#bc2727',
              area: false
            },
            {
              "key": "No Response",
              "values": utilService.nvd3Parse(no_response, range, dateFormat, dateAdd),
              color: '#ea1ecf',
              area: false
            },
            {
              "key": "Dismiss by passenger",
              "values": utilService.nvd3Parse(closed, range, dateFormat, dateAdd),
              color: '#414141',
              area: false
            },
            {
              "key": "Reject by driver",
              "values": utilService.nvd3Parse(rejected, range, dateFormat, dateAdd),
              color: '#c99e5a',
              area: false
            },
            {
              "key": "On Going (Real Time)",
              "values": utilService.nvd3Parse(ongoing, range, dateFormat, dateAdd),
              color: '#d6e24a',
              area: false
            },
            {
              "key": "Total",
              "values": utilService.nvd3Parse(all, range, dateFormat, dateAdd),
              color: '#1380fb'
            }
          ];

          utilService.renderGraph('ridesOverviewChart', overTimeGraph, undefined, nvd3TimeFormat);


        }, function (error) {
          console.log(error);
        });
    }

    function getUsersLineChartData() {
      var from = utilService.toStringDate(vm.date.startDate);
      var to = utilService.toStringDate(vm.date.endDate);

      var oneDay = 24 * 60 * 60 * 1000;
      var dif = +moment(to) - +moment(from);
      var isOneDay = false;
      var dateFormat = 'YYYY-MM-DD';
      var dateAdd = 'd';
      var nvd3TimeFormat = '%b %d';

      var group_by;
      if (dif > oneDay) {
        group_by = undefined;
        isOneDay = false;
        dateFormat = 'YYYY-MM-DD';
        dateAdd = 'd';
        nvd3TimeFormat = '%b %d';
      } else {
        group_by = 'HOUR';
        isOneDay = true;
        dateFormat = 'YYYY-MM-DD HH';
        dateAdd = 'h';
        nvd3TimeFormat = '%-I:%M%p';
      }

      adminService.getDriversTimeSeries(from, to, group_by, vm.filter.states)
        .then(function (drivers) {
          adminService.getPassengersTimeSeries(from, to, group_by, vm.filter.states)
            .then(function (passengers) {
              var range = {
                min: from,
                max: to
              };

              var allPassengers = passengers.map(function (passenger) {
                var tmp = {
                  id: passenger.id.date,
                  count: passenger.count
                };
                if (isOneDay) {
                  tmp.id += ' ' + passenger.id.hour;
                } else {
                  tmp.id = passenger.id;
                }
                return tmp;
              });

              var allDrivers = drivers.map(function (driver) {
                var tmp = {
                  id: driver.id.date,
                  count: driver.count
                };
                if (isOneDay) {
                  tmp.id += ' ' + driver.id.hour;
                } else {
                  tmp.id = driver.id;
                }
                return tmp;
              });

              var overTimeGraph = [
                {
                  "key": "Passengers",
                  "values": utilService.nvd3Parse(allPassengers, range, dateFormat, dateAdd),
                  area: false
                },
                {
                  "key": "Drivers",
                  "values": utilService.nvd3Parse(allDrivers, range, dateFormat, dateAdd),
                  area: false
                }
              ];
              utilService.renderGraph('usersOverviewChart', overTimeGraph, undefined, nvd3TimeFormat);
            }, function (error) {
              console.log(error);
            });
        }, function (error) {
          console.log(error);
        });
    }

    function addSeparatorFn(number) {
      return utilService.addSeparator(number);
    }

    function getCountsByStates(state, country) {
      return adminService.getAllRidesByStatesCount(state)
        .then(function (count) {
            if (vm.pieChartDataStates[country]) {
              vm.pieChartDataStates[country] += count;
            } else {
              vm.pieChartDataStates[country] = count;
            }
          }, function (error) {
            console.log(error);
          }
        );
    }

    function getRandomColor() {
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    $scope.$on("$destroy", function () {
        $('.nvtooltip').remove();
      }
    );
  }
})();
