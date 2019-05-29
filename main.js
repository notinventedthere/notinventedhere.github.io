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
    head.position = end;
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

function VectorFieldRenderer(width, height, density, origin) {
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
}

VectorFieldRenderer.prototype.calculate = function(f) {
    for (var i = 0, len = this.field.length; i < len; i++) {
        var arrow = this.field[i];
        var point = arrow.children['line'].segments[0].point;
        var vector = f(point);
        if (this.normalize) vector = vector.normalize(this.arrowLength);
        updateArrow(arrow, point, vector);
    }
};

project.currentStyle.strokeWidth = 0.75;
project.currentStyle.strokeColor = '#e4141b';

var functions = {
    pow2: function(point) {
        return new Point(Math.pow(point.x, 2), Math.pow(point.y, 2));
    }
};

var mouseFunctions = {
    slowSin: function(event) {
        return function(point) {
            point = (event.point / 10) - point;
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

var renderer = new VectorFieldRenderer(800, 800, 20, view.center - new Point(400, 400));
function onMouseMove(event) {
  renderer.calculate(mouseFunctions.follow(event));
}
