//-------------------------------------------------------------------------------------------------
//
// World object
//
//-------------------------------------------------------------------------------------------------

var World = function(cv, cfg) {
	this.config = cfg;

	// The primary drawing canvas
	this.canvas = document.getElementById(cfg.cvid);
	this.ctx = cv.getContext("2d");
	this.w = cv.width;
	this.h = cv.height;

	// World scaling and rendering
	this.lookAt = new Vector(0, 0);				// Rendering engine is looking at this position
	this.numArrows = 30;

	// Time keeping
	this.time = 0;						// global time in seconds

	// Constants and buffer variables
	this.gamma = 6.67408e-11;			  	// gravitation constant in m³/(kg*s²)
	this.distMoonEarth = 384400000 		          	// distance moon to earth in meter
	this.distEarthSun  = 149597870700                       // distance sun to earth 

	// Some vectors of common use
	this.vecEarthSun  = new Vector(0,0)                     // Vector pointing from the earth towards the sun
	this.vecEarthMoon = new Vector(0,0)                     // Vector pointing from the earth towards the moon

	if (cfg.setup==0) {
		// A setup for illustrating moons gravitational effect on earth
		this.forceMultiplier = 0.0000005;
		this.ts = 2;					// timestep size in seconds
		this.scaleSize = 0.00002;			// scale for sizes	
		this.scaleDist = this.scaleSize; 		// scale for dimensions
		this.distMoonEarth = 384400000 		        // distance moon to earth in meter

		this.lookAt = new Vector(0, 0);			// Rendering engin is looking at this position
		
		this.earth = {
			pos           : new Vector(-9000000, 0), // earth position
			m             : 5.9721986e24,            // earth mass
			r             : 12735/2.0*1000,	         // earth radius in meter
			p             : 365.256 * 86400,         // siderial in seconds
			tidalForce    : [this.numArrows + 1],    // Tidal force arrows of the moon
			tidalForceSun : [this.numArrows + 1]     // Tidal force arrows of the moon
		};

		this.moon = {
			pos         :	new Vector(7000000, 0),	// moon position
			m           :	7.349e22,		// moon mass
			r           :	3476/2.0*1000,		// moon radius in meter
			p           :   27.322 * 86400		// siderial in seconds
		};

		// connect mouse events
		this.canvas.addEventListener('mousedown', this.onMouseDown, false);
		this.canvas.addEventListener('mouseup',   this.onMouseUp, false);
		this.canvas.addEventListener('mousemove', this.onMouseMove, false);
		this.canvas.world = this;
	} else if (cfg.setup==1) {
		this.forceMultiplier = 0.00000004;
		this.ts = 86400/10;                             // timestep size in seconds i need timesteps for the blinking 
		this.scaleDist = 0.0000006;                     // scale missingfor dimensions
		this.scaleSize = this.scaleDist;                // scale for sizes	
		this.distMoonEarth = 484400000 		        // distance moon to earth in meter

                this.earth = {
                        pos           :	new Vector(0, 0),       // earth position
			m             :	5.9721986e24,	        // earth mass
			r             :	15*12735/2.0*1000,      // earth radius in meter
			p             : 365.256 * 86400,        // siderial in seconds
			tidalForce    :	[this.numArrows + 1],   // Tidal force arrows of the moon
			tidalForceSun : [this.numArrows + 1]    // Tidal force arrows of the moon
		};

		this.moon = {
			pos      :	new Vector(0, 0),       // moon position
			m        :	15*7.349e22,               // moon mass
			r        :	15*3476/2.0*1000,       // moon radius in meter
			p	 : 	27.322 * 86400		// siderial in seconds
		};

		// Distance of the center of mass from the earth center (4672.68 km)
		this.distCenterOfMass = this.distMoonEarth*this.moon.m / (this.moon.m + this.earth.m);
		this.lookAt = new Vector(0, 0);			// Rendering engin is looking at this position
	}

	// Celestial Bodies

	this.sun = {
		pos      :	new Vector(0, 0),    // sun position (remains fixed throughout the simulation)
		m        :	10*1.98855e30,          // sun mass in kg
		r        :	696342000            // sun radius in meter
	}

	// Color and style definitions
	this.style = {
		colBack    	:	'#112255', //'rgb(15,15,30)',

		// Earth
		colEarth	:  	'rgb(30,130,220)',
		colEarthDark	:	'rgba(0, 0, 0, 0.7)',		
		colEarthOutline :	'darkGrey',

		// Moon
		colMoon		:	'white',
		colMoonDark	:	'rgba(0, 0, 0, 0.9)',
		colMoonOutline	:	'darkGrey',

		// 
		colVec1  	: 	'rgba(255, 255, 255, 0.4)', // white -ish
		colVec2  	: 	'rgba(255, 128, 128, 0.4)', // orange -ish
		colVec3  	: 	'#ffffff',
      		colVec4  	: 	'rgba(255, 165, 0, 0.8)',
      		colWater  	: 	'rgba(30, 130, 220, 0.7)',
		colOrbit        :       'rgba(255, 165, 0, 0.5)',
		colOrigin	:	'yellow',
		colCenterOfEarth:	'rgba(255, 165, 0,   1)',
                colSun          :	'rgba(255, 235, 50, 0.5)'
	};

	this.dragDropImage = new Image();
	this.dragDropImage.src = this.config.path + "/images/dragdrop.png";

	this.continentsImage = new Image();
	this.continentsImage.src = this.config.path + "/images/continents.png";
}

