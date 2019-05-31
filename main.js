const UNIT_X = new Point(1, 0);
const UNIT_Y = new Point(0, 1);

/* vectorSymbols */

function arrowSymbol(headSize) {
    let origin = new Point(0, 0);
    let end = UNIT_X;
    let line = new Path([origin, end]);
    let headVector = UNIT_X.normalize(headSize);
    let head = new Path([end + headVector.rotate(135),
                         end,
                         end + headVector.rotate(-135)]);

    let arrow = new Group([line, head]);
    arrow.strokeScaling = false;
    return new SymbolDefinition(arrow);
}

function dotSymbol() {
    let circle = new Shape.Circle(UNIT_X, 0.1);
    circle.fillColor = 'red';
    circle.strokeScaling = false;
    return new SymbolDefinition(circle);
}




function pointField(origin, width, height, density) {
    let field = [];
    for (let y = origin.y; y < origin.y + width; y += width / density) {
        for (let x = origin.x; x < origin.x + height; x += height / density) {
            field.push(new Point(x, y));
        }
    }
    return field;
}

class VectorPlot {
    constructor(fun, width, height) {
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

    calculate() {
        let entries = this.points.entries();
        for (let entry of entries) {
            let point = entry[0];
            let placed = entry[1];
            let vector = this.fun(point);
            if (this.normalize) vector = vector.normalize(this.normalizeAmount);
            placed.scaling = new Point(vector.length, vector.length);
            placed.rotation = vector.angle;
        }
    }

    normalizePointForRender(point) {
        // cartesian coordinates with origin in middle of window
        return point.transform(new Matrix(this.scaleFactor, 0, 0, -this.scaleFactor,
                                          view.center.x, view.center.y));
    }

    addPoint(point, vectorSymbol) {
        point = this.normalizePointForRender(point);
        let placed = vectorSymbol.place(point);
        placed.pivot = new Point(-0.5, 0);
        this.points.set(point, placed);
    }

    fillWithPoints(density, vectorSymbol) {
        let new_points = pointField(new Point(- this.width / 2, - this.height / 2),
                                    this.width, this.height, density);
        for (let point of new_points) {
            this.addPoint(point, vectorSymbol);
        }
    }

    setMouseFunction(f) {
        let self = this;
        this.layer.onMouseMove = function(event) {
            self.fun = f(event);
            self.calculate();
        };
    }

    setAnimFunction(f) {
        let self = this;
        this.layer.onFrame = function(event) {
            self.fun = f(event);
            self.calculate();
        };
    }
}

let functions = {
    pow2: point => new Point(Math.pow(point.x, 2), Math.pow(point.y, 2)),
    unit: point => UNIT_X * 20
};

let mouseFunctions = {
    sinXY: function(event) {
        return function(point) {
            point = (event.point / 20) - point;
            point.x = Math.sin(point.x);
            point.y = Math.sin(point.y);
            return point;
        };
    },
    follow: function(event) {
        return point => event.point - point;
    },
    sin: function(event) {
        return function(point) {
            return new Point(20, 10 * Math.sin(point.x + event.point.x / 50));
        };
    },
    pow: function(event) {
        return function(point) {
            point = point - new Point(800, 800);
            let mouseX = 400 * Math.sin(0.01 * event.point.x);
            return new Point(Math.pow(point.x + mouseX, 2), Math.pow(point.y + mouseX, 2));
        };
    }
};

let animFunctions = {
    sin: function(event) {
        return function(point) {
            return new Point(20, 10 * Math.sin(point.x + event.time));
        };
    }
};



/* Layer Management */

function vectorFieldLayer(vectorSymbol) {
    let vectorField = new VectorPlot(functions.unit, 20, 20);
    vectorField.fillWithPoints(20, vectorSymbol);
    let background = new Shape.Rectangle(view.bounds);
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

let layerManager = {
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





/* Page Setup */

project.currentStyle.strokeWidth = 0.75;
project.currentStyle.strokeColor = '#e4141b';

let layers = {
    follow: vectorFieldLayer(arrowSymbol(0.25)),
    sinXY: vectorFieldLayer(dotSymbol()),
    sin: vectorFieldLayer(arrowSymbol(0.25)),
    pow: vectorFieldLayer(arrowSymbol(0.25)),
};

layers.follow.setMouseFunction(mouseFunctions.follow);

layers.sinXY.setMouseFunction(mouseFunctions.sinXY);

layers.pow.setMouseFunction(mouseFunctions.pow);
layers.pow.normalize = false;

layers.sin.setAnimFunction(animFunctions.sin);


soloLayer(0);
