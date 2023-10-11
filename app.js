// -- Part of code base from here: https://threejsfundamentals.org/

let container;      	// keeping the canvas here for easy access
let scene;
let camera;
let renderer;
let flockCenter = new THREE.Vector3( 0, 0, 0 );

let objectControls;     // instance to regulate controls.
let cameraControls;

let controls = [];      // array of instances from a class (new in javascript)
let objects = []; 	    // meshes, subjects of the scene
let boids = [];

let numcubes = 3;       // increase the number of cubes.

let ts; // timestamp

let clock;

// create some random colors
function getColor()
{   // reduce letter choices for a different palate
    let letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for( let i=0; i<3; i++ )
    {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

// -----------------------------------------------------------------------
// bottom functions same as earlier project
// -----------------------------------------------------------------------
function createCamera()
{
    // Create a Camera  -------------------------------------------------
    const aspect = container.clientWidth / container.clientHeight;
    const fov=50;           // fov = Field Of View
    const near = 0.1;          // the near clipping plane
    const far = 100000000;          // the far clipping plane
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // camera.position.set( 0, 0, 10 );
    // every object is initially created at ( 0, 0, 0 )
    // we'll move the camera **back** a bit so that we can view the scene
    camera.position.set( -300, 300, 700 );
    //camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    // camera.lookAt( scene.position );
}


function createCameraControls()
{
    cameraControls = new THREE.OrbitControls( camera, container );
}

function createScene() {    

    let path = "resources/skybox/";
    let urls = [
        path + "posx.jpg", path + "negx.jpg",
        path + "posy.jpg", path + "negy.jpg",
        path + "posz.jpg", path + "negz.jpg"
    ];

    let textureCube = new THREE.CubeTextureLoader().load( urls );

    const geometry = new THREE.BoxGeometry(1000, 1020, 1000);
    const texturedMaterial = new THREE.MeshPhongMaterial( { color: 'skyblue', side: THREE.BackSide } );
    const skybox = new THREE.Mesh(geometry, texturedMaterial);
    scene.add(skybox);
    skybox.translateY(490);
    
    // TEXTURE MAP
    textureMap = new THREE.TextureLoader().load( 'resources/grass.jpg' );
    textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.anisotropy = 16;
    textureMap.encoding = THREE.sRGBEncoding;
    
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32);
    const planeMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: textureMap, side: THREE.DoubleSide } );
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
    plane.rotateX(Math.PI / 2);
    
}

/**
 *  Creates a CubeTexture and starts loading the images.
 *  filenames must be an array containing six strings that
 *  give the names of the files for the positive x, negative x,
 *  positive y, negative y, positive z, and negative z
 *  images in that order.  path, if present, is pre-pended
 *  to each of the filenames to give the full path to the
 *  files.  No error checking is done here, and no callback
 *  function is implemented.  When the images are loaded, the
 *  texture will appear on the objects on which it is used
 *  in the next frame of the animation.
 */
function makeCubeTexture(filenames, path) {
   var URLs;
   if (path) {
       URLs = [];
       for (var i = 0; i < 6; i++)
           URLs.push( path + filenames[i] );
   }
   else {
       URLs = filenames;
   }
   var loader = new THREE.CubeTextureLoader();
   var texture = loader.load(URLs);
   return texture;
}


function createLights()
{
    // Create a directional light
    const light1 = new THREE.DirectionalLight( 0xffffff, 1.0 );
    // move the light back, right and up a bit
    light1.position.set( 4, 4, 8 );
    light1.castShadow = 'true';
    // remember to add the light to the scene
    scene.add( light1 );

    /* play around with multiple lights
    // Create another directional light */
    const light2 = new THREE.DirectionalLight( 0xffffff, 0.7 );
    // move the light back, left and down a bit */
    light2.position.set( -20, -20, 10 );
    // remember to add the light to the scene
    scene.add( light2 );
    //light1.target(0,0,0) - light points by default to origin

}

// function createHelperGrids()
// {
//     // Create a Helper Grid ---------------------------------------------
//     let size = 40;
//     let divisions = 40;

//     // Ground
//     let gridHelper = new THREE.GridHelper( size, divisions, 0xff5555, 0x444488 );
//     scene.add( gridHelper );