//-------------------------------------------------------------------------------------------------
//
// Mouse Handling
//
//-------------------------------------------------------------------------------------------------

World.prototype.getMousePos = function(evt) {
	var rect = this.canvas.getBoundingClientRect();
	return { x: evt.clientX - rect.left,
		 y: evt.clientY - rect.top };
}

World.prototype.onMouseDown = function(evt, world) {
	var world = this.world;

	if (world==null || world.config.setup!=0) {
		return;
	}

	var mousePos = world.getMousePos(evt);

	var clickPos = new Vector();
	clickPos.x = mousePos.x - (world.lookAt.x * world.scaleDist) - this.width/2;
	clickPos.y = mousePos.y - (world.lookAt.y * world.scaleDist) - this.height/2;
	clickPos.divideValue(world.scaleDist);

	var dist = Vector.subtractEx(world.moon.pos, clickPos).length();
		
	if (dist<world.moon.r) {
		world.dragMoon = true;
	} else {
		world.drawMoon = false;
	}
}

World.prototype.onMouseUp = function(evt, world) {
	var world = this.world;

	if (world==null || world.config.setup!=0) {
		return;
	}

	world.dragMoon = false;
}

World.prototype.onMouseMove = function(evt, world) {
	var world = this.world;

	if (world==null || world.config.setup!=0) {
		return;
	}

	var mousePos = world.getMousePos(evt);

	if (world.dragMoon==null || !world.dragMoon) {
		return;
	}

	var x = mousePos.x - (world.lookAt.x * world.scaleDist) - this.width/2;
	var y = mousePos.y - (world.lookAt.y * world.scaleDist) - this.height/2;

	x /= world.scaleDist;
	y /= world.scaleDist;

	var newMoonPos = new Vector(x, y);
	var vecEarthMoon = Vector.subtractEx(newMoonPos, world.earth.pos);
	var dist = Vector.subtractEx(world.earth.pos, newMoonPos).length();
	if (dist>world.earth.r * 2)
	{
		world.moon.pos = new Vector(x, y);
	} else {
		world.moon.pos = world.earth.pos.clone();
		world.moon.pos.add(vecEarthMoon.normalize().multiplyValue(world.earth.r * 2));
	}
}

//-------------------------------------------------------------------------------------------------
//
// Helper Functions
//
//-------------------------------------------------------------------------------------------------

