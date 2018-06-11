const G = 1;

const calcGravity = (function setupCalcGravity() {
  let dir = new THREE.Vector3();
  let Fg = new THREE.Vector3();
  return function calcGravity(p1, p2, m1, m2, optionalTarget) {
    // Gets gravity vector from p1 to p2
    let result = optionalTarget || new THREE.Vector3();
    dir.subVectors(p2, p1); // vector p1 -> p2
    let rSquared = dir.lengthSq();
    dir.normalize();
    let magnitude = G * m1 * m2 / rSquared;
    Fg.copy(dir).multiplyScalar(magnitude);

    result.copy(Fg);
    return result;
  }
})();

const updateForces = (function setupUpdateForces() {
  let tmpForce = new THREE.Vector3();
  let tmpDirection = new THREE.Vector3();

  return function updateForces(planets) {
    for (let i = 0; i < planets.length; i++) {
      planets[i].force.set(0, 0, 0);
    }
    for (let i = 0; i < planets.length; i++) {
      tmpForce.set(0, 0, 0);
      for (let j = i + 1; j < planets.length; j++) {
        let p1 = planets[i];
        let p2 = planets[j];
        calcGravity(p1.position, p2.position, p1.mass, p2.mass, tmpForce);
        p1.force.add(tmpForce);
        p2.force.add(tmpForce.multiplyScalar(-1));
      }
    }
  }
})();

function Planet(radius, density, position) {
  position = (position !== undefined) ? position : new THREE.Vector3(0, 0, 0);
  density = (density !== undefined) ? density : 1;
  radius = (radius !== undefined) ? radius : 1;
  const mass = 4/3 * Math.PI * (radius ** 3) * density;

  const g = new THREE.SphereBufferGeometry(radius, 20, 20);
  const mat = new THREE.MeshBasicMaterial({
    color: "pink",
    wireframe: true,
  });

  THREE.Mesh.call(this, g, mat);

  Object.assign(this, {
    force: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(-1, 0, 0),
    mass: mass,
    radius: radius,
  });
}
Planet.prototype = Object.create(THREE.Mesh.prototype);

Planet.prototype.update = (function() {
  let a = new THREE.Vector3();
  let dv = new THREE.Vector3();
  let dp = new THREE.Vector3();

  return function update(dt) {
    a.copy(this.force).multiplyScalar(1/this.mass);
    dv.copy(a).multiplyScalar(dt);
    this.velocity.add(dv);
    dp.copy(this.velocity).multiplyScalar(dt);
    this.position.add(dp);
  };
})();

function Application(selector, width, height) {
  const canvas = document.querySelector(selector);
  const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width/height);
  camera.position.z = 50;

  function render() {
    renderer.render(scene, camera);
  }

  planets = [];
  planets.push(new Planet());
  planets.push(new Planet());
  planets[1].position.set(10, 10, 10);
  planets.forEach(function(p) {
    scene.add(p);
  });

  Object.assign(this, {
    canvas: canvas,
    camera: camera,
    scene: scene,
    render: render,
    planets: planets,
  });
};

Application.prototype.update = function(dt) {
  updateForces(this.planets);
  this.planets.forEach(function(p) {
    p.update(dt);
  });
};

function update() {
  window.app.update(1.0);
  window.app.render();
  requestAnimationFrame(update);
}

window.onload = function() {
  window.app = new Application("#app", window.innerWidth, window.innerHeight);
  update();
};
