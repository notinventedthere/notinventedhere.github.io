var UNIT_X = new Point(1, 0);
var UNIT_Y = new Point(0, 1);

function arrow(origin, vector, headSize) {
    var end = origin + vector;
    var line = new Path([origin, end]);
    line.name = 'line';
    var headVector = vector.normalize(headSize);
    var head = new Path([end + headVector.rotate(135),
                         end,
                         end + headVector.rotate(-135)]);
    head.name = 'head';

    var new_arrow = new Group([line, head]);
    new_arrow.update = function(vector) {
        var line = this.children['line'];
        var head = this.children['head'];
        var origin = line.segments[0].point;
        var end = origin + vector;
        var prev_vector = line.segments[1].point - origin;
        head.rotate(vector.angle - prev_vector.angle, origin);
        line.segments[1].point = end;
        head.position = end + head.bounds.center - head.segments[1].point;
    };
    new_arrow.setPosition = function(point) {
        this.position = point + this.bounds.center - this.children['line'].segments[0].point;
    };

    return new_arrow;
}

function pointField(origin, width, height, density) {
    var field = [];
    for (var y = origin.y; y < origin.y + width; y += width / density) {
        for (var x = origin.x; x < origin.x + height; x += height / density) {
            field.push(new Point(x, y));
        }
    }
    return field;
}

function VectorPlot(fun, width, height) {
    this.fun = fun;
    this.width = width;
    this.height = height;

    this.normalize = true;
    this.normalizeAmount = 20;
    this.scaleFactor = 35;

    this.points = new Map();
    this.layer = new Layer(this.points.values());
    this.layer.visible = false;
}

VectorPlot.prototype.calculate = function() {
    var entries = this.points.entries();
    for (let entry of entries) {
        var point = entry[0];
        var vectorDrawing = entry[1];
        if (this.normalize) {
            vectorDrawing.update(this.fun(point).normalize(this.normalizeAmount));
        } else {
            vectorDrawing.update(this.fun(point));
        }
    }
};

VectorPlot.prototype.addPoint = function(point, vectorDrawing) {
    // cartesian coordinates with origin in middle of window
    point = point.transform(new Matrix(this.scaleFactor, 0, 0, -this.scaleFactor,
                                       view.center.x, view.center.y));
    vectorDrawing.setPosition(point);

    this.points.set(point, vectorDrawing);
};

VectorPlot.prototype.fillWithPoints = function(density, vectorDrawingFunction) {
    var new_points = pointField(new Point(- this.width / 2, - this.height / 2),
                                this.width, this.height, density);
    for (var i = 0, len = new_points.length; i < len; i++) {
        this.addPoint(new_points[i], vectorDrawingFunction());
    }
};

VectorPlot.prototype.setMouseFunction = function(f) {
    var self = this;
    this.layer.onMouseMove = function(event) {
        self.fun = f(event);
        self.calculate();
    };
};

VectorPlot.prototype.setAnimFunction = function(f) {
    var self = this;
    this.layer.onFrame = function(event) {
        self.fun = f(event);
        self.calculate();
    };
};

project.currentStyle.strokeWidth = 0.75;
project.currentStyle.strokeColor = '#e4141b';

var functions = {
    pow2: function(point) {
        return new Point(Math.pow(point.x, 2), Math.pow(point.y, 2));
    },
    unit: function(point) { return UNIT_X * 20; }
};

var mouseFunctions = {
    sinXY: function(event) {
        return function(point) {
            point = (event.point / 20) - point;
            point.x = Math.sin(point.x);
            point.y = Math.sin(point.y);
            return point;
        };
    },
    follow: function(event) {
        return function(point) {
            return event.point - point;
        };
    },
    sin: function(event) {
        return function(point) {
            return new Point(20, 10 * Math.sin(point.x + event.point.x / 50));
        };
    },
    pow: function(event) {
        return function(point) {
            point = point - new Point(800, 800);
            var mouseX = 400 * Math.sin(0.01 * event.point.x);
            return new Point(Math.pow(point.x + mouseX, 2), Math.pow(point.y + mouseX, 2));
        };
    }
};

var animFunctions = {
    sin: function(event) {
        return function(point) {
            return new Point(20, 10 * Math.sin(point.x + event.time));
        };
    }
};


var vectorFieldLayers = {
    follow: vectorFieldLayer(),
    sinXY: vectorFieldLayer(),
    sin: vectorFieldLayer(),
    pow: vectorFieldLayer()
};

vectorFieldLayers.follow.setMouseFunction(mouseFunctions.follow);

vectorFieldLayers.sinXY.setMouseFunction(mouseFunctions.sinXY);

vectorFieldLayers.pow.setMouseFunction(mouseFunctions.pow);
vectorFieldLayers.pow.normalize = false;

vectorFieldLayers.sin.setAnimFunction(animFunctions.sin);


function vectorFieldLayer() {
    var vectorField = new VectorPlot(functions.unit, 20, 20);
    vectorField.fillWithPoints(20, function() { return arrow(new Point(1, 1), UNIT_X * 20, 5); });
    var background = new Shape.Rectangle(view.bounds);
    background.fillColor = 'white';
    vectorField.layer.addChild(background);
    background.sendToBack();
    return vectorField;
}

function soloLayer(index) {
    if (index > project.layers.length - 1) return;
    project.layers[index].visible = true;
    if (index > 0) project.layers[index - 1].visible = false;
}

var layerManager = {
    index: 0,
    next: function() {
        this.index++;
        soloLayer(this.index);
    },
    prev: function() {
        this.index--;
        soloLayer(this.index);
    }
};

function onMouseDown(event) {
    layerManager.next();
}

soloLayer(0);