World.prototype.mapToScreen = function(v, scale) {
	var vecScreen = v.clone();
	
	vecScreen.subtract(this.lookAt);

	// If no scale is provided take default distance scale, otherwise take custom value
	if (scale==null) {
		scale = this.scaleDist;
	}

	vecScreen.multiplyValue(scale);
	vecScreen.addXY(this.w/2, this.h/2);

	return vecScreen;
}

//-------------------------------------------------------------------------------------------------
//
// Moving Earth and Moon
//
//-------------------------------------------------------------------------------------------------

World.prototype.moveMoon = function() {
	// Moon position relative to the center of mass
	var a = this.time * 2 * Math.PI / this.moon.p;
	var x = Math.sin(a) * (this.distMoonEarth - this.distCenterOfMass);
	var y = Math.cos(a) * (this.distMoonEarth - this.distCenterOfMass);
	this.moon.pos.x = x;
	this.moon.pos.y = y;
}

// Compute the new position of the earth
World.prototype.moveEarth = function() {
	// Earth position is relative to the center of mass
	var a = this.time * 2 * Math.PI / this.moon.p;
	var x = -Math.sin(a) * this.distCenterOfMass;
	var y = -Math.cos(a) * this.distCenterOfMass;
	this.earth.pos.x = x;
	this.earth.pos.y = y;
}

World.prototype.moveSun = function() {
	// Yeah, lets briefly discard 2000 years of astronomy and pretend
        // the sun is orbitting the earth. It doesn't really matter for
        // this visualization...
	var a = this.time * 2 * Math.PI / this.earth.p;
	var x = Math.sin(a) * this.distEarthSun;
	var y = Math.cos(a) * this.distEarthSun;
	this.sun.pos.x = this.earth.pos.x + x;
	this.sun.pos.y = this.earth.pos.y + y;
}


World.prototype.move = function() {

	if (this.config.autoMove) {
		this.moveEarth();
		this.moveMoon();
		this.moveSun();
	}

	// update the position vectors
	this.vecEarthMoon = Vector.subtractEx(this.moon.pos, this.earth.pos);
	this.vecEarthSun = Vector.subtractEx(this.sun.pos, this.earth.pos);

	switch(this.config.lookAtTarget)
	{
		case 'Origin':
			this.lookAt = new Vector(0, 0);
			break;

		case 'Earth':
			this.lookAt = this.earth.pos.clone();
			break;

		case 'Moon':
			this.lookAt = this.moon.pos.clone();
			break;

		default:	
			this.lookAt = new Vector(0, 0);
	}
}

//-------------------------------------------------------------------------------------------------
//
// Updateing the forcefield indicators
//
//-------------------------------------------------------------------------------------------------

World.prototype.updateMoon = function() {
}


