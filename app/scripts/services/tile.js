/**
 * Created by abarazarte on 04/02/16.
 */
(function(){
  /**
   * @ngdoc service
   * @name neksoFeCorporateApp.tileUtilService
   * @description
   * # tileUtilService
   * Service in the neksoFeCorporateApp.
   */
  angular.module('neksoFeCorporateApp')
    .service('tileUtilService', tileUtil);

  var ZOOM_LEVEL_CLOSEST = 16;
  var ZOOM_LEVEL_NORMAL = 15;
  var ZOOM_LEVEL_FAR = 14;
  var ZOOM_LEVEL_BASE = 13;

  function tileUtil(){
    return {
      getQuadKey: getQuadKeyFn,
      getQuadKeyAsTopic: getQuadKeyAsTopicFn,
      getTileNumber: getTileNumberFn,
      getTopicsFromLocation: getTopicsFromLocationFn
    }
  }

  function toRad(num){
    return num * Math.PI / 180;
  }

  /**
   * Converts tile XY coordinates into a QuadKey topic ...
   *
   * @param x Tile X coordinate
   * @param y Tile Y coordinate
   * @param zoom  Level of detail, from 1 (lowest detail) to 23 (highest detail)
   * @return string A string containing the QuadKey
   */
  function getQuadKeyAsTopicFn(x, y, ZOOM) {
    var quadKey = getQuadKeyFn(x, y, ZOOM);
    var LEVELS = (ZOOM - ZOOM_LEVEL_FAR) + 1;

    return quadKey.substring(0, ZOOM_LEVEL_FAR - 1) + "/" +
      joinFn("/", quadKey.substring(ZOOM - LEVELS, ZOOM).split(''));
  }

  /**
   * Converts coordinates into a XY coordinates at a specified level of detail ...
   *
   * @param latitude  Latitude coordinate
   * @param longitude Longitude coordinate
   * @param ZOOM      Level of detail, from 1 (lowest detail) to 23 (highest detail)
   * @return object Tile containing the XY coordinates at ZOOM level of detail
   */
  function getTileNumberFn(latitude, longitude, ZOOM) {
    var xTile = Math.floor((longitude + 180) / 360 * (1 << ZOOM));
    var yTile = Math.floor((1 - Math.log(Math.tan(toRad(latitude)) + 1 / Math.cos(toRad(latitude))) / Math.PI) / 2 * (1 << ZOOM));
    if (xTile < 0)
      xTile = 0;
    if (xTile >= (1 << ZOOM))
      xTile = ((1 << ZOOM) - 1);
    if (yTile < 0)
      yTile = 0;
    if (yTile >= (1 << ZOOM))
      yTile = ((1 << ZOOM) - 1);

    return {
      x: xTile,
      y: yTile,
      zoom: ZOOM
    };
  }

  /**
   * Converts tile XY coordinates into a QuadKey at a specified level of detail ...
   *
   * @param tileX Tile X coordinate
   * @param tileY Tile Y coordinate
   * @param ZOOM  Level of detail, from 1 (lowest detail) to 23 (highest detail)
   * @return string A string containing the QuadKey
   */
  function getQuadKeyFn(tileX, tileY, ZOOM) {
    var quadKey = '';
    for(var i = ZOOM; i > 0; i--) {
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

  function getTopicsFromLocationFn(latitude, longitude, ZOOM) {
    var topics = [];
    var step = 2;
    switch (ZOOM) {
      case ZOOM_LEVEL_CLOSEST:
      case ZOOM_LEVEL_NORMAL:
        step = 3;
      case ZOOM_LEVEL_FAR:
        var tile = getTileNumberFn(latitude, longitude, ZOOM);
        tile.x--;
        tile.y++;
        for (var i = 0; i < step; i++) {
          for (var j = 0; j < step; j++) {
            topics.push(getQuadKeyAsTopicFn(tile.x + i, tile.y - j, ZOOM));
          }
        }
        return topics;
      case ZOOM_LEVEL_BASE:
        return topics[0] = (getQuadKeyAsTopicFn(latitude, longitude, ZOOM));
      default:
        return [];
    }
  }

  function joinFn(delimiter, tokens) {
    var sb = '';
    var firstTime = true;
    for (var i in tokens) {
      if (firstTime) {
        firstTime = false;
      } else {
        sb += delimiter;
      }
      sb += tokens[i];
    }
    return sb;
  }

})();
