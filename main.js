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
    this.pointField = pointField(origin, width, height, density);
    this.headSize = 5;
    this.arrowLength = 20;
    this.normalize = true;
}

VectorFieldRenderer.prototype.render = function(f, position) {
    var self = this;
    return this.pointField.map(function(point) {
        var vector = f(point);
        if (self.normalize) vector = vector.normalize(self.arrowLength);
        if (position) point += position;
        return arrow(point, vector, self.headSize);
    });
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
   project.clear();
   example = new Group(renderer.render(mouseFunctions.follow(event)));
}
