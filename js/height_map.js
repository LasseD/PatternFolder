'use strict';

/*
  Assumes txt is formatted as follows:
  - Any empty line, or line starting with '#' is ignored
  - The symbol 'horizontal' or 'vertical' is expected to appear on a line by itself
  - All other lines should denote points by position and height as float values

  A an anchor point of (0,0) is expected to be present in the height points.
 */
LDR.LinearHeightMap = function(txt) {
    this.horizontal = true;
    this.heightPoints = [];

    var lines = txt.split(/(\r\n)|\n/);

    for(var i = 0; i < lines.length; i++) {
	var line = lines[i];
	if(!line || line[0] == '#')
	    continue; // Empty line, comment line, or 'undefined' due to '\r\n' split.
        var parts = line.split(" ").filter(x => x !== ''); // Remove empty strings.
        if(parts.length == 0)
            continue;
        if(parts[0] == 'horizontal') {
            this.horizontal = true;
        }
        else if(parts[0] == 'vertical') {
            this.horizontal = false;
        }
        else {
            // Parse coordinates:
            for(var i = 0; i < parts.length; i+= 2) {
                var x = parseFloat(parts[i]), y = parseFloat(parts[i+1]);
                this.heightPoints.push(new UTIL.Point(x, y, 0));
            }
        }
    }
}

/*
  Fold all paths, using (0,0) as anchor point.
  This method handles horizontal/vertical height maps and first-coordinates less than 0.
 */
LDR.LinearHeightMap.prototype.foldPaths = function(paths) {
    var ret1 = this.foldPathsRightFrom0(paths); 

    function flipX(ps) {
        ps.forEach(path => path.pts.forEach(p => p.x = -p.x));        
    }
    function flipXY(ps) {
        ps.forEach(path => path.pts.forEach(p => p.flipXY()));
    }
    
    this.heightPoints.forEach(p => p.x = -p.x);
    if(!this.horizontal) {
        console.log('Flipping all points for vertical surface');
        flipXY(paths);
    }

    //console.log('Handling negative points for heights');

    flipX(paths);
    var ret2 = this.foldPathsRightFrom0(paths);
    flipX(ret2);
    flipX(paths); // Restore.

    if(!this.horizontal) {
        flipXY(paths);
        flipXY(ret2); // Because it was created from paths.
    }
    this.heightPoints.forEach(p => p.x = -p.x);

    ret1.push(...ret2);
    return ret1;
}

/*
  Assume path is a list of UTIL.CH objects.
  Lines and conditional lines are not considered.
  Return a list of UTIL.CH objects folded onto the height map.
 */
LDR.LinearHeightMap.prototype.foldPathsRightFrom0 = function(paths) {
    console.log('Folding right from 0:'); console.dir(paths);

    const heightPoints = this.heightPoints.filter(p => p.x >= 0);
    heightPoints.sort((a,b) => a.x - b.x);
    //console.log('Prepared heights: '); heightPoints.forEach(p => console.log(p.toSvg()));

    // First cut the paths along the height map:
    var mapLeft = new UTIL.Point(0,0,0);
    var origLeft = 0;
    heightPoints.forEach(function(mapRight) {
        var origRight = origLeft + mapRight.dist(mapLeft);
        var line = new UTIL.Line(new UTIL.Point(origRight, 1, 0), new UTIL.Point(origRight, -1, 0));
        console.log("Cutting for line x=" + origRight);

        // Cut all:
        var newPaths = [];
        paths.forEach(function(path) {
            if(path.intersectsLine(line)) {
                console.log('split');
                path.splitByLine(line, newPaths);
            }
            else {
                newPaths.push(path);
            }
        });
        paths = newPaths;
        console.dir(newPaths);

        origLeft = origRight;
        mapLeft = mapRight;
    });

    // Decorate with average x-value for quicker processing:
    paths.forEach(p => p.averageX = p.pts.map(p => p.x).reduce((a, b) => a+b) / p.pts.length);
    paths = paths.filter(p => p.averageX > 0);
    paths.sort((a, b) => a.averageX-b.averageX);
    //paths.forEach(path => console.log(path.toSvg()));

    // Now fold the reduced paths along the height map:
    mapLeft = new UTIL.Point(0,0,0);
    origLeft = 0;

    var pathsIdx = 0;
    var ret = [];
    heightPoints.forEach(function(mapRight) { // First iteration will not output anything due to the interval being 0-0.
        var origRight = origLeft + mapRight.dist(mapLeft);
        const mapDx = mapRight.x - mapLeft.x;
        const mapDy = mapRight.y - mapLeft.y;
        const origDx = origRight - origLeft;

        for(; pathsIdx < paths.length; pathsIdx++) {
            var path = paths[pathsIdx];
            if(path.averageX > origRight) {
                break;
            }
            path = path.clone();
            // Update heights of points of path and output:
            path.pts.forEach(function(p) {
                //console.log('Mapping ' + p.x + ', ' + p.y + ', ' + p.z + ' to ');
                var t = (p.x-origLeft) / origDx;
                p.x = mapLeft.x + mapDx * t;
                // p.y remains unchanged.
                p.z += mapLeft.y + mapDy * t; // p.z was intially p.y - the height.
                //console.log(p.x + ', ' + p.y + ', ' + p.z);
            });
            ret.push(path);
        }

        origLeft = origRight;
        mapLeft = mapRight;
    });

    console.log('Folded paths:'); console.dir(ret);

    return ret;
}