World.prototype.updateEarth = function() {
	var delta = 2 * Math.PI / this.numArrows;

	if (this.config.useDifferentScales==null || !this.config.useDifferentScales) {
		var scaleSize = 1;
		var scaleDist = 1;
	} else {
		var scaleSize = this.scaleSize;
		var scaleDist = this.scaleDist;
	}


	// Compute the acceleration at the earth center and store it as the first entry
	var zeroLength = 0;
	var accEarthMoon = this.vecEarthMoon.clone();
	accEarthMoon.normalize();
	accEarthMoon.multiplyValue(this.gamma * this.moon.m / Math.pow(this.vecEarthMoon.length() * scaleDist, 2));
	this.earth.tidalForce[0] = accEarthMoon; 

	var accEarthSun = this.vecEarthSun.clone();
	accEarthSun.normalize();
	accEarthSun.multiplyValue(this.gamma * this.sun.m / Math.pow(this.vecEarthSun.length() * scaleDist, 2));
	this.earth.tidalForceSun[0] = accEarthSun; 
     
	// Compute accelerations for the earths surface
	for (var i=1; i<this.numArrows + 1; ++i)
	{
		var posSurface = new Vector(Math.sin(i*delta) * this.earth.r * scaleSize,
        	                            Math.cos(i*delta) * this.earth.r * scaleSize);

		//
		// Tidal effect of the moon
		//

		var posMoon = this.vecEarthMoon.clone();
	  	posMoon.multiplyValue(scaleDist);

		// Create a normalized vector pointing from the earth surface to the moon center and compute 
		// the gavitation force
		var accMoon = Vector.subtractEx(posMoon, posSurface);
		accMoon.normalize();
		var len = Vector.subtractEx(posMoon, posSurface).length() + zeroLength;
		accMoon.multiplyValue(this.gamma * this.moon.m / (len*len));
		
		// The resulting Gravitational force
		this.earth.tidalForce[i] = accMoon; 

		//
		// Tidal effect of the sun
		//

		var posSun = this.vecEarthSun.clone();
	  	posSun.multiplyValue(scaleDist);

		// Create a normalized vector pointing from the earth surface to the moon center and compute 
		// the gavitation force
		var accSun = Vector.subtractEx(posSun, posSurface);
		accSun.normalize();
		var len = Vector.subtractEx(posSun, posSurface).length() + zeroLength;
		accSun.multiplyValue(this.gamma * this.sun.m / (len*len));
		
		// The resulting Gravitational force
		this.earth.tidalForceSun[i] = accSun; 
	}	
}

World.prototype.update = function() {
	this.time += this.ts;

	this.updateEarth();
	this.updateMoon();
}

//-------------------------------------------------------------------------------------------------
//
// Render Functions
//
//-------------------------------------------------------------------------------------------------

World.prototype.renderSun = function() {

	// draw sunbeams to the lookAt Position
	var cm = this.mapToScreen(this.lookAt);


	// Draw an arrow pointing from the sun towards earth
	var posSunScreen = this.mapToScreen(this.sun.pos, this.scaleDist);
        var posEarthScreen = this.mapToScreen(this.earth.pos, this.scaleDist);	

	var vecBeam = posSunScreen.clone().subtract(cm).normalize()
	var vecBeamOrtho = new Vector(vecBeam.y, -vecBeam.x).multiplyValue(this.earth.r * this.scaleDist)
	var offset = vecBeam.multiplyValue(this.earth.r * this.scaleDist * 0)

	// render 5 lightbeams as an indication of where the sun is
	for (var i=0; i<10; ++i)
        {
          this.ctx.drawArrow(posSunScreen.x, 
                             posSunScreen.y,
                             cm.x + i*vecBeamOrtho.x - offset.x, 
                             cm.y + i*vecBeamOrtho.y - offset.y, 
                             10, 
                             2, 
                             this.style.colSun);
		
          if (i>0) {
            this.ctx.drawArrow(posSunScreen.x,
                               posSunScreen.y, 
                               cm.x - i*vecBeamOrtho.x - offset.x, 
                               cm.y - i*vecBeamOrtho.y - offset.y, 
                               10, 
                               2, 
                               this.style.colSun);
          }
        }
}

World.prototype.renderMoon = function() {

	// compute the render position of the moon
	var posMoon = this.moon.pos.clone();
	posMoon = this.mapToScreen(posMoon, this.scaleDist);

	var r = this.moon.r * this.scaleSize;

	// bright side
	var colOutline = this.style.colMoonOutline;
	var thickness = 2;
	if (!this.config.setup==1) {
		var v = Math.round(128 + 128 * Math.sin(this.time*0.15));
		colOutline = 'rgb(' + v + ',' + v + ',' + v + ')'	
		thickness = 4;
	}

	this.ctx.drawCircle(posMoon, r, 0, 2 * Math.PI, this.style.colMoon, colOutline, thickness);

	// dark side
	if (this.config.showSun) {
		var a1 = this.vecEarthSun.verticalAngle();
		var a2 = a1 + Math.PI;
		this.ctx.drawCircle(posMoon, r, a1, a2, this.style.colMoonDark, this.style.colMoonOutline);
	}

	if (this.config.setup==0) {
		this.ctx.drawImage(this.dragDropImage, posMoon.x - r, posMoon.y - r, 2*r, 2*r);
	}

	var offset = this.moon.r * this.scaleSize;

	this.ctx.font="20px Arial";
	this.ctx.fillStyle='White';
	this.ctx.fillText("Moon", posMoon.x - 24, posMoon.y + offset + 25);

}