//     //  Vertical
//     let gridGround = new THREE.GridHelper( size, divisions, 0x55ff55, 0x667744 );
//     gridGround.rotation.x = Math.PI / 2;
//     scene.add( gridGround );
// }

function createRenderer()
{
    //renderer = new THREE.WebGLRenderer();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    // we set this according to the div container.
    renderer.setSize( container.clientWidth, container.clientHeight );
    renderer.setClearColor( 0x000000, 1.0 );
    container.appendChild( renderer.domElement );  // adding 'canvas; to container here
    // render, or 'create a still image', of the scene
}

// set the animation loop - setAnimationLoop  will do all the work for us.
function play()
{
    renderer.setAnimationLoop( ( timestamp ) =>
	{
	    ts = timestamp;	    
	    update( timestamp );
            render();
	} );
}

function move_all_boids_to_new_positions () {
    let v1;
    let v2;
    let v3;
    let v4;
    let v5;
    let v6;
    let v7;
    
    boids.forEach(function(b) {
	
	v1 = rule1(b).divideScalar(10).multiplyScalar( controls[0].rule1 );
	v2 = rule2(b).divideScalar(5).multiplyScalar( controls[0].rule2 );
	v3 = rule3(b).divideScalar(10).multiplyScalar( controls[0].rule3 );
	v4 = tend_to_place(b).multiplyScalar( controls[0].tend_to_place ).divideScalar(10);
	v5 = gust(b).multiplyScalar( controls[0].gust ).divideScalar(5);
	v6 = bound_position(b).multiplyScalar( controls[0].bound_position );
	v7 = avoid_objects(b);
	
	b.velocity =
	    b.velocity
	    .add(v1)
	    .add(v2)
	    .add(v3)
	    .add(v4)
	    .add(v5)
	    .add(v6)
	    .add(v7);
	limit_velocity(b);
	b.position = b.position.add( b.velocity );
	b.lookAt( b.velocity );
	
    });
}



// Boids fly towards center of mass
function rule1 ( boid ) {

    // Calculate pcJ, the perceived center of the flock
    var vecSum = new THREE.Vector3( 0, 0, 0 );
    boids.forEach( function(b) {
	if(b != boid) {

	    vecSum.add(b.position);
	}
    });    
    let pcJ = vecSum.divideScalar(boids.length - 1);
    flockCenter = pcJ;
    
    // Calculate vector offset for Boid's movement
    boids.forEach(function(b) {
	if (b != boid)
	    pcJ = pcJ.add(b.position);
    });
    pcJ = pcJ.divideScalar(boids.length - 1);

    return ( pcJ.sub(boid.position) ).divideScalar(100);

}

// Boids keep a small distance from each other
function rule2 ( boid ) {
    let c = new THREE.Vector3(0, 0, 0);

    boids.forEach( function(b) {	
	if (b != boid) {

	    // Calculates the inverse exponential of the distance vector,
	    // this makes each boid pay closer attention to the nearest
	    // members.
	    
	    powDist =
		(b.position.clone().sub( boid.position ).normalize()).divide(
		    ( b.position.clone().sub( boid.position ).multiply(
			b.position.clone().sub( boid.position ))));
	    
	    c = c.sub( powDist );
	    
	}

	
	
    });

    return c;
}

// Velocity matching
function rule3 ( boid ) {

    // Calcuating the perceived velocity of flock
    var vecSum = new THREE.Vector3( 0, 0, 0 );
    boids.forEach( function(b) {
	if(b != boid) {
	    
	    vecSum.add( b.velocity );
	}
    });    
    let pvJ = vecSum.divideScalar(boids.length - 1);

    
    boids.forEach( function(b) {
	if (b != boid) {
	    pvJ = pvJ.add(b.velocity);
	}
    });

    pvJ = pvJ.divideScalar(boids.length - 1);

    return (pvJ.sub(boid.velocity).divideScalar(8));
}

function avoid_objects( boid ) {
    let c = new THREE.Vector3( 0, 0, 0 );
    
    if ( objects[0] ) {
	let raycaster = new THREE.Raycaster(boid.position.clone(), boid.velocity.clone().normalize());
	let intersections = raycaster.intersectObjects(objects);
	
	if (intersections[0] && intersections[0].distance < 80) {
	    c = c.sub( intersections[0].object.position.clone().sub( boid.position ) );
	}
    }

    return c;
}

