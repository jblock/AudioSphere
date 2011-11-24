var camera, scene, renderer, pointLight,
geometry, material, mesh, auraMesh;

var uniforms, shaderMaterial;

var text, textObj, textObj2,
currentSongTitle, currentSongArtist,
titleMat, artistMat, title3d="title", artist3d="artist",
artistTextMesh,titleTextMesh;

var index = 0;

var artistObject, titleObject;

var mouse,ray;

var plane;

var currentSong;

var count = 0, toggleSpeed = 300;

var size = 5; res = 256;

var rotInc = {x:0, y:0, z:0};

var curWaveData = {left:[],right:[]}, curEQ = [], curPeakData = {left:[], right:[]};

var cubes = [];

var light;

var groundHue;

var ground;

var soundManager = soundManager;

soundManager.url = './';
soundManager.preferFlash = true;
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useWaveformData = true; 
soundManager.usePeakData = true;
soundManager.useEQData = true;
soundManager.useHighPerformance = true;
soundManager.useFastPolling = true;
soundManager.flash9Options.useEQData = true;
soundManager.flash9Options.usePeakData = true;
soundManager.flash9Options.useWaveformData = true;

soundManager.debugMode = false;      // enable debugging output (div#soundmanager-debug, OR console..)
soundManager.useConsole = false;

// Everything important goes in here

$(document).ready(function() {

	var $toggle = {
		elem : $('#toggle'),
		state : false
	};
	var $playlist = {
		elem : $('#playlist')
	};
	
	soundManager.onready(function() {
	
		// Create player object
		//audioSpherePlayer = new AudioSpherePlayer();
	
		// Show playlist & bind keys
		setTimeout(unHidePlaylist ,toggleSpeed*2);
		function unHidePlaylist() {
			$toggle.elem.animate({opacity:1,'left':0},toggleSpeed*2, function() {
				$(document).keydown(function(e) {
					if (e.keyCode == 83) {
						clickToggle($toggle);
						return false;
					} 
					// insert all other key bindings here
				});
			});
		}
		
	init();
		
	});
	
	//animate();
	
	$(window).resize(function() {
		// TODO: Fix proportions and stuff for scene. Can come a lot later.
		$toggle.elem.css({'top':(window.innerHeight-$toggle.elem.outerHeight())/2});
	});
	
	$toggle.elem
		.css({
			'top':(window.innerHeight-$toggle.elem.outerHeight())/2
		})
		.click(clickToggle);
		
	$('.file').click(function() {
		index = $(this).index();
		// if (currentSong != null && (!$(this).hasClass('playing') || !$(this).hasClass('paused'))) {
			// currentSong.stop();
			// currentSong.unload();
		// }
		if ($(this).hasClass('playing')) {

			currentSong.togglePause();
			$(this).toggleClass('playing');
			$(this).addClass('paused');
		} else if ($(this).hasClass('paused')) {

			$(this).removeClass('paused');
			currentSong.resume();
		} else {
			//      destroys the current resource, and makes a new one
			if (currentSong != null) {currentSong.stop();currentSong.destruct()};
			currentSongTitle = $(this).data('title');
			index = $(this).index();
			currentSongArtist = $(this).data('artist');
			currentSong = soundManager.createSound(
				{
					id:'currentSong',
					url:'./'+$(this).attr('href'),
					//url:'http://www.schillmania.com/projects/soundmanager2/demo/_mp3/walking.mp3',
					volume: 100,
					autoLoad : true,
					autoPlay: true,
					//stream: true,
					onplay: visualize(),
					onfinish: function(){
						$('.file').eq(index).toggleClass('playing');
						index++;
						$('.file').eq(index).click();
						},
					whileplaying: function() {
						curWaveData.left = currentSong.waveformData.left;
						curWaveData.right = currentSong.waveformData.right;
						curEQ = currentSong.eqData;
						curPeakData.left = currentSong.peakData.left;
						curPeakData.right = currentSong.peakData.right;
						
						manipulateGeometry();

					}
				}
			);
			$(this).toggleClass('playing');
			clickToggle();
		}
		return false;
	});

	function manipulateGeometry() {
		var c;
		mesh.position.z = 150*(curPeakData.left + curPeakData.right)/2;
		mesh.scale.x = .75+.5*curPeakData.left;
		mesh.scale.y = .75+.5*curPeakData.right;
		mesh.rotation.y+=.1;	
		
		artistMat.color.setHex(artistMat.color.getHex() + 30);
		titleMat.color.setHex(titleMat.color.getHex() + 30);

		
		ground.materials[0].color.setHSV(groundHue,.7,.5);
		  groundHue += .001;
		  if(groundHue > 1){
			groundHue = 0;
		  }
		for ( var i = 0; i < 256; i ++ ) {
		  cubes[i].scale.y = 20*(Math.abs(curWaveData.left[i]));
		  cubes[i].position.y = 2*size*cubes[i].scale.y/2;
		  c=Math.floor(Math.abs(curWaveData.left[i]) * 0x0000ff);
		  if(c<10){
		    c=10;
		  }
		  cubes[i].materials[0].color.setHex(c);
		}
		for ( var i = 0; i < 256; i ++ ) {
		  cubes[i+256].scale.y = 20*(Math.abs(curWaveData.right[i]));
		  cubes[i+256].position.y = 2*size*cubes[i+256].scale.y/2;
		  c=Math.floor(Math.abs(curWaveData.right[i]) * 256) * 256 *256 ;
		  if(c<10*256*256){
		    c=10*256*256;
		  }
		  cubes[i+256].materials[0].color.setHex(c);
		}
	}
	
	function init() {
		document.addEventListener('mousemove',onDocumentMouseMove,false);
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1500;
		camera.position.x = 0;
		camera.position.y = 100;
		groundHue = 0;
		
		var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
		shadowTexture = new THREE.WebGLRenderTarget(1024, 1024, pars );

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x000000,4000,6000);
		center = new THREE.Vector3();
		center.z = 0;
		
		// create the sphere's material
		var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xcccccc, shading: THREE.FlatShading, fog:true } );

		// set up the sphere vars
		var radius = 200, segments = 40, rings = 30;
		
		mesh = new THREE.Mesh(new THREE.SphereGeometry(radius,segments,rings),sphereMaterial)
		mesh.geometry.dynamic=true;
		mesh.position.y = 500;
		mesh.position.z = 400;
		mesh.castShadow = true;
		scene.add(mesh);
		
		mouse = new THREE.Vector3(0,0,1);
		
		ray = new THREE.Ray(camera.position);

		
