"use strict";
const G = 1;
const CAMERA_DISTANCE = 20;

const getCenterOfGravity = (function getCenterOfGravity() {
  let tmp = new THREE.Vector3();
  return function getCenterOfGravity(planets, optionalTarget) {
    let result = optionalTarget || new THREE.Vector3();
    let totalMass = 0;
    tmp.set(0, 0, 0);
    planets.forEach(function(p) {
      tmp.copy(p.position).multiplyScalar(p.mass);
      totalMass += p.mass;
      result.add(tmp);
    });
    result.multiplyScalar(1/totalMass);

    return result;
  }
})();

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


function Planet(radius, density) {
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
    velocity: new THREE.Vector3(0, 0, 0),
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

function Rocket(radius) {
  const mass = 0.001;
  const g = new THREE.TetrahedronBufferGeometry(radius, 0);
  const mat = new THREE.MeshPhongMaterial({
    color: "green",
  });

  THREE.Mesh.call(this, g, mat);

  Object.assign(this, {
    force: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    mass: mass,
  });
}
Rocket.prototype = Object.create(THREE.Mesh.prototype);

Rocket.prototype.update = (function() {
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
  camera.position.z = CAMERA_DISTANCE;

  function render() {
    renderer.render(scene, camera);
  }

  let planets = [];
  planets.push(new Planet());
  planets.push(new Planet(0.1, 0.1));
  planets[1].position.set(0, 5, 0);
  planets[1].velocity.set(-0.8, 0, 0);
  planets.forEach(function(p) {
    scene.add(p);
  });

  let rocket = new Rocket(0.5);
  rocket.position.set(1, -5, 0);
  rocket.velocity.set(0.9, 0, 0);
  scene.add(rocket);
  planets.push(rocket);

  let sun = new THREE.DirectionalLight();
  sun.position.copy(camera.position);
  scene.add(sun);

  Object.assign(this, {
    canvas: canvas,
    camera: camera,
    scene: scene,
    render: render,
    planets: planets,
    rocket: rocket,
  });
};

let centerOfGravity = new THREE.Vector3();
let cameraGoalPos = new THREE.Vector3();
Application.prototype.update = function(dt) {
  updateForces(this.planets);
  this.planets.forEach(function(p) {
    p.update(dt);
  });
  this.rocket.update(dt);
  getCenterOfGravity(this.planets, centerOfGravity);
  cameraGoalPos.copy(centerOfGravity);
  cameraGoalPos.z += CAMERA_DISTANCE;
  app.camera.position.lerp(cameraGoalPos, 0.1);
};

function onDocumentKeyDown(event) {
  switch (event.code) {
    case "ArrowUp":
      app.rocket.force.y += 0.1;
      console.log("hi")
      break;
    case "ArrowDown":
      break;
    case "ArrowRight":
      break;
    case "ArrowLeft":
      break;
    default:
      break;
  }
}
document.addEventListener("keydown", onDocumentKeyDown, false);

function update() {
  window.app.update(0.1);
  window.app.render();
  requestAnimationFrame(update);
}

window.onload = function() {
  window.app = new Application("#app", window.innerWidth, window.innerHeight);
  update();
};
