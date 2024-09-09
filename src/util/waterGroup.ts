import { Canvas, Circle, FabricText, Group, Line, Path, util } from "fabric";
import { Controller } from './controller';
import type { HunterProduct } from "./product";

export class WaterGroup extends Group {
  startController: Circle;
  endController: Circle;
  midController: Circle;
  waterPath: Path;
  product: Circle;
  infoLine: Line;
  infoText: FabricText;
  startAngle: number;
  endAngle: number;
  sweepAngle: number;
  centerX: number = 100;
  centerY: number = 100;
  radius: number = 5;
  minArc: number = 0;
  maxArc: number = 360;
  minRadius: number = 4;
  maxRadius: number = 30;
  fixedArc: boolean = false;
  waterScale: number = 20;
  distance: number;
  omittedAngles: any = [];
  lock: boolean = false; 
  lock2: boolean = false;
  prevSnap: number | null = null;
  minScaling: number = 0.25;
  skipMovement: number = 0;
  prevDistance: number = 0;
  startingArc: any = 270;
  declare canvas: Canvas;

  /**
   * Constructs a Water object with it's controllers
   * 
   * @param {any} options - The options object for Water.
   * @param {Circle} product 
   */
  constructor(options: any, product: Circle) {
    options.objectCaching = true;
    super([], options);
    const startAngle = options.startAngle;
    const endAngle = options.endAngle;
    const radius = options.radius || this.radius;

    // Every 20 pixels = 1 ft
    const waterScale = 20; 

    this.startAngle = startAngle || 0;
    this.endAngle = endAngle || 270;
    this.sweepAngle = this.endAngle - this.startAngle;

    
    // Added constraints
    this.minArc = options.minArc || this.minArc; 
    this.maxArc = options.maxArc || this.maxArc;
    this.minRadius = options.minRadius || this.minRadius;
    this.maxRadius = options.maxRadius || this.maxRadius;
    this.fixedArc = options.fixedArc || this.fixedArc;
    this.sweepAngle = this.getSweepAngle(this.startAngle, this.endAngle);
    this.omittedAngles = options.omittedAngles || this.omittedAngles;
    this.startingArc = options.startingArc || this.startingArc;
    
    // Set instance variables
    this.product = product;
    this.centerX = this.product.getCenterPoint().x;
    this.centerY = this.product.getCenterPoint().y;
    this.waterScale = options.waterScale | waterScale;
    this.radius = radius * this.waterScale;
    this.distance = this.radius;

    // Set the canvas
    this.canvas = options.canvas;

    this.subTargetCheck = true;
    this.hasControls = false;
    this.interactive = true;
    // this.hasBorders = false;
    this.perPixelTargetFind = true;
    this.originX = 'center';
    this.originY = 'center';

    // Create Water Path
    const pathData = WaterGroup.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.waterPath = new Path(
      pathData, {
        left: this.product.left,
        top: this.product.top,
        fill: 'rgba(0, 0, 255, .2)',
        originX: 'center',
        originY: 'center',
        hasControls: false,
        hasBorders: false,
        selectable: false,
        perPixelTargetFind: true,
        lockMovementX: true,
        lockMovementY: true,
        objectCaching: true,
      }
    );

    // Add control circles
    const endControlXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(this.endAngle));
    this.endController = new Controller({
      left: endControlXY.x + this.centerX,
      top: endControlXY.y + this.centerY,
      radius: 7,
      fill: 'red',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: true,
      controllerType: 'end',
      water: this,
    });

