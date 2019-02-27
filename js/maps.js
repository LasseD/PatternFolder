'use strict';

var MAPS = {};

MAPS.make11477 = function(scaleX, addX, scaleY, addY) {
    var ret = [20, -16, 12.616, -15.652, 5.36, -14.604, -1.648, -12.883, -8.284, -10.51, -14.44, -7.534, -20, -4];

    return ret.map((v, idx) => idx%2==0 ? scaleX*v+addX : scaleY*v+addY);
}

MAPS.make11477Pair = function(spacers) {
    var ret = MAPS.make11477(1, -10*spacers-20, 1, 0);
    ret.push(...MAPS.make11477(-1, 10*spacers+20, 1, 0));
    return ret;
}

MAPS.Mapping = function(id, heights, horizontal, dx) {
    this.id = id;
    this.heights = heights;
    this.horizontal = horizontal;
    this.dx = dx;
}

MAPS.Mapping.prototype.toTxt = function() {
    var ret = '# ' + this.id + '\n';
    if(this.horizontal)
        ret += 'horizontal ';
    else
        ret += 'vertical ';
    ret += this.dx + '\n';
    this.heights.forEach(v => ret += " " + v);
    ret += '\n';
    return ret;
}

MAPS.ALL = [
            new MAPS.Mapping('11477', MAPS.make11477(1, 0, 1, 0), true, 0),
            new MAPS.Mapping('11477 pair - 3 spacers', MAPS.make11477Pair(3), true, 0),
            ];