World.prototype.renderEarth = function() {
	// compute the render position based on the earth position and the camera position
	var posEarthScreen = this.mapToScreen(this.earth.pos, this.scaleSize);
	var r = this.earth.r * this.scaleSize;

	// Daysite
	this.ctx.drawCircle(posEarthScreen, r, 0, 2 * Math.PI, this.style.colEarth, this.style.colEarthOutline);

	// continents
	this.ctx.drawImage(this.continentsImage, posEarthScreen.x - r, posEarthScreen.y - r, 2*r, 2*r);

	// Nightside
	if (this.config.showSun) {
		var a1 = this.vecEarthSun.verticalAngle();
		var a2 = a1 + Math.PI;
		this.ctx.drawCircle(posEarthScreen, r, a1, a2, this.style.colEarthDark, this.style.colEarthOutline);
	}

	if (this.config.showGravAcc || this.config.showTidalAcc || this.config.showAccSum) {
		var results = [this.numArrows + 1];
	
		// Draw Vector arrows
		var delta = 2 * Math.PI / this.numArrows;
		for (var i=1; i<this.numArrows + 1; ++i) {
			// Earth position in world coordinates
			var posScreen = Vector.addEx(posEarthScreen, new Vector(Math.sin(i*delta) * this.earth.r * this.scaleSize,
	 							                Math.cos(i*delta) * this.earth.r * this.scaleSize));

			//
			// Tidal force Moon
			//

			var v1 = this.earth.tidalForce[i];
			v1.multiplyValue(this.forceMultiplier);
		
			if (this.config.showGravAcc) {
				this.ctx.drawVector(posScreen.x, posScreen.y, v1.x, v1.y, 5, 2, this.style.colVec1);	
			}				

			var v2 = this.earth.tidalForce[0].clone();
			v2.multiplyValue(this.forceMultiplier);

			if (this.config.showCentAcc) {
				this.ctx.drawVector(posScreen.x, posScreen.y, -v2.x, -v2.y, 5, 2, this.style.colVec2);
			}

			var v3 = Vector.subtractEx(v1, v2);
			if (this.config.showTidalAcc) {	
				this.ctx.drawVector(posScreen.x, posScreen.y, v3.x, v3.y, 4, 3, this.style.colVec3);	
			}

			//
			// Tidal force Sun
			//

			var v4 = this.earth.tidalForceSun[i];
			v4.multiplyValue(this.forceMultiplier);
		
			var v5 = this.earth.tidalForceSun[0].clone();
			v5.multiplyValue(this.forceMultiplier);

			var v6 = Vector.subtractEx(v4, v5);
			if (this.config.showTidalAccSun) {	
				this.ctx.drawVector(posScreen.x, posScreen.y, v6.x, v6.y, 4, 3, this.style.colVec4);
			}

			//
			// Combination of Sun and Moon forces
			//
			
			results[i] = { x : posScreen.x + v3.x + v6.x,
                                       y : posScreen.y + v3.y + v6.y };
		}


		if (this.config.showAccSum) {
			this.ctx.fillStyle = this.style.colWater;
			this.ctx.beginPath();
			this.ctx.moveTo(results[0].x, results[0].y);
			for (var i=1; i<this.numArrows + 1; ++i) {
				this.ctx.lineTo(results[i].x, results[i].y);
			}
			this.ctx.closePath();
			this.ctx.fill();
		}


		// Draw vectors at the earths center
		if (this.config.showGravAcc) {
			var tf = this.earth.tidalForce[0].clone();
			tf.multiplyValue(this.forceMultiplier);
			this.ctx.drawVector(posEarthScreen.x, posEarthScreen.y, tf.x, tf.y, 5, 4, this.style.colVec1);	
		}
	}

	if (this.config.showCentAcc) {
		this.ctx.drawVector(posEarthScreen.x, posEarthScreen.y, -tf.x, -tf.y, 5, 4, this.style.colVec2);	
	}

	// Draw Center of the earth and its acceleration vector
	this.ctx.drawCross(posEarthScreen.x, posEarthScreen.y, 2, 5, this.style.colCenterOfEarth);
}