    const startControlXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(this.startAngle));
    this.startController = new Controller({
      left: startControlXY.x + this.centerX,
      top: startControlXY.y + this.centerY,
      radius: 7,
      fill: 'red',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: true,
      controllerType: 'start',
      water: this,
    });

    let midAngle = this.computeMidAngle(this.startAngle, this.endAngle);
    const midControllerXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(midAngle));
    this.midController = new Controller({
      left: midControllerXY.x + this.centerX,
      top: midControllerXY.y + this.centerY,
      radius: 7,
      fill: 'yellow',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: true,
      controllerType: 'mid',
      water: this,
    });

    // Add info line
    this.infoLine = new Line(
      [ this.centerX,
        this.centerY,
        this.midController.left,
        this.midController.top
      ],
      {
        stroke: 'red',
        hasBorders: false,
        selectable: false,
      }
    );

    // Add info text
    const mid = this.findMidPoint(this.infoLine.x1,
                                  this.infoLine.y1,
                                  this.infoLine.x2,
                                  this.infoLine.y2);
    let textAngle = Math.atan2(this.infoLine.y2-this.infoLine.y1, 
                               this.infoLine.x2-this.infoLine.x1);
    textAngle = this.normalizeAngle(util.radiansToDegrees(textAngle), false);
    if(270 > textAngle && textAngle > 90){
      textAngle += 180;
    }
    const distance = this.findDistancefromPoint(this.infoLine.x1,
      this.infoLine.y1,
      this.infoLine.x2,
      this.infoLine.y2);
    this.infoText = new FabricText(
      `${Math.round(distance/20).toFixed(2)} ft, ${Math.round(util.radiansToDegrees(this.sweepAngle))}°`, {
      left: mid.x,
      top: mid.y,
      angle: textAngle,
      fontSize: 15,
      fill: 'red',
      originX: 'center',
      selectable: false,
    });
    
    this.canvas.add(
      this.waterPath,
      this.infoLine,
      this.infoText,
      this.startController,
      this.endController,
      this.midController,
    );
    
    // Add circles to the group
    this.add(
      this.waterPath,
      this.infoLine,
      this.infoText,
      this.startController,
      this.endController,
      this.midController,
    );
    
    this.canvas.remove(
      this.waterPath,
      this.infoLine,
      this.infoText,
      this.startController,
      this.endController,
      this.midController,
    );
    this.canvas.add(this);
    
    this.on({
      'mousedown': (e) => {console.log(this.getCoords());}
    });

    this.startController.on({
      'moving': (e) => {
        this.onControlCircleMoving(e);
      },
      'selected': (e) => {
        this.showControls(true)
        this.canvas.moveObjectTo(this.product, -1);
      },
      'deselected': (e) => {this.showControls(false)},
    });

    this.endController.on({
      'moving': (e) => {
        this.onControlCircleMoving(e);
      },
      'selected': (e) => {this.showControls(true)},
      'deselected': (e) => {this.showControls(false)},
    });

    this.midController.on({
      'moving': (e) => {
        this.getRotation(e);
      },
      'selected': (e) => {this.showControls(true)},
      'deselected': (e) => {this.showControls(false)},
    });

    this.product.on({
      'mousedown': () => {
        // this.canvas.sendObjectToBack(this);
        // this.canvas.bringObjectToFront(this.product);
        // this.canvas.bringObjectToFront(this.endController);
        // this.canvas.bringObjectToFront(this.midController);
        // this.canvas.bringObjectToFront(this.startController);
        // this.canvas.requestRenderAll();
      },
      'moving': (e) => {
        this.handleProductMoving(e);
      },
      'selected': (e) => {
        this.showControls(true)
        // this.canvas.moveObjectTo(this, 0)
        // this.canvas.moveObjectTo(this.startController, -1);
        // this.canvas.requestRenderAll();
      },
      'deselected': (e) => {this.showControls(false)
          this.canvas.moveObjectTo(this, 0)
          console.log(this.canvas.getObjects())

        },
      'mouseup': () => {
        // this.canvas.sendObjectToBack(this);
        // this.canvas.bringObjectToFront(this.product);
        // this.canvas.bringObjectToFront(this.endController);
        // this.canvas.bringObjectToFront(this.midController);
        // this.canvas.bringObjectToFront(this.startController);
        // this.canvas.requestRenderAll();
      }
    });

    // Add the group to the canvas
    this.setWaterArc(
      this.startAngle, 
      this.startAngle + this.startingArc,
      radius);
    this.setCoords();

    
    this.canvas.moveObjectTo(this, 0);

    console.log(this.canvas.getObjects()); // Check where the object is in the stacking order
  }
  
  /**
   * Generates the path data used to create the Water object
   * @param {number} centerX 
   * @param {number} centerY 
   * @param {number} radius 
   * @param {number} startAngle 
   * @param {number} endAngle 
   * @returns {string}
   */
  static generatePathData(centerX: number,
    centerY: number,
    radius: number,
    startAngle: number, 
    endAngle: number ) {
    const startX = centerX + radius * Math.cos(util.degreesToRadians(startAngle));
    const startY = centerY + radius * Math.sin(util.degreesToRadians(startAngle));
    const endX = centerX + radius * Math.cos(util.degreesToRadians(endAngle));
    const endY = centerY + radius * Math.sin(util.degreesToRadians(endAngle));
    startAngle = startAngle >= 0 ? startAngle : 360 + startAngle;
    startAngle *= (Math.PI/180);
    endAngle = endAngle >= 0 ? endAngle : 360 + endAngle;
    endAngle *= (Math.PI/180);
    let sweep = endAngle - startAngle;

    // Normalize the sweep angle to ensure it's between 0 and 2*PI radians.
    while (sweep < 0) sweep += 2 * Math.PI;
    while (sweep > 2 * Math.PI) sweep -= 2 * Math.PI;

    const largeArcFlag = sweep <= Math.PI ? 0 : 1;
    return [
    `M ${centerX} ${centerY}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    'Z'
    ].join(' ');
  }


  /**
   * Handles the movement of the start and end controllers
   * @param {evemt} e 
   */
  onControlCircleMoving(e: any){
    const t1 = performance.now()
    // console.time('start')
    const control = e.transform.target;
    let bigCircleCenterX = this.waterPath.left;
    let bigCircleCenterY = this.waterPath.top;
    let pointerX = control.left;
    let pointerY = control.top;
    let angle = Math.atan2(pointerY - bigCircleCenterY, pointerX - bigCircleCenterX) * (180 / Math.PI);

    // Normalize angle
    angle = this.normalizeAngle(angle, false);

    // Check for angles that are omitted
    angle = this.checkOmittedAngles(angle, control.controllerType);

    // Check for minimum and maximum arcs
    angle = this.checkArcSettings(angle, control.controllerType);

    // Check what controller is being used based on the controllerType
    // and make sure it's within the specifications
    if (control.controllerType === 'end'){
      this.endAngle = this.normalizeAngle(angle, false);
    }
    else if (control.controllerType === 'start'){
      this.startAngle = this.normalizeAngle(angle, false);
    }

    // Calculate sweep angle
    this.sweepAngle = this.getSweepAngle(this.startAngle, this.endAngle);

    // Redraw path
    const pathData = WaterGroup.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.waterPath.set({ path: new Path(pathData).path });

    // Update element positions to be on the arc
    this.setPointOnCircumference(control, angle);
    this.changeMidControllerPos(this.midController);
    this.handleInfo();

    // Re-render the canvas
    this.setCoords();
    this.showControls(true);
    this.canvas.requestRenderAll();
    const t2 = performance.now()
    // console.log('performance',(t2-t1) )
    // console.timeEnd("start")
  }
  
  /**
   * Calculates the rotation of the radius in turn, changes control 
   * angles so it reflects the changes properly anytime the radius
   * is being rotated.
   * @param {Circle} midControl 
   * @returns {null}
   */
  getRotation(midController: any){
    // this.showControls(true);
    const startControl = this.startController,
          endControl = this.endController;

    // Calculate the new angle of the midControl
    let midAngle = this.calculateAngle(this.midController);

    // Calculate the initial angles of startControl and endControl
    const initialStartAngle = this.startAngle;
    const initialEndAngle = this.endAngle;

    // Calculate the initial angle difference between startControl and endControl
    const initialAngleDifference = this.getSweepAngle(initialStartAngle, initialEndAngle);

    // Calculate the new angles for startControl and endControl
    const newStartAngle = midAngle - initialAngleDifference / 2;
    const newEndAngle = midAngle + initialAngleDifference / 2;

    // Change the angles of the controllers and radius
    this.startAngle = this.normalizeAngle(util.radiansToDegrees(newStartAngle), false);
    this.endAngle = this.normalizeAngle(util.radiansToDegrees(newEndAngle), false);
    
    // Create the new pathData object to use as the new arc
    const pathData = WaterGroup.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.waterPath.set({ path: new Path(pathData).path });

    // Handling scaling and min/max radius constraints
    const midControllerCoords = this.midController.getCenterPoint();
    const waterCoords = this.waterPath.getCenterPoint();
    let distanceApart = this.findDistancefromPoint(midControllerCoords.x, 
                                                   midControllerCoords.y, 
                                                   waterCoords.x, 
                                                   waterCoords.y);
    this.waterPath.scale(distanceApart/this.radius);
    distanceApart = distanceApart/this.waterScale;
    let radiusScale = (this.radius/this.waterScale);
    if(distanceApart < this.minRadius * (1-this.minScaling)){
      this.waterPath.scale(((1-this.minScaling)*this.minRadius)/radiusScale);
      this.changeMidControllerPos(this.midController);
    } 
    else if(distanceApart > this.maxRadius){
      this.waterPath.scale(this.maxRadius/radiusScale);
      this.changeMidControllerPos(this.midController);
    }
    
    // Update the positions for startControl and endControl
    this.setPointOnCircumference(startControl, util.radiansToDegrees(newStartAngle));
    this.setPointOnCircumference(endControl, util.radiansToDegrees(newEndAngle));
    this.handleInfo();
    this.canvas.requestRenderAll();
  }

  /**
   * The function is used for setting the points on the circumference
   * of the circle
   * @param {any} controller: the radius of the product
   * @param {number} angle: the angle (in radians) of where the point is at
   * 
   * @returns {null}
   */
  setPointOnCircumference(controller: any, angle: number){
    angle = util.degreesToRadians(angle);
    const centerX = this.waterPath.left,
          centerY = this.waterPath.top;
    
    const x = ((this.waterPath.scaleX * this.radius) * Math.cos(angle)) + centerX;
    const y = ((this.waterPath.scaleX * this.radius) * Math.sin(angle)) + centerY;
    controller.set({ left: x, top: y });
    controller.setCoords();
  }

  /**
   * Handles the water movement which allows the controllers to be in the correct coordinates
   * @param {event} e 
   * @returns {null}
   */
  handleProductMoving(e: any){
    this.set({
      left: this.product.left,
      top: this.product.top,
    });
    this.setCoords();
    this.waterPath.setCoords();
    this.setPointOnCircumference(this.startController, this.startAngle);
    this.setPointOnCircumference(this.endController, this.endAngle);
    this.changeMidControllerPos(this.midController);
    this.handleInfo();
  }
  
  /**
   * Changes position of the info line to be on the midController and product
   * 
   * @returns null
   */
  handleInfo() {
    // Changing infoLine position
    const waterCoords = {
      x: this.waterPath.left,
      y: this.waterPath.top
    };
    const midControllerCoords = {
      x: this.midController.left,
      y: this.midController.top
    };    
    this.infoLine.set({
      x1: waterCoords.x,
      y1: waterCoords.y,
      x2: midControllerCoords.x,
      y2: midControllerCoords.y,
    });

    // Modifying infoText position and information
    const mid = this.findMidPoint(this.infoLine.x1,
                                  this.infoLine.y1,
                                  this.infoLine.x2,
                                  this.infoLine.y2
    );
    let textAngle = Math.atan2(this.infoLine.y2-this.infoLine.y1, 
                               this.infoLine.x2-this.infoLine.x1);
    textAngle = this.normalizeAngle(util.radiansToDegrees(textAngle), false);
    if(270 > textAngle && textAngle > 90){
      textAngle += 180;
    }
    const distance = this.findDistancefromPoint(this.infoLine.x1,
      this.infoLine.y1,
      this.infoLine.x2,
      this.infoLine.y2);
    this.infoText.set({
      text: `${(distance/this.waterScale).toFixed(2)} ft, ${Math.round(util.radiansToDegrees(this.sweepAngle))}°`,
      left: mid.x,
      top: mid.y,
      angle: textAngle,
    });
    this.prevDistance = this.distance;
    this.distance = parseFloat((distance/this.waterScale).toFixed(5));
  }

  /**
   * The function is used for getting the points on the circumference of the 
   * @param {number} radius: the radius of the product
   * @param {number} angle: the angle (in radians) of where the point is at
   * 
   * @returns {x: number, y: number} x and y coordinate of the point
   */
  getPointOnCircumference(radius: number, angle: number){
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return {x, y};
  }

  /**
   * Used for getting the angle of the middle controller
   * @param {number} startAngle: in radians
   * @param {number} endAngle: in radians
   * 
   * @returns {number} midAngle: in radians
   */
  computeMidAngle(startAngle: number, endAngle: number){
    startAngle = startAngle >= 0 ? startAngle : 360 + startAngle;
    endAngle = endAngle >= 0 ? endAngle : 360 + endAngle;
    let midAngle;
    if (endAngle < startAngle) {
      midAngle = (startAngle + endAngle + Math.PI * 2) / 2;
    } else {
      midAngle = (startAngle + endAngle) / 2;
    }
    return midAngle >= 0 ? midAngle : 360 + midAngle;
  }

  /**
 * Changes the position of the middle controller whenever one of the arc
 * controllers change positions
 * @param {Circle} midController: controller that changes the arc's radius
 * 
 * @returns {null}
 */
  changeMidControllerPos(midController: Circle){
    const startAngle = util.degreesToRadians(this.startAngle); 
    const endAngle = util.degreesToRadians(this.endAngle);
    let angle = this.computeMidAngle(startAngle, endAngle);
    angle *= (180/Math.PI);
    this.setPointOnCircumference(midController, angle);
  }

  /**
   * Used for setting the angle between 0 and Math.PI * 2
   * or 0 and 360 depending if the angle is in radians
   * @param {number} angle: in radians
   * @param {boolean} radians: true if radians, false if not
   * 
   * @returns {number} an angle between 0 and 2* PI or 0 and 360
   */
  normalizeAngle(angle: number, radians=true){
    if (radians){
      while (angle < 0) {
        angle += Math.PI * 2;
      }
      while (angle >= Math.PI * 2) {
        angle -= Math.PI * 2;
      }
    }
    else{
      while (angle < 0) {
        angle += 360;
      }
      while (angle >= 360) {
        angle -= 360;
      }
    }
    return angle;
  }
    
  /**
   * Gets the sweep angle beteween 2 points
   * @param startAngle: radians
   * @param endAngle: radians
   * @returns sweep
   */
  getSweepAngle(startAngle: number, endAngle: number){
    startAngle *= (Math.PI/180);
    endAngle *= (Math.PI/180);
    let sweep = endAngle - startAngle;

    // Normalize the sweep angle to ensure it's between 0 and 2*PI radians.
    while (sweep < 0) sweep += 2 * Math.PI;
    while (sweep > 2 * Math.PI) sweep -= 2 * Math.PI;
    return sweep;
  }

  /**
   * Used for calculating the angle for the selected controller
   * @param {Circle} controller: One of the circles that control the arc
   * 
   * @returns {number}
   */
  calculateAngle(controller: Circle){
    let px = controller.getCenterPoint().x,
        py = controller.getCenterPoint().y,
        cx = this.waterPath.getCenterPoint().x,
        cy = this.waterPath.getCenterPoint().y;
    const dx = px - cx;
    const dy = py - cy;
    const angle = Math.atan2(dy, dx);
    return angle;
  }
  
  /**
   * Checks the water object is not under the minimum or 
   * over the maximum arc angle
   * @param angle 
   * @param control 
   * @returns 
   */
  checkArcSettings(angle: number, control: string): number{
    let sweepAngle;
    angle = this.normalizeAngle(angle, false);
    if(control === "start"){
      sweepAngle = this.getSweepAngle(angle, this.endAngle) * (180/Math.PI);
      if (sweepAngle < this.minArc){
        angle = this.endAngle - this.minArc;
      }
      else if (sweepAngle > this.maxArc ){
        angle = this.endAngle - this.maxArc;
      }
      else if ((0 <= sweepAngle && sweepAngle <= 5) || (355 <= sweepAngle && sweepAngle <= 360)){
        angle = this.endAngle +.001;
      }
    }
    if(control === "end"){
      sweepAngle = this.getSweepAngle(this.startAngle, angle) * (180/Math.PI);
      if (sweepAngle < this.minArc){
        angle = this.startAngle + this.minArc;
      }
      else if (sweepAngle > this.maxArc){
        angle = this.startAngle + this.maxArc;
      }
      else if ((0 <= sweepAngle && sweepAngle <= 5) || (355 <= sweepAngle && sweepAngle <= 360)){
        angle = this.startAngle - .001;
      }
    }
    return this.normalizeAngle(angle, false);
  }

  /**
   * Checks for angles the arc should not be in
   * @param angle 
   * @param control 
   * @returns {number}
   */
  checkOmittedAngles(angle: number, control: string): number{
    if(this.omittedAngles.length === 0){
      return angle;
    }
    let sweepAngle;

    // Checking if we are over the max or under the min arc
    if (control === 'start'){
      sweepAngle = this.getSweepAngle(angle, this.endAngle) * (180/Math.PI);
      if(sweepAngle > this.maxArc){
        this.prevSnap = null;
        return this.endAngle - (this.maxArc - 0.001);
      }
      if(sweepAngle < this.minArc){
        this.prevSnap = null;
        return this.endAngle - (this.minArc - 0.001);
      }
    }
    else{
      sweepAngle = this.getSweepAngle(this.startAngle, angle) * (180/Math.PI);
      if(sweepAngle > this.maxArc){
        this.prevSnap = null;
        return this.startAngle + (this.maxArc - 0.001);
      }
      if(sweepAngle < this.minArc){
        this.prevSnap = null;
        return this.startAngle + (this.minArc - 0.001);
      }
    }

    // Look for angle to snap to
    let snapped = false;
    for (let snapPoint of this.omittedAngles) {
      if (Math.abs(sweepAngle - snapPoint) <= 5) {
        sweepAngle = snapPoint;
        this.prevSnap = snapPoint;
        snapped = true;
        break;
      }
    }

    if (!snapped && this.prevSnap !== null) {
      const lastSnapIndex = this.omittedAngles.indexOf(this.prevSnap);

      // Check if we should snap to the next snap point
      // Moving forwards
      if (sweepAngle > this.prevSnap + 5) {
        const nextSnapPoint = this.omittedAngles[lastSnapIndex + 1];
        if (lastSnapIndex < this.omittedAngles.length - 1) {
          sweepAngle = nextSnapPoint;
        }
      }

      // Moving backwards
      else if (sweepAngle < this.prevSnap - 5) {
        if (lastSnapIndex > 0) {
          const prevSnapPoint = this.omittedAngles[lastSnapIndex - 1];
          sweepAngle = prevSnapPoint;
        }
      }
    }
    // Make sure to not snap to 
    else if (!snapped && this.prevSnap === null){
      let closest = this.omittedAngles[0];

      for (let i = 1; i < this.omittedAngles.length; i++) {
          const current = this.omittedAngles[i];
  
          if (sweepAngle >= closest && sweepAngle <= current) {
              // Check if sweepAngle is closer to closest or current
              closest = (sweepAngle - closest <= current - sweepAngle) ? closest : current;
              break;
          } else if (sweepAngle < closest) {
              // If the sweepAngle is less than the first element, return sweepAngle
              closest = sweepAngle;
              break;
          }
      }
      sweepAngle = closest;
    }
    if (control === 'start'){
      angle = this.endAngle - (sweepAngle - .0001);
    }
    else{
      angle = this.startAngle + (sweepAngle - .0001);
    }
   
    return this.normalizeAngle(angle, false);
  }

  /**
   * Finds the distance from (x1, y2) and (x2, y2).
   * @param {number} x1 
   * @param {number} y1 
   * @param {number} x2 
   * @param {number} y2 
   * 
   * @returns {number}
   */
  findDistancefromPoint(x1: number, y1: number, x2: number, y2: number){
    const x_dif = x2 - x1;
    const y_dif = y2 - y1;
    const distance = Math.sqrt(Math.pow(x_dif, 2) + Math.pow(y_dif, 2));
    return distance;
  }
  
  /**
   * Finds the point between (x1, y2) and (x2, y2).
   * @param {number} x1 
   * @param {number} y1 
   * @param {number} x2 
   * @param {number} y2 
   * 
   * @returns {number}
   */
  findMidPoint(x1: number, y1: number, x2: number, y2: number){
    const x_sum = x1 + x2;
    const y_sum = y1 + y2;
    const x_mid = x_sum / 2;
    const y_mid = y_sum / 2;
    return {x: x_mid, y: y_mid};
  }

  /**
   * Returns the start angle of the water object
   * 
   * @returns {number} start angle (in degrees)
   */
  getStartAngle(){
    return this.startAngle;
  }

  /**
   * Returns the end angle of the water object
   * 
   * @returns {number} end angle (in degrees)
   */
  getEndAngle(){
    return this.endAngle;
  }

  /**
   * Returns the radius of the water object
   * 
   * @returns {number} angle (in degrees)
   */
  getRadius(){
    return this.distance;
  }

  /**
   * Returns the arc angle of the water object
   * 
   * @returns {number} arc angle (in degrees)
   */
  getArcAngle(){
    return Math.round(util.radiansToDegrees(this.sweepAngle));
  }

  /**
   * Changes the min and max arc and radius of the water
   * object
   * 
   * @returns {null}
   */
  setConstraints(constraints: any){
    this.maxArc = constraints.maxArc || this.maxArc;
    this.minArc = constraints.minArc || this.minArc;
    this.maxRadius = constraints.maxRadius || this.maxRadius;
    this.minRadius = constraints.minRadius || this.minRadius;
  }

  /**
   * Sets the water object to a specific arc
   * @param start 
   * @param end 
   */
  setWaterArc(start: number, end: number, distance: number=this.distance){
    this.startAngle = this.normalizeAngle(start, false);
    this.endAngle = this.normalizeAngle(end, false);

    this.sweepAngle = this.getSweepAngle(this.startAngle, this.endAngle);
    distance *= this.waterScale;
    this.waterPath.scale(distance/this.radius);

    // Redraw path
    const pathData = WaterGroup.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.waterPath.set({ path: new Path(pathData).path });
    
    // Update element positions to be on the arc
    this.setPointOnCircumference(this.startController, this.startAngle);
    this.setPointOnCircumference(this.endController, this.endAngle);
    this.changeMidControllerPos(this.midController);
    this.handleInfo();

    // Re-render the canvas
    this.setCoords();
    this.showControls(true);
    this.canvas.requestRenderAll();
  }

  /**
   * Sets the minimum scaling
   * @param scale 
   */
  setMinScaling(scale: number): void {
    this.minScaling = scale;
  }

  /**
   * Updates the water distance scaling
   * @param waterScale 
   */
  updateWaterScale(waterScale: number): void {
    this.waterScale = waterScale;
  }

  /**
   * Sets new omitted angles
   * @param angles 
   */
  setOmittedAngles(angles: any): void {
    this.omittedAngles = angles;
  }

  /**
   * Toggle for showing the Water controls
   * @param {boolean} show 
   */
  showControls(show: boolean){
    this.startController.set({visible: show});
    this.endController.set({visible: show});
    this.midController.set({visible: show});
    this.infoLine.set({visible: show});
    this.infoText.set({visible: show});

    if(show){
      this.canvas.moveObjectTo(this, -2);
    }
    else{
      this.canvas.moveObjectTo(this, 0)
    }
  }
}