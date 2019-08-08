(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name neksoFeAdmindashboardApp.utilService
   * @description
   * # utilService
   * Service in the neksoFeAdmindashboardApp.
   */

  angular
    .module('neksoFeAdmindashboardApp')
    .service('utilService', util);

  util.$inject = ['store', '$location'];
  function util(store, $location) {

    return ({
      nvd3Parse: nvd3ParseFn,
      nvd3ParseOneDay: nvd3ParseOneDayFn,
      reloadGraph: reloadGraphFn,
      renderGraph: renderGraphFn,
      renderPieGraph: renderPieGraphFn,
      renderHorizontalBarGraph: renderHorizontalBarGraphFn,
      toStringDate: toStringDateFn,
      addSeparator: addSeparatorFn,
      findObjectById: findObjectByIdFn,
      getUserPermission: getUserPermissionFn,
      getUserRole: getUserRoleFn,
      getUserPermissionBase: getUserPermissionBaseFn,
      getUserPermissionStates: getUserPermissionStatesFn,
      getQuadKey: getQuadKeyFn,
      getQuadKeys: getQuadKeysFn,
      goToByScroll: goToByScrollFn,
      fillDataHeatMapChart: fillDataHeatMapChartFn,
      getHeatMapChartLabels: getHeatMapChartLabelsFn,
      searchBy: searchByFn,
      getUserCountryIso: getUserCountryIsoFn,
      randomString: randomStringFn,
      getPathSourceImageForCancelledPercent: getPathSourceImageForCancelledPercentFn,
      convertDistances: convertDistancesFn
    });

    function getUserRoleFn() {
      var permissions = store.get('admin_user').accessLevel;
      var response = false;
      if (permissions && permissions.length && permissions.length > 0) {
        return permissions[0].role;
      } else {
        return false;
      }
    }

    function getUserPermissionBaseFn(code) {
      if (!getUserPermissionFn(code)) {
        $location.path('/');
        return true;
      } else {
        return false;
      }
    }

    function getUserPermissionStatesFn(code) {
      if (store.get('admin_user')) {
        var states = store.get('admin_user').countryStates;
        return states;
      } else {
        return false;
      }
    }

    function getUserCountryIsoFn() {
      if (store.get('admin_user') && store.get('admin_user').location && store.get('admin_user').location.countryCode) {
        var countryCode = store.get('admin_user').location.countryCode;
        return countryCode;
      } else {
        return 'VE';
      }
    }

    function getUserPermissionFn(code) {
      if (store.get('admin_user')) {
        var permissions = store.get('admin_user').accessLevel;
        var response = false;
        if (permissions && permissions.length && permissions.length > 0) {
          for (var i = 0; i < permissions.length; i++) {
            if (permissions[i].code == code) {
              response = true;
              break;
            }
          }
          return response;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  function fillDataFn(data, range, dateFormat, dateAdd) {
    var result = [];
    var min = new Date(range.min).getTime();
    var max = new Date(range.max).getTime();
    while (min <= max) {
      var found = false;
      for (var i = 0; i < data.length; i++) {
        var td = new Date(moment(data[i].id, dateFormat).format()).getTime();
        if (td == min && found == false) {
          result.push({
            date: td,
            count: data[i].count
          });
          found = true;
        } else if (td == min && found == true) {
          for (var j = 0; j < result.length; j++) {
            if (result[j].date == td) {
              result[j].count += data[i].count;
              break;
            }
          }
        }
      }
      if (found == false) {
        result.push({
          date: min,
          count: 0
        });
      }
      min = new Date(moment(min).add(1, dateAdd).format()).getTime();
    }
    return result;
  }

  function fillDataHeatMapChartFn(data, range, dateFormat, dateAdd) {
    var result = [];
    var min = new Date(range.min).getTime();
    var max = new Date(range.max).getTime();
    while (min <= max) {
      var found = false;
      for (var i = 0; i < data.length; i++) {
        var td = new Date(moment(data[i].id, dateFormat).format()).getTime();
        if (td == min && found == false) {
          result.push({
            date: td,
            count: data[i].count
          });
          found = true;
        } else if (td == min && found == true) {
          for (var j = 0; j < result.length; j++) {
            if (result[j].date == td) {
              result[j].count += data[i].count;
              break;
            }
          }
        }
      }
      if (found == false) {
        result.push({
          date: min,
          count: 0
        });
      }
      min = new Date(moment(min).add(1, dateAdd).format()).getTime();
    }
    return result;
  }

  function getHeatMapChartLabelsFn(range) {
    var result = [];
    var min = angular.copy(range.min);
    while (+min <= +range.max) {
      result.push(min.format('YYYY-MM-DD'));
      min.add(1, 'd');
    }
    return result;
  }

  function fillDataOneDayFn(data, range) {
    var result = [];
    var min = new Date(range.min).getTime();
    var max = new Date(range.max).getTime();
    while (min <= max) {
      var found = false;
      for (var i = 0; i < data.length; i++) {
        var td = new Date(moment(data[i].id, 'YYYY-MM-DD HH').format()).getTime();
        if (td == min && found == false) {
          result.push({
            date: td,
            count: data[i].count
          });
          found = true;
        } else if (td == min && found == true) {
          for (var j = 0; j < result.length; j++) {
            if (result[j].date == td) {
              result[j].count += data[i].count;
              break;
            }
          }
        }
      }
      if (found == false) {
        result.push({
          date: min,
          count: 0
        });
      }
      min = new Date(moment(min).add(1, 'h').format()).getTime();
    }
    return result;
  }

  function reloadGraphFn(chartId) {
    $('#' + chartId + ' svg').empty();
  }

  function renderGraphFn(chartId, data, xAxisLabel, nvd3TimeFormat) {
    nv.addGraph(function () {
      var chart = nv.models.lineChart()
        .useInteractiveGuideline(true)
        .showLegend(true)
        .xScale(d3.time.scale())
        .noData("There is no data to display.");

      var tickvalues = new Array(data[0].values.length);
      for (var a = 0; a < data[0].values.length; a++) {
        tickvalues[a] = data[0].values[a].x;
      }

      chart.xAxis
        .axisLabel(xAxisLabel !== undefined ? xAxisLabel : "")
        .tickFormat(function (d) {
          return d3.time.format(nvd3TimeFormat)(new Date(d));
        });

      if (data[0].values.length <= 16) {
        chart.xAxis.tickValues(tickvalues);
      }

      chart.yAxis
        .tickFormat(d3.format());

      d3.select('#' + chartId + ' svg')
        .datum(data)
        .transition().duration(500)
        .call(chart);
      nv.utils.windowResize(chart.update);
      $('.nvtooltip').empty();
      return chart;
    });
    return $('#' + chartId + ' svg').empty();
  }

  function renderPieGraphFn(chartId, data) {
    nv.addGraph(function () {
      var chart = nv.models.pieChart()
        .x(function (d) {
          return d.label;
        })
        .y(function (d) {
          return d.value;
        })
        .showLabels(true)     //Display pie labels
        .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
        .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
        .donut(false);         //Turn on Donut mode. Makes pie chart look tasty!

      chart.valueFormat(d3.format('d'));

      d3.select('#' + chartId + ' svg')
        .datum(data)
        .transition().duration(350)
        .call(chart);

      nv.utils.windowResize(chart.update);
      return chart;
    });
    return $('#' + chartId + ' svg').empty();
  }

  function renderHorizontalBarGraphFn(chartId, data) {
    nv.addGraph(function () {
      var chart = nv.models.multiBarHorizontalChart()
        .x(function (d) {
          return d.label
        })
        .y(function (d) {
          return d.value
        })
        .margin({left: 110})
        .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

      chart.yAxis
        .tickFormat(d3.format(',.2f'));

      d3.select('#' + chartId + ' svg')
        .datum(data)
        .transition().duration(350)
        .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  }

  function nvd3ParseFn(data, range, dateFormat, dateAdd) {
    var graphData = fillDataFn(data, range, dateFormat, dateAdd);

    var d3Data = [];
    for (var i = 0; i < graphData.length; i++) {
      if (graphData[i]) {
        d3Data.push({
          x: graphData[i].date,
          y: graphData[i].count
        });
      }
    }
    return d3Data;
  }

  function nvd3ParseOneDayFn(data, range) {
    var graphData = fillDataOneDayFn(data, range);

    var d3Data = [];
    for (var i = 0; i < graphData.length; i++) {
      if (graphData[i]) {
        d3Data.push({
          x: graphData[i].date,
          y: graphData[i].count
        });
      }
    }
    return d3Data;
  }

  function toStringDateFn(date, format) {
    if (angular.isUndefined(format)) {
      return date.format().replace(/\+/g, "%2B");
    } else {
      return date.format(format).replace(/\+/g, "%2B");
    }
  }

  function addSeparatorFn(number) {
    number += '';
    var x = number.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }
    return x1 + x2;
  }

  function findObjectByIdFn(objects, id) {
    for (var i  in objects) {
      if (objects[i].id === id) {
        return objects[i];
      }
    }
  }

  function getTileNumber(lat, lng, zoom) {
    var xtile = Math.floor((lng + 180) / 360 * (1 << zoom));
    var ytile = Math.floor((1 - Math.log(Math.tan(toRad(lat)) + 1 / Math.cos(toRad(lat))) / Math.PI) / 2 * (1 << zoom));
    if (xtile < 0)
      xtile = 0;
    if (xtile >= (1 << zoom))
      xtile = ((1 << zoom) - 1);
    if (ytile < 0)
      ytile = 0;
    if (ytile >= (1 << zoom))
      ytile = ((1 << zoom) - 1);

    return {
      xtile: xtile,
      ytile: ytile,
      zoom: zoom
    };
  }
  function getQuadKeyFn(lat, lng, zoom) {
    var tile = getTileNumber(lat, lng, zoom);
    var tileX = tile.xtile;
    var tileY = tile.ytile;
    var quadKey = '';
    for (var i = zoom; i > 0; i--) {
      var digit = '0';
      var mask = 1 << (i - 1);
      if ((tileX & mask) != 0) {
        digit++;
      }
      if ((tileY & mask) != 0) {
        digit++;
        digit++;
      }
      quadKey += digit;
    }
    return quadKey;
  }

  function getQuadKeysFn(lat, lng, zoom) {
    var tile = getTileNumber(lat, lng, zoom);
    var tileX = tile.xtile - 1;
    var tileY = tile.ytile - 1;
    var arr=[];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var x = tileX+i;
        var y = tileY+j;
        arr.push(getDriverSubcriptionChannel(getQuadKeyfromTile(x,y,zoom)));
      }
    }
    return arr;
  }

  function getDriverSubcriptionChannel(quadKey) {
    var channel='loc/drv/+/available/+/';
    channel += quadKey.substring(8,0) +'/';
    var tmp = quadKey.substring(8);
    var arr=[];
    for (var i = 0; i < tmp.length; i++) {
      arr.push(tmp[i]);
    }
    channel+=arr.join('/');
    channel+='/#';
    return channel;
  }

  function getQuadKeyfromTile(tileX,tileY,zoom) {
    var quadKey = '';
    for (var i = zoom; i > 0; i--) {
      var digit = '0';
      var mask = 1 << (i - 1);
      if ((tileX & mask) != 0) {
        digit++;
      }
      if ((tileY & mask) != 0) {
        digit++;
        digit++;
      }
      quadKey += digit;
    }
    return quadKey;
  }

  function toRad(num) {
    return num * Math.PI / 180;
  }

  function goToByScrollFn(id) {
    // Remove "link" from the ID
    id = id.replace("link", "");
    // Scroll
    $('html,body').animate({
        scrollTop: $("#" + id).offset().top - 90
      },
      'slow');
  }

  function searchByFn(value, key, array) {
    var tmp = '';
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        tmp = array[i];
        break;
      }
    }
    return tmp;
  }

  function randomStringFn(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
  }

  function getPathSourceImageForCancelledPercentFn(cancelledPercentFromString) {
    var cancelledPercent = parseInt(cancelledPercentFromString.replace('%', ''));
    var normalizedPercent = 0;
    if (cancelledPercent > 0 && cancelledPercent <= 15) {
      normalizedPercent = 25;
    }
    if (cancelledPercent > 0 && cancelledPercent <= 15) {
      normalizedPercent = 25;
    }
    if (cancelledPercent > 15 && cancelledPercent <= 50) {
      normalizedPercent = 50;
    }
    if (cancelledPercent > 50 && cancelledPercent <= 75) {
      normalizedPercent = 75;
    }
    if (cancelledPercent > 75) {
      normalizedPercent = 100;
    }
    return '/images/icon-' + normalizedPercent + '-percent-cancelled.svg';
  }

  function convertDistancesFn(distance, from, to) {
    var conversionKeyForDistance = {
      m: {
        km: 0.001,
        m:1
      },
      km: {
        km:1,
        m: 1000
      }
    };

    return distance * conversionKeyForDistance[from][to];
  }

})();
