var UNIT_V = new Point(1, 0);

function vectorFromAngle(angle) {
    return UNIT_V.rotate(angle);
}

function arrow(origin, vector, headSize) {
    var end = origin + vector;
    var line = new Path([origin, end]);
    var arrowVector = vector.normalize(headSize);
    var arrowHead = new Path([end + arrowVector.rotate(135),
                                end,
                                end + arrowVector.rotate(-135)]);
    var arrow = new Group([line, arrowHead]);
    return arrow;
}

function pointField(origin, width, height, distance) {
    var field = [];
    for (var y = origin.y; y < origin.y + width; y++) {
        for (var x = origin.x; x < origin.x + height; x++) {
            field.push(new Point(x * distance, y * distance));
        }
    }
    return field;
}

function VectorFieldRenderer(width, height, distance) {
    var origin = new Point(Math.round(-width / 2), Math.round(-height / 2));
    this.pointField = pointField(origin, width, height, distance);
    this.headSize = 5;
    this.arrowLength = 20;
}

VectorFieldRenderer.prototype.render = function(f) {
    var self = this;
    return this.pointField.map(function(point) {
        return arrow(point, f(point), self.headSize);
    });
};

project.currentStyle.strokeWidth = 0.75;
project.currentStyle.strokeColor = '#e4141b';

var functions = {
    pow2: function(point) {
        return new Point(Math.pow(point.x, 2), Math.pow(point.y, 2));
    }
};

var renderer = new VectorFieldRenderer(20, 20, 80);
var example = new Group(renderer.render(functions.pow2));
example.position = new Point(400, 400);


function onMouseMove(event) {
   project.clear();
   example = new Group(renderer.render(function(point) {
       return point - event.point;
   }));
}
