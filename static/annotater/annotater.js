var scale = 1.0;

function fitToScreen() {
    // change canvas size
    var canvas = document.getElementById('imgcanvas');
    if (!canvas) {
        return;
    }

    // Calculate the maximum dimensions based on the page size
    var maxWidth = window.innerWidth / 1.5;
    var maxHeight = window.innerHeight / 1.5;

    // Calculate the scaling factor based on the maximum dimensions
    var scaling = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);

    // Apply the scaling to the canvas size
    canvas.style.width = canvas.width * scaling + "px";
    canvas.style.height = canvas.height * scaling + "px";

    scale = scale * scaling;

    // Scale SVG element
    $("svg").height($("svg").height() * scaling);
    $("svg").width($("svg").width() * scaling);

    // get current points & scale them
    var params = getParameters();
    for (var i = 0; i < params.length; i++) {
        params[i][0][0] *= scaling;
        params[i][0][1] *= scaling;
    }

    // render
    renderPoints(params, canvas.width * scaling, canvas.height * scaling);
}

setTimeout(() => {
	fitToScreen();;
}, 100);

function redirectFunction() {
	var coordinates = exportToString();
	var image_id = originalname.replace("../uploads/", "");
	window.location.href = `/setCoordinates?coordinates=${encodeURIComponent(coordinates)}&image_id=${encodeURIComponent(image_id)}`;
  }

//////

var ctrack = new clm.tracker();
var coordinates = [];

// set up file selector and variables to hold selections
var fileList, fileIndex;
if (window.File && window.FileReader && window.FileList) {
	function handleFileSelect(file) {
		fileList = [file];
		fileIndex = 0;
	
		if (!file.type.match('image.*')) {
			console.error('Selected file is not an image.');
			return;
		}
	
		localStorage.clear();
		loadImage();
	}
	
	// document.getElementById('files').addEventListener('change', handleFileSelect, false);
} else {
	alert('The File APIs are not fully supported in this browser.');
}


// Create a function to add your custom image to the fileList
function addCustomImageToFiles(imagePath) {
    // Create a new XMLHttpRequest to fetch the image data
    const xhr = new XMLHttpRequest();
    
    // Set up the request to fetch the image as a blob
    xhr.open('GET', imagePath, true);
    xhr.responseType = 'blob';

    xhr.onload = function () {
        if (xhr.status === 200) {
            // Create a File object from the fetched blob
            const customImage = new File([xhr.response], 'custom_image.png', { type: 'image/png' });

            // Trigger the handleFileSelect function to load your custom image
            handleFileSelect(customImage);
        } else {
            console.error('Failed to fetch custom image:', xhr.status);
        }
    };

    xhr.send();
}


// set up html webstorage for variables

function supports_html5_storage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

if (!supports_html5_storage()) {
	alert('HTML5 storage is not supported in this browser.');
}

function storeCurrent() {
	var coordinates = getParameters();
	// divide by scale
	for (var i = 0;i < coordinates.length;i++) {
		coordinates[i][0][0] /= scale;
		coordinates[i][0][1] /= scale;
	}
	var fileName = fileList[fileIndex].name;
	var stringCoordinates = JSON.stringify(coordinates);
	localStorage.setItem(fileName, stringCoordinates);
}



// set up d3 stuff
function clear() {
	document.getElementById('vis').innerHTML = "";
};

function x(d) { return d.x; }
function y(d) { return d.y; }
function colour(d, i) {
	stroke(-i);
	return d.length > 1 ? stroke(i) : "red";
}

var t = 0.5;
var delta = 0.01;
var stroke = d3.scale.category20b();

function getLevels(d, t_, points) {
	if (arguments.length < 2) t_ = t;
	var x = [points.slice(0, d)];
	for (var i=1; i<d; i++) {
		x.push(interpolate(x[x.length-1], t_));
	}
	return x;
}

var vis;
var points = [];
var line = d3.svg.line().x(x).y(y);