World.prototype.renderSurfacePoints = function() {
	var v1 = this.earth.pos.clone().multiplyValue(this.earth.m);
	var v2 = this.moon.pos.clone().multiplyValue(this.moon.m);
	var cm = this.mapToScreen(Vector.addEx(v1, v2).divideValue(this.earth.m + this.moon.m));

	var orig = new Vector(0,  this.earth.r);
	// Orbits of 2 Reference Points at the earths surface
	for (var angle=0; angle<360; angle+=120)
        {
		// Vector from the earth center to a point at the surface
		var ref = orig.rotateEx(angle);

		// Point on the earth surface
		var point = Vector.addEx(this.earth.pos, ref);  // Point 1 on the surface	
		point = this.mapToScreen(point);

		// 
		var v = Vector.subtractEx(ref, point);
		v = v.normalize().multiplyValue(30);

		var refScreen = Vector.addEx(cm, ref.clone().multiplyValue(this.scaleSize));
		this.ctx.drawCircle(refScreen, this.distCenterOfMass * this.scaleSize, 0, 2*Math.PI, null, this.style.colVec1);
		this.ctx.drawCircle(point, 3, 0, 2*Math.PI, this.style.colVec1, this.style.colVec1);

		var v = Vector.subtractEx(point, refScreen);
		this.ctx.drawVector(point.x, point.y, v.x, v.y, 5, 2, this.style.colVec1, this.style.colVec1);
	}

	// Render an arrow at the earths center
	var ce = this.mapToScreen(this.earth.pos);
	this.ctx.drawVector(ce.x, ce.y, v.x, v.y, 5, 2, this.style.colOrbit, 'white');
}

World.prototype.renderOverlays = function() {
	// Draw Center of Mass of the system Earth-Moon
	var v1 = this.earth.pos.clone().multiplyValue(this.earth.m);
	var v2 = this.moon.pos.clone().multiplyValue(this.moon.m);
	var cm = this.mapToScreen(Vector.addEx(v1, v2).divideValue(this.earth.m + this.moon.m));
	this.ctx.drawCenterOfMass(cm, 6);

	// Render Reference Frame Origin
	if (this.config.showSurfacePoints) {
		this.renderSurfacePoints();
        }
}

World.prototype.renderUnderlay = function() {

	if (this.config.showEarthOrbit || this.config.showMoonOrbit) {
		// Draw Center of Mass of the system Earth-Moon
		var v1 = this.earth.pos.clone().multiplyValue(this.earth.m);
		var v2 = this.moon.pos.clone().multiplyValue(this.moon.m);
		var cm = this.mapToScreen(Vector.addEx(v1, v2).divideValue(this.earth.m + this.moon.m));

		// Earth Orbit
		if (this.config.showEarthOrbit) {
			this.ctx.drawCircle(cm, this.distCenterOfMass * this.scaleSize, 0, 2*Math.PI, null, this.style.colOrbit);
		}

		// Moon Orbit
		if (this.config.showMoonOrbit) {
			this.ctx.drawCircle(cm, (this.distMoonEarth - this.distCenterOfMass) * this.scaleDist, 0, 2*Math.PI, null, this.style.colOrbit);
		}
	}
}


World.prototype.render = function() {
	this.ctx.fillStyle = this.style.colBack;
	this.ctx.fillRect(0,0, this.w, this.h);

	if (this.config.showSun) {
                this.renderSun();
        }

	this.renderUnderlay();

	this.renderEarth();

	if (this.config.showMoon) {
        	this.renderMoon();	
	}


	this.renderOverlays();
}

