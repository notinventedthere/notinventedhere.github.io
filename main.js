/* paperscript is based on older javascript hence the verbose syntax */

var UNIT_X = new Point(1, 0);
var UNIT_Y = new Point(0, 1);

function vectorFromAngle(angle) {
    return UNIT_V.rotate(angle);
}

function arrow(origin, vector, headSize) {
    var end = origin + vector;
    var line = new Path([origin, end]);
    line.name = 'line';
    var headVector = vector.normalize(headSize);
    var head = new Path([end + headVector.rotate(135),
                         end,
                         end + headVector.rotate(-135)]);
    head.name = 'head';
    return new Group([line, head]);
}

function updateArrow(arrow, origin, vector) {
    var end = origin + vector;
    var line = arrow.children['line'];
    var head = arrow.children['head'];
    var prev_vector = line.segments[1].point - line.segments[0].point;
    head.rotate(vector.angle - prev_vector.angle, line.segments[0].point);
    line.segments[0].point = origin;
    line.segments[1].point = end;
    head.position = end + head.bounds.center - head.segments[1].point;
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

function VectorField(width, height, density, origin) {
    if (origin == undefined) {
        origin = new Point(Math.round(-width / 2), Math.round(-height / 2));
    }
    this.headSize = 5;
    this.arrowLength = 20;
    this.normalize = true;

    this.field = pointField(origin, width, height, density);
    for (var i = 0, len = this.field.length; i < len; i++) {
        this.field[i] = arrow(this.field[i], UNIT_X * 20, this.headSize);
    }

    this.layer = new Layer(this.field);
    this.layer.visible = false;
}

VectorField.prototype.calculate = function(f) {
    for (var i = 0, len = this.field.length; i < len; i++) {
        var arrow = this.field[i];
        var point = arrow.children['line'].segments[0].point;
        var vector = f(point);
        if (this.normalize) vector = vector.normalize(this.arrowLength);
        updateArrow(arrow, point, vector);
    }
};

VectorField.prototype.setMouseFunction = function(f) {
    var self = this;
    this.layer.onMouseMove = function(event) {
        self.calculate(f(event));
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
    slowSin: function(event) {
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
    }
};

var vectorFieldLayers = {
    follow: vectorFieldLayer(functions.unit, mouseFunctions.follow),
    slowSin: vectorFieldLayer(functions.unit, mouseFunctions.slowSin)
};

function vectorFieldLayer(f, mouseF) {
    var vectorField = new VectorField(800, 800, 20, view.center - new Point(400, 400));
    vectorField.calculate(f);
    if (mouseF) vectorField.setMouseFunction(mouseF);
    var background = new Shape.Rectangle(view.bounds);
    background.fillColor = 'white';
    vectorField.layer.addChild(background);
    background.sendToBack();
    return vectorField;
}

function LayerManager() {
    this.index = 0;
    var self = this;
    view.onMouseDown = function(event) {
        self.next();
    };
}

LayerManager.prototype.next = function() {
    if (this.index > project.layers.length - 1) return;
    project.layers[this.index].visible = true;
    if (this.index > 0) project.layers[this.index - 1].visible = true;
    this.index++;
};

var layerManager = new LayerManager();
