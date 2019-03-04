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

MAPS.Mapping.prototype.toEle = function(parent, fold, w, h) {
    var mapEle = document.createElement('span'); parent.append(mapEle);
    mapEle.setAttribute('class', 'map');
    var titleEle = document.createElement('span'); mapEle.append(titleEle);
    titleEle.setAttribute('class', 'title');
    titleEle.innerHTML = this.id;
    const self = this;
    mapEle.addEventListener('click', function(){$('#surface').val(self.toTxt()); fold();});

    // Make svg:
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); mapEle.appendChild(svg);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    var pts = [];
    this.heights.forEach(function(h, idx) {
            if(idx%2 == 0) { pts.push({x:h}); } 
            else { pts[(idx-1)/2].y = h }
        });
    pts.sort((a, b) => a.x - b.x);
    var minX = pts[0].x;
    var scale = w / (pts[pts.length-1].x - minX)
    pts.forEach(function(p) { // Change coordinates:
            p.x = (p.x-minX) * scale;
            p.y *= scale;
        });
    console.dir(pts);
}

MAPS.ALL = [
            new MAPS.Mapping('11477 LEFT', MAPS.make11477(1, 0, 1, 0), true, 0),
            new MAPS.Mapping('11477 RIGHT', MAPS.make11477(-1, 0, 1, 0), true, 0),
            new MAPS.Mapping('2 x 11477', MAPS.make11477Pair(0), true, 0),
            new MAPS.Mapping('2 x 11477 + 1', MAPS.make11477Pair(1), true, 0),
            new MAPS.Mapping('2 x 11477 + 2', MAPS.make11477Pair(2), true, 0),
            new MAPS.Mapping('2 x 11477 + 3', MAPS.make11477Pair(3), true, 0),
            ];