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
            // TODO: Restore height map from configuration if inlined.
            break;
	case 1: // 1 <colour> ...
            onWarning('1', 'Sub models is not currently supported! Sub model encountered on line ' + (i+1));
            anyNon0 = true;
	    break;
	case 2: // 2 <colour> x1 y1 z1 x2 y2 z2
	    var p1 = new UTIL.Point(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
	    var p2 = new UTIL.Point(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
            paths.push(new UTIL.CH([p1, p2].map(p => p.flipYZ()), colorID));
            anyNon0 = true;
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

UTIL.paths2LDraw = function(paths, header) {
    console.dir(paths); console.log(header);
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
        const pts = path.pts;
        if(pts.length > 4) { // Extract a quad:
            var path1 = {pts:pts.slice(0, 4), color:path.color};//lDrawColor:path.lDrawColor};
            var pts2 = [ pts[0] ];
            pts2.push(...pts.slice(3));
            var path2 = {pts:pts2, color:path.color};//lDrawColor:path.lDrawColor};
            handlePath(path1);
            handlePath(path2);
            return;
        }
        ret += pts.length + " " + path.color;
        for(var j = 0; j < pts.length; j++) {
            var k = !path.reversed ? pts.length-1-j : j;
            ret += " " + convert(pts[k].x) + " " + convert(pts[k].z) + " " + convert(pts[k].y);
        }
        ret += '\n';
        cnt++;
    }
    paths.forEach(handlePath);

    //console.log('Built lDraw file with ' + cnt + ' primitives: ' + ret);
    return ret;
}