geometry = new THREE.CubeGeometry( size+2, 2*size, size*10 );
		///geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0, size / 2, 0 ) );
		//left channel
	  for ( var i = 0; i < 256; i ++ ) {
		    cube = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
		    cube.position.x = i*size - 256*size;
		    cube.position.z = 256*size-i*size;
		    cube.position.y = 0;
		    cube.rotation.y = 0.7853;
		    cube.castShadow = true;
				cube.receiveShadow = false;
		    scene.add(cube);
		    cubes.push(cube);
	  }
		//right channel
	  for ( var i = 0; i < 256; i ++ ) {
		    cube = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
		    cube.position.x = i*size;
		    cube.position.z = size*i;
		    cube.position.y = 0;
		    cube.rotation.y = -0.7853;
		    cube.castShadow = true;
				cube.receiveShadow = false;
		    scene.add(cube);
		    cubes.push(cube);
	  }
	  //floor
		uniforms = {
			time: {type: "f", value: 1.0},
			resolution: {type: "v2", value: new THREE.Vector2()}
		};
		
		var geometry = new THREE.PlaneGeometry( 100, 100 );
		// var planeMaterial = new THREE.ShaderMaterial( { 
		
			// uniforms: uniforms,
			// vertexShader: document.getElementById('vertexShader').textContent,
			// fragmentShader: document.getElementById('fragmentShader').textContent,
			
		
		// } );
		var planeMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff
		});
		THREE.ColorUtils.adjustHSV( planeMaterial.color, 0, 0, 0.9 );
		ground = new THREE.Mesh( geometry, planeMaterial );
		ground.position.set( 0, 0, 0 );
		ground.scale.set( 100, 100, 100 );
		ground.rotation.x = -1.57;
		ground.castShadow = false;
		ground.receiveShadow = true;

		scene.add( ground );
		
		artistObject = new THREE.Object3D();
		scene.add(artistObject);
		titleObject = new THREE.Object3D();
		scene.add(titleObject);
		createText();
		
		light = new THREE.SpotLight( 0xffffff, .75 );
		light.position.set( -300, 900, 5000 );
		light.target.position.set(0, 0, 0);
		light.castShadow = true;
		scene.add( light );
		
		light = new THREE.SpotLight( 0xaa0000, .75 );
		light.position.set( -600, 900, 5000 );
		light.target.position.set(0, 0, 0);
		light.castShadow = true;
		//scene.add(light);
		
		light = new THREE.SpotLight( 0x00ffcc, .75 );
		light.position.set( 1, 900, 5000 );
		light.target.position.set(0, 0, 0);
		light.castShadow = true;
		//scene.add(light);
    
		// create a point light
		//var pointLight = new THREE.PointLight( 0xffffff , 1.25);
		//var otherPointLight = new THREE.PointLight( 0xFF0000 );
		
		//set its position
		//pointLight.position.x = -100;
		//pointLight.position.y = 200;
		//pointLight.position.z = -100;
		//pointLight.castShadow = true;
		//otherPointLight.position.x = 10;
		//otherPointLight.position.y = -200;
		//otherPointLight.position.z = 130;
		
		// add to the scene
		//scene.add(pointLight);
		//scene.add(otherPointLight);

		//mesh = new THREE.Mesh( geometry, material );
		//scene.add( mesh );

		mouse = new THREE.Vector3(0,0,1);
		ray = new THREE.Ray(camera.position);
		
		scene.add(camera);
		scene.add(new THREE.AmbientLight(0x808080));
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );

		renderer.setClearColor(scene.fog.color,1);
		renderer.autoClear = false;
		
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		renderer.shadowCameraNear = 3;
		renderer.shadowCameraFar = camera.far;
		renderer.shadowCameraFov = 50;

		renderer.shadowMapBias = 0.0039;
		renderer.shadowMapDarkness = 0.5;
		renderer.shadowMapWidth = 2048;
		renderer.shadowMapHeight = 1024;
		
		$('#visualizer').append( renderer.domElement );

	}
	
	function createText() {
		var radius = 200;
		var textSize = 200;
		var textHeight = 20;
		var textOffset = 20;
		var textCurves = 10;
		var title = currentSongTitle;
		var artist = currentSongArtist;


		title3d = new THREE.TextGeometry(title, {
			size: textSize,
			height: textHeight,
			curveSegments: textCurves,
			font: "helvetiker"
		});
		title3d.computeBoundingBox();
		title3d.computeVertexNormals();
		var centerOffset = -0.5 * (title3d.boundingBox.x[1] - title3d.boundingBox.x[0]);
		titleMat = new THREE.MeshPhongMaterial( { color: 0xffdd99, shading: THREE.SmoothShading } );
		titleTextMesh = new THREE.Mesh(title3d, titleMat);
		titleTextMesh.castShadow = true;
		titleTextMesh.doubleSided = false;
		titleTextMesh.position.x = centerOffset;
		titleTextMesh.position.y = 500-2*radius-textOffset;
		titleTextMesh.position.z = 0;
		titleTextMesh.overdraw = true;
		
		titleObject.add(titleTextMesh);
		
		artist3d = new THREE.TextGeometry(artist, {
			size: textSize,
			height: textHeight,
			curveSegments: textCurves,
			font: "helvetiker"
		});
		artist3d.computeBoundingBox();
		artist3d.computeVertexNormals();
		var centerOffset = -0.5 * (artist3d.boundingBox.x[1] - artist3d.boundingBox.x[0]);
		artistMat = new THREE.MeshPhongMaterial( {
			color: Math.random() * 0xffffff, 
			shading: THREE.SmoothShading
		});
		artistTextMesh = new THREE.Mesh(artist3d, artistMat);
		artistTextMesh.doubleSided = false;
		artistTextMesh.position.x = centerOffset;
		artistTextMesh.position.y = 500+radius;
		artistTextMesh.position.z = 0;
		artistTextMesh.overdraw = true;
		
		artistObject.add(artistTextMesh);
		
		//scene.add(textObj);
		//scene.add(textObj2);
	}
	
	function visualize() {
		scene.remove(artistTextMesh);
		scene.remove(titleTextMesh);
		createText();
		animate();
	}
	
	function animate() {

		window.requestAnimationFrame( animate );
		render();

	}

	function render() {
		uniforms.time.value+=.05;
	
		//mesh.rotation.y = Math.cos(count);
		
		//if (count < 90) count+=rotInc; else count = 0;
		//mesh.position.z = 10*rotInc;
		
		var newx = camera.position.x+(mouse.x-camera.position.x)*.05;
		if(newx<-1200){
		  newx=-1200;
		  }
		if(newx>1200){
			newx=1200;
		}
		camera.position.x=newx;
		var newy=camera.position.y+(-mouse.y-camera.position.y)*.05;
		if(newy<0){
		  newy=0;
		}
		if(newy>1000){
		  newy = 1000;
		}
		camera.position.y=newy;
		camera.lookAt(center);

		renderer.clear();
		renderer.render( scene, camera );
	}
	
	function onDocumentMouseMove(event) {
		mouse.x = (event.clientX - window.innerWidth/2);
		mouse.y = (event.clientY - window.innerHeight/2);
		
	}
	
	function AudioSpherePlayer() {
		var self = this,
			pl = this,
			sm = soundManager,
			isIe = (navigator.userAgent.match(/msie/i));
		this.links = [];
		this.sounds = [];
		this.soundsByURL = [];
		this.indexByURL = [];
		this.soundCount = 0;
	}
	
	function clickToggle() {
		if (!$toggle.state) {
			translateCSS3($toggle.elem,340,0,0,toggleSpeed,'ease-out');
			translateCSS3($('#playlist'),340,0,0,toggleSpeed,'ease-out');
		} else {
			translateCSS3($toggle.elem,0,0,0,toggleSpeed,'ease-out');
			translateCSS3($('#playlist'),0,0,0,toggleSpeed,'ease-out');
		}
		$toggle.state = !$toggle.state;
	}
	
	
});


