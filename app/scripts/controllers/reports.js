(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name neksoFeAdmindashboardApp.controller:DriversCtrl
   * @description
   * # DriversCtrl
   * Controller of the neksoFeAdmindashboardApp
   */
  angular.module('neksoFeAdmindashboardApp')
    .controller('ReportsCtrl', reportsCtrl);

  function reportsCtrl($scope, adminService, $modal, blockUI, $filter, utilService, ngToast, $timeout, $http) {
    if (utilService.getUserPermissionBase('read:rides')) {
      return true;
    }

    var vm = this;
    var initializing = true;
    var reportMap;
    var heatmap;

    vm.filter = {
      promotionCode: undefined,
      date: {
        startDate: moment().hours(0).minutes(0).seconds(0).milliseconds(0),
        endDate: moment().hours(23).minutes(59).seconds(59).milliseconds(999),
        opts: {
          dateLimit: {
            "months": 6
          },
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
          }
        }
      }
    };

    mainDelay();
    function mainDelay() {
      if (!window.google) {
        $timeout(mainDelay, 100);
        return true;
      }
      vm.statesArr = utilService.getUserPermissionStates() || [];
      vm.states = {};
      vm.states.country = [];
      vm.heatMapFilter = {};
      vm.mapFilter = {};
      adminService.getAllStates()
        .then(function (data) {
          var tmp = vm.statesArr;
          vm.statesArr = [];
          vm.states.data = data;
          if (tmp.length == 0) {
            for (var j = 0; j < data.length; j++) {
              vm.statesArr.push(data[j]);
            }
            for (var i = 0; i < vm.statesArr.length; i++) {
              if (vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country) == -1) {
                vm.states.country.push(vm.statesArr[i].country);
              }
            }
          }
          else {
            for (var i = 0; i < tmp.length; i++) {
              for (var j = 0; j < data.length; j++) {
                if (data[j].name == tmp[i]) {
                  vm.statesArr.push(data[j]);
                }
              }
            }
            for (var i = 0; i < vm.statesArr.length; i++) {
              if (vm.statesArr[i].country && vm.states.country.indexOf(vm.statesArr[i].country) == -1) {
                vm.states.country.push(vm.statesArr[i].country);
              }
            }
          }
          vm.loadingMultiSelect = true;
          $timeout(function () {
            $('select[multiple="multiple"]').multipleSelect("refresh");
          }, 10);

          // getHeatmapChartFn();
        });
      vm.loadingMultiSelect = false;
      vm.mapDataLoading = false;
      vm.heatmapDataLoading = false;

      vm.getCsvUrl = getCsvUrlFn;
      vm.getDirectCsv = getDirectCsvFn;
      vm.reportName = 'referrals';

      vm.getHeatMapChartTitle = getHeatMapChartTitleFn;
      vm.initReportMap = initReportMapFn;

      vm.locationType = 'AREA';
      var map;
      vm.polygons = [];
      var lat = 10.6638617;
      var lng = -71.6020553;
      var location_autocomplete = undefined;
      vm.resetPolygon = resetPolygonFn;
      vm.testPolygon = testPolygonFn;
      vm.addPolygon = addPolygonFn;
      vm.removePolygon = removePolygonFn;
      vm.getPromotionCodesReport = getPromotionCodesReportFn;

      getCountriesFn();

      var ranges = {
        '1': [moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().subtract(1, 'days').hours(23).minutes(59).seconds(59).milliseconds(999)],
        '2': [moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)],
        '3': [moment().subtract(30, 'days').hours(0).minutes(0).seconds(0).milliseconds(0), moment().hours(23).minutes(59).seconds(59).milliseconds(999)]
      };

      function getDirectCsvFn(time, baseUrl, status) {
        var url = getCsvUrlFn(time, baseUrl, status);
        if (testPolygonFn().length === 0) {
          ngToast.create({
            className: 'warning',
            content: 'Select a location with a polygon.'
          });
        } else {
          adminService.getExportDirect(url, testPolygonFn());
        }
      }

      function getCsvUrlFn(time, baseUrl, status) {
        if (time === 4) {
          var from = vm.filter.date.startDate;
          var to = vm.filter.date.endDate;
          return adminService.getExportData(utilService.toStringDate(from), utilService.toStringDate(to), baseUrl, status);
        } else {
          var from = ranges[time][0];
          var to = ranges[time][1];
          return adminService.getExportData(utilService.toStringDate(from), utilService.toStringDate(to), baseUrl, status);
        }
      }

      function getCountriesFn() {
        adminService.getCountries()
          .then(function (countries) {
            vm.countries = countries;
          }, function (error) {
            console.log(error);
          });
      }

      function initMap() {

        var myLatLng = new google.maps.LatLng(lat, lng);

        if (!map) {
          map = new google.maps.Map(document.getElementById('promotion-map'), {
            zoom: 12,
            center: myLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            disableDoubleClickZoom: true,
            zoomControl: true
          });

          var options = {
            componentRestrictions: {
              country: JSON.parse(vm.promotion.criteria.country).iso.toLowerCase()
            }
          };

          var locationinput = document.getElementById('promotion-location-input');
          location_autocomplete = new google.maps.places.Autocomplete(locationinput, options);
          location_autocomplete.addListener('place_changed', function () {
            var place = location_autocomplete.getPlace();
            if (!place.geometry) {
              window.alert("Autocomplete's returned place contains no geometry");
              return;
            }
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            lat = place.geometry.location.lat();
            lng = place.geometry.location.lng();
          });

          $timeout(function () {
            google.maps.event.trigger(map, 'resize');
          }, 100);
        }
      }

      $scope.$watch('vm.promotion.criteria.country', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if (angular.isDefined(newVal)) {
            $timeout(initMap, 100);
            if (angular.isDefined(location_autocomplete)) {
              location_autocomplete.setComponentRestrictions({
                country: JSON.parse(newVal).iso.toLowerCase()
              });
            }
          }
        }
      });

      function getCountryStatesFn(countryIso) {
        adminService.getStatesByCountry(countryIso)
          .then(function (states) {
            vm.countryStates = states;
            setTimeout(function () {
              $('select[multiple="multiple"]').multipleSelect("refresh");
            }, 10);
          }, function (error) {
            console.log(error);
          });
      }

      function addPolygonFn(latitude, longitude) {
        if (angular.isDefined(latitude)) {
          lat = latitude;
        }
        if (angular.isDefined(longitude)) {
          lng = longitude;
        }

        var coords = [
          new google.maps.LatLng(lat, lng),
          new google.maps.LatLng(lat + .001, lng + .001),
          new google.maps.LatLng(lat, lng + .001),
          new google.maps.LatLng(lat - .001, lng)
        ];

        var polygonColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

        // Styling & Controls
        var polygon = new google.maps.Polygon({
          paths: coords,
          draggable: true, // turn off if it gets annoying
          editable: true,
          strokeColor: polygonColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: polygonColor,
          fillOpacity: 0.35,
          map: map
        });

        // polygon.addListener('mouseover', function(event){
        //   console.log(this);
        // });

        vm.polygons.push(polygon);
        document.getElementById('promotion-location-input').value = '';
        document.getElementById('promotion-location-input').focus();
        // google.maps.event.addListener(myPolygon, "dragend", getPolygonCoords);
        // google.maps.event.addListener(myPolygon.getPath(), "insert_at", getPolygonCoords);
        // google.maps.event.addListener(myPolygon.getPath(), "remove_at", getPolygonCoords);
        // google.maps.event.addListener(myPolygon.getPath(), "set_at", getPolygonCoords);
      }

      function resetPolygonFn() {
        for (var i = 0; i < vm.polygons.length; i++) {
          vm.polygons[i].setMap(null);
        }
        vm.polygons = [];
      }

      function removePolygonFn(idx) {
        idx.setMap(null);
        vm.polygons.splice(vm.polygons.indexOf(idx), 1);
      }

      function testPolygonFn() {
        if (vm.locationType === 'AREA') {
          var location = [];
          for (var i = 0; i < vm.polygons.length; i++) {
            var polygon = vm.polygons[i];
            var polygonCoordinates = [];
            for (var j = 0; j < polygon.getPath().getLength(); j++) {
              var position = polygon.getPath().getAt(j).toUrlValue(5).split(',');
              polygonCoordinates.push([position[0], position[1]]);
            }
            location.push(polygonCoordinates);
          }

          // tmp.criteria.location = location;
          console.log(location);
          return location;
        }
      }

      $scope.$watch('vm.reportName', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if(vm.reportName==='coupon_code_drivers' || vm.reportName==='coupon_code_passengers'){
            vm.filter.promotionCode = undefined;
            vm.dataSourcePromotionCodes = [];
            getPromotionCodesByRole();
          }
        }
      });

      $scope.$watch('vm.filter.date', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if(vm.reportName==='coupon_code_drivers' || vm.reportName==='coupon_code_passengers'){
            vm.filter.promotionCode = undefined;
            vm.dataSourcePromotionCodes = [];
            getPromotionCodesByRole();
          }
        }
      });

      $scope.$watch('vm.heatMapFilter.country', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $timeout(function () {
            $('#heatMapFilter_states').multipleSelect("refresh");
          }, 100);
        }
      });

      $scope.$watch('[vm.heatMapFilter.state, vm.heatMapFilter.status]', function (newVal, oldVal) {
        if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1]) {
          if ((angular.isDefined(newVal[0]) && newVal[0].length > 0) && (angular.isDefined(newVal[1]) && newVal[1] !== '')) {
            if (angular.isDefined(heatMapChart)) {
              updateHeatMapChartFn();
            } else {
              getHeatMapChartFn();
            }
          }
        }
      }, true);

      $scope.$watch('vm.mapFilter.country', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $timeout(function () {
            $('#mapFilter_states').multipleSelect("refresh");
          }, 100);
        }
      });

      $scope.$watch('[vm.mapFilter.state, vm.mapFilter.status]', function (newVal, oldVal) {
        if (initializing) {
          $timeout(function () {
              initializing = false;
            }, 200
          );
        } else {
          if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1]) {
            if ((angular.isDefined(newVal[0]) && newVal[0].length > 0) && (angular.isDefined(newVal[1]) && newVal[1] !== '')) {
              if (angular.isDefined(heatmap)) {
                updateMapFn();
              } else {
                getMapDataFn();
              }
            }
          }
        }

      }, true);

      var heatMapChart;

      function getHeatMapChartFn() {
        vm.heatmapDataLoading = true;
        var from = moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0);
        var to = moment().hours(23).minutes(59).seconds(59).milliseconds(999);

        adminService.getRidesTimeSeries(utilService.toStringDate(from), utilService.toStringDate(to), 'HOUR', vm.heatMapFilter.state, vm.heatMapFilter.status)
          .then(function (response) {
            var range = {
              min: utilService.toStringDate(from),
              max: utilService.toStringDate(to)
            };

            var initialChartData = response.map(function (data) {
              return {
                id: data.id.date + ' ' + data.id.hour,
                count: data.count
              };
            });

            var margin = {top: 50, right: 0, bottom: 100, left: 30},
              width = 960 - margin.left - margin.right,
              height = 430 - margin.top - margin.bottom,
              gridSize = Math.floor(width / 24),
              legendElementWidth = gridSize * 2,
              buckets = 9,
              colors = ["#ffcce0", "#ff99c2", "#ff66a3", "#ff3385", "#ff0066"],
              days = utilService.getHeatMapChartLabels({min: from, max: to}),
              times = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];

            var svg = d3.select("#heatMapChart").append("svg")
              .attr("width", width + 80 + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + 80 + "," + margin.top + ")");

            var dayLabels = svg.selectAll(".dayLabel")
              .data(days)
              .enter().append("text")
              .text(function (d) {
                return d;
              })
              .attr("x", 0)
              .attr("y", function (d, i) {
                return i * gridSize;
              })
              .style("text-anchor", "end")
              .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
              .attr("class", function (d, i) {
                return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis");
              });

            var timeLabels = svg.selectAll(".timeLabel")
              .data(times)
              .enter().append("text")
              .text(function (d) {
                return d;
              })
              .attr("x", function (d, i) {
                return i * gridSize;
              })
              .attr("y", 0)
              .style("text-anchor", "middle")
              .attr("transform", "translate(" + gridSize / 2 + ", -6)")
              .attr("class", function (d, i) {
                return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis");
              });

            var data = utilService.fillDataHeatMapChart(initialChartData, range, 'YYYY-MM-DD HH', 'h');

            heatMapChart = function (data) {
              var colorScale = d3.scale.quantile()
                .domain([0, buckets - 1, d3.max(data, function (d) {
                  return d.count > 0 ? d.count : 1;
                })])
                .range(colors);

              var cards = svg.selectAll(".hour")
                .data(data, function (d) {
                  return days.indexOf(moment(d.date).format('YYYY-MM-DD')) + ':' + moment(d.date).format('HH');
                });

              cards.append("title");

              cards.enter().append("rect")
                .attr("x", function (d) {
                  return (moment(d.date).format('HH')) * gridSize;
                })
                .attr("y", function (d) {
                  return (days.indexOf(moment(d.date).format('YYYY-MM-DD'))) * gridSize;
                })
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("class", "hour bordered")
                .attr("width", gridSize)
                .attr("height", gridSize)
                .style("fill", colors[0])
                .attr('data-title', function (d) {
                  return 'Rides : ' + d.count;
                });

              cards.transition().duration(1000)
                .style("fill", function (d) {
                  return colorScale(d.count);
                });

              svg.selectAll("rect").append('title')
                .text(function (d) {
                  return 'Rides : ' + d.count;
                });

              cards.exit().remove();

              var legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), function (d) {
                  return d;
                });

              legend.enter().append("g")
                .attr("class", "legend");

              legend.append("rect")
                .attr("x", function (d, i) {
                  return legendElementWidth * i;
                })
                .attr("y", height + margin.left)
                .attr("width", legendElementWidth)
                .attr("height", gridSize / 2)
                .style("fill", function (d, i) {
                  return colors[i];
                });

              legend.append("text")
                .attr("class", "mono axis")
                .text(function (d) {
                  return "≥ " + Math.round(d);
                })
                .attr("x", function (d, i) {
                  return legendElementWidth * i;
                })
                .attr("y", height + margin.left + gridSize);

              legend.exit().remove();
            };

            heatMapChart(data);
            vm.heatmapDataLoading = false;
          }, function (error) {
            vm.heatmapDataLoading = false;
          });
      }

      function updateHeatMapChartFn() {
        vm.heatmapDataLoading = true;
        var from = moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0);
        var to = moment().hours(23).minutes(59).seconds(59).milliseconds(999);

        adminService.getRidesTimeSeries(utilService.toStringDate(from), utilService.toStringDate(to), 'HOUR', vm.heatMapFilter.state, vm.heatMapFilter.status)
          .then(function (response) {
            var range = {
              min: utilService.toStringDate(from),
              max: utilService.toStringDate(to)
            };

            var initialChartData = response.map(function (data) {
              return {
                id: data.id.date + ' ' + data.id.hour,
                count: data.count
              };
            });
            var data = utilService.fillDataHeatMapChart(initialChartData, range, 'YYYY-MM-DD HH', 'h');
            heatMapChart(data);
            vm.heatmapDataLoading = false;
          }, function (error) {
            vm.heatmapDataLoading = false;
          });
      }

      function getHeatMapChartTitleFn() {
        var title = 'ride requests';
        switch (vm.filter.status) {
          case '':
            title = 'ride requests';
            break;
          case 'ALL':
            title = 'ride requests';
            break;
          case 'CANCELLED':
            title = 'cancelled rides';
            break;
          case 'CLOSED':
            title = 'closed rides';
            break;
          case 'COMPLETED':
            title = 'completed rides';
            break;
          case 'NO_RESPONSE':
            title = 'no response rides';
            break;
          case 'ONGOING':
            title = 'ongoing rides';
            break;
          case 'REJECTED':
            title = 'rejected rides';
            break;
          case 'REQUESTED':
            title = 'requested rides';
            break;
          default:
            break;
        }
        return title;
      }

      function initReportMapFn() {
        $('#reports-map').css('height', ($('#tabs').outerHeight() - $('.footer').outerHeight()));
        if (angular.isUndefined(reportMap)) {
          reportMap = new google.maps.Map(document.getElementById('reports-map'), {
            zoom: 8,
            center: {
              lat: 10.6638617,
              lng: -71.6020553
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            disableDoubleClickZoom: true,
            zoomControl: true
          });

          $timeout(function () {
            google.maps.event.trigger(reportMap, 'resize');
          }, 100);

        }
        else {
          updateMapFn();
        }
      }

      function getMapDataFn() {
        vm.mapDataLoading = true;
        var startDate = moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0);
        var endDate = moment().hours(23).minutes(59).seconds(59).milliseconds(999);

        adminService.getAllRides(undefined, undefined, undefined, utilService.toStringDate(startDate), utilService.toStringDate(endDate), vm.mapFilter.status, undefined, undefined, undefined, undefined, undefined, undefined, vm.mapFilter.state, undefined, true)
          .then(function (response) {
            // Add some markers to the map.
            // Note: The code uses the JavaScript Array.prototype.map() method to
            // create an array of markers based on a given "locations" array.
            // The map() method here has nothing to do with the Google Maps API.
            var markers = response.data.map(function (ride) {
              return {
                lat: ride.rideInfo.passengerPickup.lat.toFixed(6),
                lng: ride.rideInfo.passengerPickup.lon.toFixed(6),
                count: 1
              };
            });

            heatmap = new HeatmapOverlay(reportMap,
              {
                // radius should be small ONLY if scaleRadius is true (or small radius is intended)
                "radius": 5,
                "maxOpacity": 0.6,
                // scales the radius based on map zoom
                "scaleRadius": false,
                // if set to false the heatmap uses the global maximum for colorization
                // if activated: uses the data maximum within the current map boundaries
                //   (there will always be a red spot with useLocalExtremas true)
                "useLocalExtrema": true,
                // which field name in your data represents the latitude - default "lat"
                latField: 'lat',
                // which field name in your data represents the longitude - default "lng"
                lngField: 'lng',
                // which field name in your data represents the data value - default "value"
                valueField: 'count'
              }
            );
            heatmap.setData({
              max: 8,
              data: markers
            });
            vm.mapDataLoading = false;
          }, function (error) {
            vm.mapDataLoading = false;
          });
      }

      function updateMapFn() {
        vm.mapDataLoading = true;
        var startDate = moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0);
        var endDate = moment().hours(23).minutes(59).seconds(59).milliseconds(999);

        adminService.getAllRides(undefined, undefined, undefined, utilService.toStringDate(startDate), utilService.toStringDate(endDate), vm.mapFilter.status, undefined, undefined, undefined, undefined, undefined, undefined, vm.mapFilter.state, undefined, true)
          .then(function (response) {
            // Add some markers to the map.
            // Note: The code uses the JavaScript Array.prototype.map() method to
            // create an array of markers based on a given "locations" array.
            // The map() method here has nothing to do with the Google Maps API.
            var markers = response.data.map(function (ride) {
              return {
                lat: ride.rideInfo.passengerPickup.lat.toFixed(6),
                lng: ride.rideInfo.passengerPickup.lon.toFixed(6),
                count: 1
              };
            });
            heatmap.setData({
              max: 8,
              data: markers
            });
            vm.mapDataLoading = false;
          }, function (error) {
            vm.mapDataLoading = false;
          });
      }

      function getPromotionCodesByRole() {
        vm.promotionCodesLoading = true;
        var from = vm.filter.date.startDate;
        var to = vm.filter.date.endDate;
        var role = (vm.reportName === 'coupon_code_drivers') ? 'DRIVER' : (vm.reportName === 'coupon_code_passengers') ? 'PASSENGER' : '';

        var myBlock = blockUI.instances.get('reportsList');
        myBlock.start();
        adminService.getPromotionCodesByRole(utilService.toStringDate(from), utilService.toStringDate(to), role)
          .then(function (response) {
            vm.dataSourcePromotionCodes = response;
            vm.promotionCodesLoading = false;
            myBlock.stop();
          }, function (error) {
            vm.promotionCodesLoading = false;
            myBlock.stop();
          });
      }

      function getPromotionCodesReportFn() {
        var from = vm.filter.date.startDate;
        var to = vm.filter.date.endDate;
        var role = (vm.reportName === 'coupon_code_drivers') ? 'DRIVER' : (vm.reportName === 'coupon_code_passengers') ? 'PASSENGER' : '';
        return adminService.getPromotionCodesReporting(utilService.toStringDate(from), utilService.toStringDate(to), role, vm.filter.promotionCode);
      }
    }
  }
})();