function tend_to_place( boid ) {
    let time = clock.getElapsedTime();
    let tendency = new THREE.Vector3( Math.sin(time * 2) * 300, Math.sin(time) * 250 + 500, Math.cos(time * 2) * 300 );
    
    return ( ( tendency.sub( boid.position.clone() )).divideScalar(100) );
}

function limit_velocity( boid ) {
    let vlim = controls[0].velocity_limit;
    let v = new THREE.Vector3(0, 0, 0);

    if( boid.velocity.distanceTo(boid.position) > vlim ) {
	boid.velocity = boid.velocity.normalize(). multiplyScalar( vlim );
    }
}

function gust ( boid ) {
    return new THREE.Vector3( controls[0].gustX, controls[0].gustY, controls[0].gustZ );
}

function bound_position ( boid ) {
    var Xmin = -500;
    var Xmax = 500;
    var Ymin = 0;
    var Ymax = 1000;
    var Zmin = -500;
    var Zmax = 500;    
    
    let v = new THREE.Vector3(0, 0, 0);

    if ( boid.position.x < Xmin )
	v.x = 20;
    else if ( boid.position.x > Xmax)
	v.x = -20;

    if ( boid.position.y < Ymin )
	v.y = 20;
    else if ( boid.position.y > Ymax)
	v.y = -20;

    if ( boid.position.z < Zmin )
	v.z = 20;
    else if ( boid.position.z > Zmax)
	v.z = -20;

    return v;
    
}

function update( timestamp )
{
    move_all_boids_to_new_positions();
}


// called by play
function render( )
{
    renderer.render( scene, camera );
}


function onWindowResize()
{
    // set the aspect ratio to match the new browser window aspect ratio
    camera.aspect = container.clientWidth / container.clientHeight;

    // update the camera's frustum - so that the new aspect size takes effect.
    camera.updateProjectionMatrix();

    // update the size of the renderer AND the canvas (done for us!)
    renderer.setSize( container.clientWidth, container.clientHeight ); 
}

let gui;

function addControls( controlObject ) {
    gui = new dat.GUI();
    gui.add(controlObject, 'addObjects');
    gui.add(controlObject, 'addFlock');
    gui.add(controlObject, 'addBoid');
    gui.add(controlObject, 'rule1', 0.1, 10).step(0.1);
    gui.add(controlObject, 'rule2', 0.1, 10).step(0.1);
    gui.add(controlObject, 'rule3', 0.1, 10).step(0.1);
    gui.add(controlObject, 'tend_to_place', 0.1, 2).step(0.1);
    let gfolder = gui.addFolder('gustControls');
    gfolder.add(controlObject, 'gust', 0, 2).step(0.1);
    gfolder.add(controlObject, 'gustX', -5, 5).step(0.1);
    gfolder.add(controlObject, 'gustY', -5, 5).step(0.1);
    gfolder.add(controlObject, 'gustZ', -5, 5).step(0.1);
    let boundfolder = gui.addFolder('boundControls');
    boundfolder.add(controlObject, 'bound_position', 0.1, 2).step(0.1);
    gui.add(controlObject, 'velocity_limit', 1, 15).step(0.1);
    
}

let size = 6;

class Controller
{

    constructor(cube, controller)
    {
        this.controller = controller;
	this.cube = scene;

	this.rule1 = 1;
	this.rule2 = 1;
	this.rule3 = 1;
	this.tend_to_place = 1;
	this.gust = 0;
	this.gustX = 1;
	this.gustY = 1;
	this.gustZ = 1;
	this.bound_position = 1;
	this.toggle_bound = true;
	this.velocity_limit = 10;

	this.posX = 0;
	this.posY = 0;
	this.posZ = 0;
	
	this.numberOfBoids = 50;
    }

