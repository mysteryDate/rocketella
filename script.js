function Planet(radius, density, position) {
  position = (position !== undefined) ? new THREE.Vector3(0, 0, 0) : position;
  density = (density !== undefined) ? 1 : density;
  radius = (radius !== undefined) ? 1 : radius;

  var g = new THREE.SphereBufferGeometry(radius, 20, 20);
  var mat = new THREE.MeshBasicMaterial({
    color: "pink",
    wireframe: true,
  });

  THREE.Mesh.call(this, g, mat);

  Object.assign(this, {
    velocity: new THREE.Vector3(0, 0, 0),
  });
}
Planet.prototype = Object.create(THREE.Mesh.prototype);

function Application(selector, width, height) {
  var canvas = document.querySelector(selector);
  var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, width/height);
  camera.position.z = 50;

  function render() {
    renderer.render(scene, camera);
  }

  var p = new Planet();
  scene.add(p);

  Object.assign(this, {
    canvas: canvas,
    camera: camera,
    scene: scene,
    render: render,
  });
};

Application.prototype.update = function() {

};

function update() {
  window.app.update();
  window.app.render();
  requestAnimationFrame(update);
}

window.onload = function() {
  window.app = new Application("#app", window.innerWidth, window.innerHeight);
  update();
};