function setup(positions, toggle, w, h) {
	for (var i = 0;i < positions.length;i++) {
		points[i] = {x: positions[i][0][0], y: positions[i][0][1], visible: positions[i][1]};
	}
	
	vis = d3.select("#vis").append("svg")
		.attr("width", w)
		.attr("height", h)
		.append("g");

	update();
			
	vis.selectAll("circle.control")
			.data(function(d) { return points.slice(0, d) })
		.enter().append("circle")
		.attr("class", "control")
		.attr("r", 3)
		.attr("cx", x)
		.attr("cy", y)
		.attr("fill", function(d) {if (d.visible) {return "#ccc"} else {return "red"}})
		.call(d3.behavior.drag()
		.on("dragstart", function(d) {
			this.__origin__ = [d.x, d.y];
			vis.selectAll("circle.control").style("cursor","none");
		})
		.on("drag", function(d) {
			d.x = Math.min(w, Math.max(0, this.__origin__[0] += d3.event.dx));
			d.y = Math.min(h, Math.max(0, this.__origin__[1] += d3.event.dy));
			bezier = {};
			update();
			vis.selectAll("circle.control")
				.attr("cx", x)
				.attr("cy", y)
			//TODO : set cursor invisible and point to crosshairs
		})
		.on("dragend", function() {
			delete this.__origin__;
			vis.selectAll("circle.control").style("cursor","auto");
			storeCurrent();
		}));
				
	vis.selectAll("circle.control")
		.on("click", function(d) {
			if (d3.event.shiftKey) {
				//d.x = null;
				//d.y = null;
				if (d.visible) {
					d.visible = false;
					this.setAttribute("fill", "red");
				} else {
					d.visible = true;
					this.setAttribute("fill", "#ccc");
				}
			}
		});

	vis.append("text")
		.attr("class", "t")
		.attr("x", w / 2)
		.attr("y", h)
		.attr("text-anchor", "middle");

	vis.selectAll("text.controltext")
		.data(function(d) { return points.slice(0, d); })
	.enter().append("text")
		.attr("class", "controltext")
		.attr("dx", x)
		.attr("dy", y)
		.text(function(d, i) { return "P" + i });

};

function update() {
	var interpolation = vis.selectAll("g")
		.data(function(d) { return getLevels(d, t, points); });
	interpolation.enter().append("g")
		.style("fill", "none")
		.style("stroke", colour);

	var circle = interpolation.selectAll("circle")
		.data(Object);
	circle.enter().append("circle")
		.attr("r", 3)
	circle
		.attr("cx", x)
		.attr("cy", y);

	var path = interpolation.selectAll("path")
		//.data(function(d) { return [d]; });
		.data(function(d) {
			var ppaths = []
			for (var i = 0;i < paths.length;i++) {
				var pppath = [];
				for (var j = 0;j < paths[i].length;j++) {
					pppath.push(d[paths[i][j]])
				}
				ppaths.push(pppath);
			}
			return ppaths; 
		});
	path.enter().append("path")
	//.attr("class", "line")
	//.attr("d", line);
	path.attr("d",line);

	vis.selectAll("text.controltext")
		.attr("x", x)
		.attr("y", y);
	vis.selectAll("text.t")
		.text("t=" + t.toFixed(2));
}

function getParameters() {
	var coordinates;
	vis.selectAll("g").each(function(d) {coordinates = d;});
	coordinates = coordinates.map(function(x) {return [[x.x, x.y],x.visible]});
	
	return coordinates;
};

function getCoordinates() {
	var coordinates;
	vis.selectAll("g").each(function(d) {coordinates = d;});
	
	var cs = "[";
	for (var i = 0;i < coordinates.length;i++) {
		cs += "["+coordinates[i].x+","+coordinates[i].y+"],";
	}
	cs += "]";
	return cs;
}

function getRawCoordinates() {
	var coordinates;
	vis.selectAll("g").each(function(d) {coordinates = d;});
	
	return coordinates;
}

function toggleDisplay() {
	// TODO
};

function toggleText() {
	// TODO
};

function renderPoints(points, w, h) {
	clear();
	setup(points, undefined, w, h);
};

// function to start showing images
function loadImage() {
	if (fileList.indexOf(fileIndex) < 0) {
		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(e) {
				// check if positions already exist in storage
				
				// Render thumbnail.
				var span = document.getElementById('imageholder');
				span.innerHTML = '<canvas id="imgcanvas"></canvas>';
				var canvas = document.getElementById('imgcanvas')
				var cc = canvas.getContext('2d');
				var img = new Image();
				img.onload = function() {
					canvas.setAttribute('width', img.width);
					canvas.setAttribute('height', img.height);
					cc.drawImage(img,0,0,img.width, img.height);
					
          scale = 1.0;
					// check if parameters already exist
					var positions = localStorage.getItem(fileList[fileIndex].name)
					if (positions) {
						positions = JSON.parse(positions);
					} else {
						// estimating parameters
						positions = estimatePositions();
						if (!positions) {
							clear()
							return false;
						}
						// put boundary on estimated points
						for (var i = 0;i < positions.length;i++) {
							if (positions[i][0][0] > img.width) {
								positions[i][0][0] = img.width;
							} else if (positions[i][0][0] < 0) {
								positions[i][0][0] = 0;
							}
							if (positions[i][0][1] > img.height) {
								positions[i][0][1] = img.height;
							} else if (positions[i][0][1] < 0) {
								positions[i][0][1] = 0;
							}
						}
					}
					
					if (positions) {
						// render points
						renderPoints(positions, img.width, img.height);
						// storeCurrent();
					} else {
						clear();
						alert("Did not manage to detect position of face in this image. Please use a different image.")
						window.location.href = "../html/index.html";
					}
				}
				img.src = e.target.result;
			};
		})(fileList[fileIndex]);
		reader.readAsDataURL(fileList[fileIndex]);
	}
}

