'use strict'

/*
Convert all line types 3 and 4 to UTIL.CH objects.
 */
UTIL.ldr2Paths = function(ldr, onWarning) {
    var header = '';
    var paths = [];
    var dataLines = ldr.split(/(\r\n)|\n/);
    var anyNon0 = false;

    for(var i = 0; i < dataLines.length; i++) {
	var line = dataLines[i];
	if(!line)
	    continue; // Empty line, or 'undefined' due to '\r\n' split.

	var parts = line.split(" ").filter(x => x !== ''); // Remove empty strings.
	if(parts.length <= 1)
	    continue; // Empty/ empty comment line
	var lineType = parseInt(parts[0]);
	if(lineType != 0) {
	    var colorID = parseInt(parts[1]);
	    if(LDR.Colors[colorID] == undefined) {
		this.onWarning({message:'Unknown color "' + colorID + '". Black (0) will be shown instead.', line:i, subModel:part});
		colorID = 0;
	    }
	}
	//console.log("Parsing line " + i + " of type " + lineType + ": " + line); // Useful if you encounter parse errors.

	switch(lineType) {
        case 0:
            if(!anyNon0) {
                header += line + '\n';
            }
            break;
	case 3: // 3 <colour> x1 y1 z1 x2 y2 z2 x3 y3 z3
	    var p1 = new UTIL.Point(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
	    var p2 = new UTIL.Point(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
	    var p3 = new UTIL.Point(parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]));
            paths.push(new UTIL.CH([p1, p2, p3].map(p => p.flipYZ()), colorID));
            anyNon0 = true;
	    break;
	case 4: // 4 <colour> x1 y1 z1 x2 y2 z2 x3 y3 z3 x4 y4 z4
	    var p1 = new UTIL.Point(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
	    var p2 = new UTIL.Point(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
	    var p3 = new UTIL.Point(parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]));
	    var p4 = new UTIL.Point(parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13]));
            paths.push(new UTIL.CH([p1, p2, p3, p4].map(p => p.flipYZ()), colorID));
            anyNon0 = true;
	    break;
        }
    }

    UTIL.orderPathsClockwise(paths);

    return [paths, header];
}

UTIL.paths2Svg = function(paths) {
    var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
    var maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;

    paths.forEach(path => path.pts.forEach(function(p) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }));
    var w = maxX-minX, h = maxY-minY;
    var maxWH = Math.max(w, h);
    if(maxWH < 400) {
        w *= 400/maxWH;
        h *= 400/maxWH;
    }

    var ret = '<svg width="' + w + '" height="' + h + '"';
    ret += ' viewBox="' + minX + ' ' + minY + ' ' + (maxX-minX) + ' ' + (maxY-minY) + '"';
    ret += ' xmlns="http://www.w3.org/2000/svg">\n';

    paths.forEach(function(path) {
        ret += '  <path d="M';
        path.pts.forEach(p => ret += ' ' + p.x + ' ' + p.y + ' ');
        ret += 'Z" fill="#' + LDR.Colors[path.color].value.toString(16) +'"/>\n';
    });

    ret += '</svg>';
    return ret;
}

UTIL.paths2LDraw = function(paths, header) {
    console.dir(paths);
    function convert(x) {
        x = x.toFixed(UTIL.Precision);
        for(var i = 0; i < UTIL.Precision; i++) {
            var tmp = parseFloat(x).toFixed(i);
            if(parseFloat(tmp) == parseFloat(x)) {
                return tmp; // Don't output too many '0's.
            }
        }
        return x;
    }

    var cnt = 0;
    var ret = header;
    function handlePath(path) {
        if(path.pts.length > 4) { // Extract a quad:
            var path1 = {pts:path.pts.slice(0, 4), lDrawColor:path.lDrawColor};
            var pts2 = [ path.pts[0] ];
            pts2.push(...path.pts.slice(3));
            var path2 = {pts:pts2, lDrawColor:path.lDrawColor};
            handlePath(path1);
            handlePath(path2);
            return;
        }
        const pts = path.pts;
        ret += pts.length + " " + path.color;
        for(var j = 0; j < pts.length; j++) {
            var k = path.reversed ? pts.length-1-j : j;
            ret += " " + convert(pts[k].x) + " " + convert(pts[k].y) + " " + convert(pts[k].z);
        }
        ret += '\n';
        cnt++;
    }
    paths.forEach(handlePath);

    console.log('Built lDraw file with ' + cnt + ' triangles and quads.');
    return ret;
}