/**
* Provides requestAnimationFrame in a cross browser way.
* http://paulirish.com/2011/requestanimationframe-for-smart-animating/
*/

if ( !window.requestAnimationFrame ) {

	window.requestAnimationFrame = ( function() {

		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

			window.setTimeout( callback, 1000 / 60 );

		};

	} )();

}

function translateCSS3(elem,x,y,z,time,easing) {
// positive = right, up, into page
	time/=1000;
	elem.css({
		'-webkit-transition-duration': time + 's',
		'-webkit-transform': 'translate3d('+x+'px,'+y+'px,'+z+'px)',
		'-webkit-transition-timing-function': easing,
		'-moz-transition-duration': time + 's',
		'-moz-transform': 'translate3d('+x+'px,'+y+'px,'+z+'px)',
		'-moz-transition-timing-function': easing,
		'transition-duration': time + 's',
		'transform': 'translate3d('+x+'px,'+y+'px,'+z+'px)',
		'transition-timing-function': easing,
	});	
}

function translateCSS3(elem,x,y,z,time) {
	time/=1000;
	elem.css({
		'-webkit-transition-duration': time + 's',
		'-webkit-transform': 'translate3d('+x+'px,'+y+'px,'+z+'px)',
		'-moz-transition-duration': time + 's',
		'-moz-transform': 'translate3d('+x+'px,'+y+'px,'+z+'px)',
		'transition-duration': time + 's',
		'transform': 'translate3d('+x+'px,'+y+'px,'+z+'px)',
	});
}

function opacityCSS3(elem,val) {
	elem.css({
		'-webkit-transition-duration': time + 's',
		'-moz-transition-duration': time + 's',
		'transition-duration': time + 's',
		'opacity': val
	});
}