// function to start estimating parameters
function estimatePositions(box) {
	// starts tracker and tracks until positions are converged
	// box variable is optional
	// returns positions
	var skcc = document.getElementById('sketch');
	ctrack.reset();
	ctrack.init(pModel);
	
	var positions = [];
	var converged = false;
	var curpoints;
	var iteration = 0;
	while (!converged) {
		iteration++;
		if (box) {
			curpoints = ctrack.track(document.getElementById('imgcanvas'), box);
			if (!curpoints) {
				if (iteration > 0) {
					curpoints = positions[positions.length-1];
					converged = true;
					alert("Having some problems converging on a face in this image. Using the best estimate.");
					break;
				} else {
					alert("Having some problems converging on a face in this image. Please use a different image.");
					return false;
				}
			}
		} else {
			curpoints = ctrack.track(document.getElementById('imgcanvas'));
			if (!curpoints) {
				alert("There was a problem converging on a face in this image. Please use a different image.");
				discardChanges();
				return false;
				
			}
		}

		if (positions.length == 10) {
			positions.splice(0,1);
		}
		positions.push(curpoints);
		
		// check if converged
		if (positions.length == 10) {
			// calculate mean
			var means = [];
			for (var i = 0;i < positions[0].length;i++) {
				means[i] = [0,0];
				for (var j = 0;j < positions.length;j++) {
					// calculate mean
					means[i][0] += positions[j][i][0];
					means[i][1] += positions[j][i][1];
				}
				means[i][0] /= 10;
				means[i][1] /= 10;
			}
			// calculate variance
			var variances = [];
			for (var i = 0;i < positions[0].length;i++) {
				variances[i] = [0,0];
				for (var j = 0;j < positions.length;j++) {
					// calculate variance
					variances[i][0] += ((positions[j][i][0]-means[i][0])*(positions[j][i][0]-means[i][0]));
					variances[i][1] += ((positions[j][i][1]-means[i][1])*(positions[j][i][1]-means[i][1]));
				}
			}
			// sum variances
			allVariance = 0;
			for (var i = 0;i < positions[0].length;i++) {
				for (var j = 0;j < positions.length;j++) {
					allVariance += variances[i][0];
					allVariance += variances[i][1];
				}
			}
			if (allVariance < 50) {
				converged = true;
			}
		}
		
		// avoid iterating forever
		if (iteration > 100) {
			converged = true;
		}
	}
	
	for (var i = 0;i < curpoints.length;i++) {
		curpoints[i] = [[curpoints[i][0], curpoints[i][1]], true];
	}
	
	return curpoints;
}


// manual selection of faces (with jquery imgareaselect plugin)
function selectBox() {
	clear();
	$('#imgcanvas').imgAreaSelect({
		handles : true,
		onSelectEnd : function(img, selection) {
			// create box
			var box = [selection.x1, selection.y1, selection.width, selection.height];
			// do fitting
			positions = estimatePositions(box);
			if (!positions) {
				clear();
				return false;
			}
			// put boundary on estimated points
			for (var i = 0;i < positions.length;i++) {
				if (positions[i][0][0] > img.width) {
					positions[i][0][0] = img.width;
				} else if (positions[i][0][0] < 0) {
					positions[i][0][0] = 0;
				}
				if (positions[i][0][1] > img.height) {
					positions[i][0][1] = img.height;
				} else if (positions[i][0][1] < 0) {
					positions[i][0][1] = 0;
				}
			}
			// render points
			renderPoints(positions, img.width, img.height);
			storeCurrent();
		},
		autoHide : true
	});
}

function exportToString() {
	coordinates = getParameters();
	// divide by scale
	for (var i = 0;i < coordinates.length;i++) {
		coordinates[i][0][0] /= scale;
		coordinates[i][0][1] /= scale;
	}
	var exportCoordinates = [];
	for (var c = 0;c < coordinates.length;c++) {
		exportCoordinates.push(coordinates[c][0]);
	}
	var stringCoordinates = JSON.stringify(exportCoordinates);
	return stringCoordinates;
}