    addFlock () {

	boids.forEach ( function (b) {
	    scene.remove(b);
	});

	boids = [];
	for (var i = 0; i < this.numberOfBoids; i++) {

	    const tetrahedronGeometry = new THREE.TetrahedronGeometry( size );
	    const color = new THREE.Color( getColor() );
	    const tetrahedronMaterial = new THREE.MeshPhongMaterial( { color: color } );
	    
	    let tetrahedron = new THREE.Mesh( tetrahedronGeometry, tetrahedronMaterial );
	    tetrahedron.velocity = new THREE.Vector3( 0, 0, 0);
	    
	    boids.push( tetrahedron );
	    scene.add( tetrahedron );
	    
	    tetrahedron.translateX(Math.random() * 1000 - 500);
	    tetrahedron.translateY(Math.random() * 497 + 3);
	    tetrahedron.translateZ(Math.random() * 1000 - 500);
	    
	}
		
    }

    addBoid () {

	const tetrahedronGeometry = new THREE.TetrahedronGeometry( size );
	const color = new THREE.Color( getColor() );
	const tetrahedronMaterial = new THREE.MeshPhongMaterial( { color: color } );
	
	let tetrahedron = new THREE.Mesh( tetrahedronGeometry, tetrahedronMaterial );
	tetrahedron.velocity = new THREE.Vector3( 0, 0, 0);
	
	boids.push( tetrahedron );
	scene.add( tetrahedron );
	
	tetrahedron.translateX( Math.random() * 1000 - 500 );
	tetrahedron.translateY( Math.random() * 1000);
	tetrahedron.translateZ( Math.random() * 1000 - 500 );
		
    }
    
    addObjects ()
    {
	
	objects.forEach( function(s) {
	    scene.remove(s);
	});
	
	objects = [];


	let scale = 20;
	const geometry = new THREE.SphereGeometry( 5 * scale, 32, 32 );

	

	// TEXTURE MAP
	textureMap = new THREE.TextureLoader().load( 'resources/brick.jpg' );
	textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
	textureMap.anisotropy = 16;
	textureMap.encoding = THREE.sRGBEncoding;
	
	const material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: textureMap, side: THREE.DoubleSide } );
	const sphere = new THREE.Mesh( geometry, material );
	scene.add( sphere );
	objects.push( sphere );

	sphere.translateX(-250);
	sphere.translateY(750);
	sphere.translateZ(-250);

	const sphere2 = new THREE.Mesh( geometry, material );
	scene.add( sphere2 );
	objects.push( sphere2 );

	sphere2.translateX(250);
	sphere2.translateY(750);
	sphere2.translateZ(-250);

	const sphere3 = new THREE.Mesh( geometry, material );
	scene.add( sphere3 );
	objects.push( sphere3 );

	sphere3.translateX(-250);
	sphere3.translateY(750);
	sphere3.translateZ(250);

	const sphere4 = new THREE.Mesh( geometry, material );
	scene.add( sphere4 );
	objects.push( sphere4 );

	sphere4.translateX(250);
	sphere4.translateY(750);
	sphere4.translateZ(250);

	const sphere5 = new THREE.Mesh( geometry, material );
	scene.add( sphere5 );
	objects.push( sphere5 );

	sphere5.translateX(250);
	sphere5.translateY(250);
	sphere5.translateZ(-250);

	const sphere6 = new THREE.Mesh( geometry, material );
	scene.add( sphere6 );
	objects.push( sphere6 );

	sphere6.translateX(-250);
	sphere6.translateY(250);
	sphere6.translateZ(250);

	const sphere7 = new THREE.Mesh( geometry, material );
	scene.add( sphere7 );
	objects.push( sphere7 );

	sphere7.translateX(250);
	sphere7.translateY(250);
	sphere7.translateZ(250);

	const sphere8 = new THREE.Mesh( geometry, material );
	scene.add( sphere8 );
	objects.push( sphere8 );

	sphere8.translateX(-250);
	sphere8.translateY(250);
	sphere8.translateZ(-250);

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	
	

	
    }

}


function init()
{
    // Get a reference to the container element that will hold our scene
    container = document.querySelector('#scene-container');

    window.addEventListener( 'resize', onWindowResize );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x555555 )

    createCamera();

    createScene();

    createLights();

    clock = new THREE.Clock();

    controls = [];
    controls.push( new Controller(scene, 0) );
    addControls( controls[0] );

    // createHelperGrids();

    createCameraControls();

    createRenderer();

    play();

    renderer.render( scene, camera );  // renders once.


}

init();