/*
  Creates a visual representation of the surface consisting of the height points.
 */
LDR.LinearHeightMap.prototype.toLDR = function() {
    if(this.heightPoints.length == 0) {
        return new LDR.LinearHeightMap([new UTIL.Point(-1, 0, 0), new UTIL.Point(1, 0, 0)]).toLdr(); // Avoid empty renderer.
    }
    const COLOR = " 39";
    var horizontal = this.horizontal;
    var ret = '\n';
    // Find min:
    var minY = Math.max(...this.heightPoints.map(p => p.y));

    function put(x, y, low) {
        low = low ? " 10" : " -10";
        if(horizontal) {
            ret += " " + x + " " + y + low;
        }
        else {
            ret += low + " " + y + " " + x;
        }
    }
    function line(x1, y1, x2, y2, low) {
        ret += "\n2 0"; put(x1, y1, low); put(x2, y2, low);
    }
    function lineAcross(x, y) {
        ret += "\n2 0"; put(x, y, true); put(x, y, false);
    }
    
    var h = this.heightPoints.map(p => new UTIL.Point(p.x, p.y + 0.5, p.z));

    // Draw bottom:
    var minX = h[0].x;
    var maxX = h[h.length-1].x;
    // Quad:
    ret += "\n4" + COLOR; put(minX, minY, true); put(maxX, minY, true); put(maxX, minY, false); put(minX, minY, false);
    // Lines:
    line(minX, minY, maxX, minY, true); line(minX, minY, maxX, minY, false);
    lineAcross(minX, minY); lineAcross(maxX, minY);

    // Right side (only quad):
    var x = maxX;
    var y = h[h.length-1].y;
    ret += "\n4" + COLOR; put(x, minY, true); put(x, minY, false); put(x, y, false); put(x, y, true);    

    // Left side:
    // Quad:
    x = minX;
    y = h[0].y;
    ret += "\n4" + COLOR; put(x, minY, true); put(x, minY, false); put(x, y, false); put(x, y, true);
    // Lines:
    line(minX, minY, minX, y, true); line(minX, minY, minX, y, false);
    lineAcross(minX, y);

    // All in the middle:
    for(var i = 1; i < h.length; i++) {
        var x0 = x, y0 = y;
        x = h[i].x;
        y = h[i].y;

        // Top quad:
        ret += "\n4" + COLOR; put(x0, y0, false); put(x, y, false); put(x, y, true); put(x0, y0, true);
        // Side quads:
        ret += "\n4" + COLOR; put(x0, y0, true); put(x, y, true); put(x, minY, true); put(x0, minY, true);
        ret += "\n4" + COLOR; put(x, minY, false); put(x, y, false); put(x0, y0, false); put(x0, minY, false); 
        // Lines:
        lineAcross(x, y);
        line(x0, y0, x, y, true); line(x0, y0, x, y, false);
        line(x, minY, x, y, true); line(x, minY, x, y, false);
    }
    
    return ret + '\n';
}