//-------------------------------------------------------------------------------------------------
//
// Entrance point
//
//-------------------------------------------------------------------------------------------------


function tidalSimulation(cfg) {
	// Global variables
	var config = cfg;

	// The primary drawing canvas
	var cv = document.getElementById(config.cvid);
	var ctx = cv.getContext("2d");

	// Extend the context with a draw arrow function
	ctx.drawVector = function(x, y, vx, vy, len, w, col) {
		var x1 = x;
		var y1 = y;
		var x2 = x1 + vx;
		var y2 = y1 + vy;

		var a = Math.atan2(y2-y1, x2-x1);
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.lineTo(x2 - len * Math.cos(a - Math.PI/6), y2 - len * Math.sin(a - Math.PI/7));
		this.moveTo(x2, y2);
		this.lineTo(x2 - len * Math.cos(a + Math.PI/6), y2 - len * Math.sin(a + Math.PI/7));
		this.lineWidth = (w!=null) ? w : 2;
		this.strokeStyle = (col!=null) ? col : 'yellow';
		this.stroke();
		this.closePath();
	}


	ctx.drawArrow = function(x1, y1, x2, y2, len, w, col) {
		var a = Math.atan2(y2-y1, x2-x1);
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.lineTo(x2 - len * Math.cos(a - Math.PI/6), y2 - len * Math.sin(a - Math.PI/7));
		this.moveTo(x2, y2);
		this.lineTo(x2 - len * Math.cos(a + Math.PI/6), y2 - len * Math.sin(a + Math.PI/7));
		this.lineWidth = (w!=null) ? w : 2;
		this.strokeStyle = (col!=null) ? col : 'yellow';
		this.stroke();
		this.closePath();
	}

	ctx.drawCross = function(x, y, w, l, color) {
		this.beginPath();
		this.moveTo(x - l, y);
		this.lineTo(x + l, y);
		this.moveTo(x,     y - l);
		this.lineTo(x,     y + l);
		this.strokeStyle = color;
		this.lineWidth = w;
		this.stroke();
		this.closePath();
	}

	ctx.drawCircle = function(pos, r, a1, a2, color, colorOutline, lineWidth) {
		this.beginPath();
		this.arc(pos.x, pos.y, r, a1, a2);

		if (color!=null) {
			this.fillStyle = color;
			this.fill();
		}

		this.lineWidth = (lineWidth!=null) ? lineWidth : 2;
		this.strokeStyle = colorOutline;
		this.stroke();
		this.closePath();
	}

	ctx.drawCenterOfMass = function(pos, r) {
		this.fillStyle = 'white';
		this.beginPath();
		this.arc(pos.x, pos.y, r, 0, Math.PI/2);
		this.lineTo(pos.x, pos.y);
		this.closePath();
		this.fill();

		this.fillStyle = 'black';
		this.beginPath();
		this.arc(pos.x, pos.y, r, Math.PI/2, Math.PI);
		this.lineTo(pos.x, pos.y);
		this.closePath();
		this.fill();

		this.fillStyle = 'white';
		this.beginPath();
		this.arc(pos.x, pos.y, r, Math.PI, 1.5*Math.PI);
		this.lineTo(pos.x, pos.y);
		this.closePath();
		this.fill();

		this.fillStyle = 'black';
		this.beginPath();
		this.arc(pos.x, pos.y, r, 1.5*Math.PI, 2*Math.PI);
		this.lineTo(pos.x, pos.y);
		this.closePath();
		this.fill();
	}

	var world = new World(cv, config);

	function init(config) {
		if (config.isRunning) {
			timer = window.setInterval(tick, 30);
		} else {
			world.update();
			world.update();
			world.render();
		}
	}

	function tick() {
		world.update();
		world.render();
		world.move();
	}

	init(config);

	return world;
  }
