const UNIT_X = new Point(1, 0);
const UNIT_Y = new Point(0, 1);

/* vectorObjects
 paperjs Items with update(vector) method */

function arrow(origin, headSize) {
    let end = origin + UNIT_X;
    let line = new Path([origin, end]);
    line.name = 'line';
    let headVector = UNIT_X.normalize(headSize);
    let head = new Path([end + headVector.rotate(135),
                         end,
                         end + headVector.rotate(-135)]);
    head.name = 'head';

    let new_arrow = new Group([line, head]);
    new_arrow.applyMatrix = false;
    new_arrow.pivot = origin;
    new_arrow.update = function(vector) {
        this.rotation = vector.angle;

        let line = this.children.line;
        let head = this.children.head;
        let origin = line.segments[0].point;
        let new_vector = line.segments[1].point - origin;
        new_vector.length = vector.length;
        line.segments[1].point = origin + new_vector;
        head.position = origin + new_vector;
    };

    return new_arrow;
}

function dot(origin, size) {
    let circle = new Shape.Circle(origin + UNIT_X, size);
    circle.pivot = origin;
    circle.vector = UNIT_X;
    circle.update = function(vector) {
        this.position = this.position - this.vector + vector;
        this.vector = vector;
        this.rotation = vector.angle;
    };
    return circle;
}




function cartesianMatrix(scaleFactor) {
    return new Matrix(scaleFactor, 0,
                      0, -scaleFactor,
                      view.center.x, view.center.y);
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
        this.running = false;
    }

    calculate() {
        let entries = this.points.entries();
        for (let entry of entries) {
            let point = entry[0];
            let vector = this.fun(point).transform(new Matrix(1, 0, 0, -1, 0, 0));
            if (this.normalize) vector = vector.normalize(this.normalizeAmount);
            let vectorObject = entry[1];
            vectorObject.update(vector);
        }
    }

    addPoint(point, vectorObject){
        let v = vectorObject();
        v.position = point.transform(cartesianMatrix(this.scaleFactor));

        this.points.set(point, v);
    }

    fillWithPoints(density, vectorObject) {
        let new_points = pointField(new Point(- this.width / 2, - this.height / 2),
                                    this.width, this.height, density);
        for (let point of new_points) {
            this.addPoint(point, vectorObject);
        }
    }

    setMouseFunction(f) {
        let self = this;
        this.layer.onMouseMove = function(event) {
            if (!self.running) return;
            self.fun = f(event);
            self.calculate();
        };
    }

    setAnimFunction(f) {
        let self = this;
        this.layer.onFrame = function(event) {
            if (!self.running) return;
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
        return point => event.point.transform(cartesianMatrix(35).invert()) - point;
    },
    sin: function(event) {
        return function(point) {
            return new Point(20, 10 * Math.sin(point.x + event.point.x / 50));
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



/* Flow */

class FlowSimulator {
    constructor(vectorFunction, timeStep, particles=[]) {
        this.vectorFunction = vectorFunction;
        this.timeStep = timeStep;
        this.timeScale = 1;
        this.particles = particles;
        this.layer = new Layer(particles);
        this.running = false;
        let self = this;
        self.layer.onFrame = function(event) {
            if (self.running && self.ready(event)) {
                for (let particle of self.particles) {
                    particle.point += particle.velocity * (self.timeScale / self.timeStep);
                    particle.velocity = self.vectorFunction(particle.point);
                }
            }
        };
        this.remainingTime = 0;
    }

    ready(event) {
        this.remainingTime -= event.delta;
        if (this.remainingTime <= 0) {
            this.remainingTime = 1 / this.timeStep;
            return true;
        } else {
            return false;
        }
    }
}

function particle(item, startPosition=new Point(0, 0)) {
    Object.defineProperty(item, 'point', {
        get: function() { return this._point; },
        set: function(point) {
            this._point = point;
            this.position = point.transform(cartesianMatrix(35));
        }
    });
    item.point = startPosition;
    item.velocity = new Point(0, 0);
    return item;
}


/* Layer Management */

function vectorFieldLayer(vectorObjectFunction) {
    let vectorField = new VectorPlot(functions.unit, 20, 20);
    vectorField.fillWithPoints(20, vectorObjectFunction);
    vectorField.normalizeAmount = 15;
    setupLayer(vectorField.layer);
    return vectorField;
}

function setupLayer(layer) {
    layer.visible = false;
    let background = new Shape.Rectangle(view.bounds);
    background.fillColor = 'white';
    layer.addChild(background);
    background.sendToBack();
    return layer;
}

function soloLayer(index) {
    if (index > project.layers.length - 1) return;
    project.layers[index].visible = true;
    layers[project.layers[index].name].running = true;
    if (index > 0) {
        project.layers[index - 1].visible = false;
        layers[project.layers[index - 1].name].running = false;
    }
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
    follow: vectorFieldLayer(() => arrow(new Point(0, 0), 5)),
    sinXY: vectorFieldLayer(() => dot(new Point(0, 0), 5)),
    sin: vectorFieldLayer(() => arrow(new Point(0, 0), 5)),
    flow1: new FlowSimulator(point => new Point(point.y, -point.x), 60)
};

layers.follow.setMouseFunction(mouseFunctions.follow);
layers.follow.layer.name = 'follow';

layers.sinXY.setMouseFunction(mouseFunctions.sinXY);
layers.sinXY.layer.name = 'sinXY';

layers.sin.setAnimFunction(animFunctions.sin);
layers.sin.layer.name = 'sin';

layers.flow1.layer.name = 'flow1';
let circleSymbol = new SymbolDefinition(new Shape.Circle(UNIT_X, 5), new Point(0.2, 0));
for (let i = 0; i < 100; i++) {
    let placedCircle = circleSymbol.place(1,1);
    let newParticle = particle(placedCircle, new Point(Math.random() * 10 - 5, Math.random() * 10 - 5));
    layers.flow1.particles.push(newParticle);
    layers.flow1.layer.addChild(newParticle);
}
layers.flow1.timeScale = 2;
let flow1field = new VectorPlot(point => new Point(point.y, -point.x), 20, 20);
flow1field.fillWithPoints(20, () => arrow(new Point(0, 0), 5));
flow1field.calculate();
layers.flow1.layer.addChild(flow1field.layer);
setupLayer(layers.flow1.layer);


soloLayer(0);
