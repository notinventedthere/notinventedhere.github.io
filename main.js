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

function randomVector(size) {
    return UNIT_X.clone().rotate(Math.random() * 360 - 180) * (Math.random() * size);
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

class VectorField {
    constructor(vectorFunction, zones=new Map()) {
        this.vectorFunction = vectorFunction;
        this.zones = zones;
    }

    vectorAt(point) {
        for (let [zone, vectorFunction] of this.zones.entries()) {
            if (zone.contains(point)) return vectorFunction(point);
        }
        return this.vectorFunction(point);
    }
}

class VectorPlotter {
    constructor(vectorField) {
        this.vectorField = vectorField;

        this.normalize = true;
        this.normalizeAmount = 20;
        this.matrix = cartesianMatrix(35);

        this.points = new Map();
        this.group = new Group(this.points.values());
        this.running = false;
    }

    calculate() {
        let entries = this.points.entries();
        for (let entry of entries) {
            let point = entry[0];
            let vector = this.vectorField.vectorAt(point)
                .transform(new Matrix(1, 0, 0, -1, 0, 0));
            if (this.normalize) vector = vector.normalize(this.normalizeAmount);
            let vectorObject = entry[1];
            vectorObject.update(vector);
        }
    }

    addPoint(point, vectorObject){
        let v = vectorObject();
        v.position = point.transform(this.matrix);

        this.points.set(point, v);
    }

    fillWithPoints(width, height, density, vectorObject) {
        let new_points = pointField(new Point(- width / 2, - height / 2),
                                    width, height, density);
        for (let point of new_points) {
            this.addPoint(point, vectorObject);
        }
    }
}

let functions = {
    pow2: point => new Point(Math.pow(point.x, 2), Math.pow(point.y, 2)),
    unit: point => UNIT_X * 20,
    sinX: point => new Point(1, Math.sin(point.x))
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
};

let animFunctions = {
    sin: function(event) {
        return function(point) {
            return new Point(0, 10 * Math.sin((point.x + event.time) * 2));
        };
    }
};



/* Flow */

class ParticleMover {
    constructor(particles=[], timeStep=60) {
        this.timeStep = timeStep;
        this.timeScale = 1;
        this.particles = particles;
        this.group = new Group(particles);

        this.running = false;
        this.remainingTime = 0;
        let self = this;
        self.group.onFrame = function(event) {
            if (self.running && self.ready(event)) {
                for (let particle of self.particles) {
                    particle.point += particle.velocity * (self.timeScale / self.timeStep);
                    if (self.vectorField) {
                        particle.velocity = self.vectorField.vectorAt(particle.point);
                    }
                }
            }
        };
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

function newVectorLayer(name, vectorField, backgroundColor='white') {
    let layer = new Layer();
    layer.name = name;
    layer.visible = false;
    let background = new Shape.Rectangle(view.bounds);
    background.fillColor = backgroundColor;

    let vectorPlotter = new VectorPlotter(vectorField);
    let particleMover = new ParticleMover();
    particleMover.vectorField = vectorField;

    return {layer, vectorPlotter, particleMover};
}

function soloLayer(index) {
    if (index > project.layers.length - 1) return;
    project.layers[index].visible = true;
    let items = layers[project.layers[index].name];
    items.vectorPlotter.running = true;
    items.particleMover.running = true;
    if (index > 0) {
        project.layers[index - 1].visible = false;
        let items = layers[project.layers[index - 1].name];
        items.vectorPlotter.running = false;
        items.particleMover.running = false;
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

function defaults(vectorPlotter, vectorObjectFunction, density=20,
                  particleMover=undefined, particleN=100) {
    vectorPlotter.fillWithPoints(20, 20, density, vectorObjectFunction);
    vectorPlotter.normalizeAmount = 15;
    vectorPlotter.calculate();

    if (particleMover) {
        let circleSymbol = new SymbolDefinition(new Shape.Circle(UNIT_X, 2), new Point(0.2, 0));
        circleSymbol.item.fillColor = 'red';
        for (let i = 0; i < particleN; i++) {
            let placedCircle = circleSymbol.place(1,1);
            let vector = randomVector(10);
            let newParticle = particle(placedCircle, vector);
            particleMover.particles.push(newParticle);
            particleMover.group.addChild(newParticle);
        }
    }
}

project.currentStyle.strokeWidth = 0.75;
project.currentStyle.strokeColor = '#e4141b';

/* layers */

let flow1 = newVectorLayer('flow1', new VectorField(functions.sinX));
defaults(flow1.vectorPlotter, () => arrow(new Point(0, 0), 5), 20, flow1.particleMover);
flow1.layer.onFrame = function(event) {
    flow1.particleMover.particles.map(function(particle) {
        if (particle.point.x >= 10) {
            particle.point = new Point(-10, Math.random() * 10 - 5);
        }
    });
};

let flow2 = newVectorLayer('flow2', new VectorField(point => point));
flow2.vectorPlotter.vectorField = new VectorField(point => point);
defaults(flow2.vectorPlotter, () => arrow(new Point(0, 0), 5), 20, flow2.particleMover, 300);
flow2.layer.onMouseMove = function(event) {
    let vectorFunction = mouseFunctions.follow(event);
    let flowFunction = point => vectorFunction(point) + new Point(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
    flow2.particleMover.vectorField.vectorFunction = flowFunction;
    flow2.vectorPlotter.vectorField.vectorFunction = vectorFunction;
    flow2.vectorPlotter.calculate();

    flow2.layer.onFrame = function() {
        flow2.particleMover.particles.map(function(particle) {
            if (flow2.vectorPlotter.vectorField.vectorAt(particle.point).length < 1) {
                particle.point = event.point.transform(cartesianMatrix(35).invert()) + randomVector(9);
            }
        });
    };
};

let layers = {
    flow1,
    flow2,
    // sinXY: vectorFieldLayer(() => dot(new Point(0, 0), 5)),
    // sin: vectorFieldLayer(() => dot(new Point(0, 0), 2), 80),
    // flow1: flowLayer('flow1', point => new Point(point.y, -point.x)),
};

// layers.sinXY.setMouseFunction(mouseFunctions.sinXY);
// layers.sinXY.layer.name = 'sinXY';

// layers.sin.setAnimFunction(animFunctions.sin);
// layers.sin.normalize = false;
// layers.sin.layer.name = 'sin';

// layers.flow1.timeScale = 2;




soloLayer(1);
