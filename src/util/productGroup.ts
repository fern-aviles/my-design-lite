import { Canvas, Circle, Group, Path, util } from "fabric";
import { Controller } from './controller';

export class ProductGroup extends Group {
  startController: Circle;
  endController: Circle;
  midController: Circle;
  waterPath: Path;
  small: Circle;
  product: Circle;
  canvas: Canvas;
  centerX: number = 100;
  centerY: number = 100;
  radius: number = 100;
  startAngle: number;
  endAngle: number;
  sweepAngle: number;
  waterScale: number = 20;


  constructor(options: any) {
    const startAngle = options.startAngle;
    const endAngle = options.endAngle;
    super([], options);

    this.startAngle = startAngle || 0;
    this.endAngle = endAngle || 270;
    this.sweepAngle = this.endAngle - this.startAngle

    // Set the canvas
    this.canvas = options.canvas;

    this.subTargetCheck = true;
    this.hasControls = false;
    this.interactive = true;
    this.hasBorders = true;
    // this.perPixelTargetFind = true;

    // Create Water Path
    const pathData = ProductGroup.generatePathData(100, 100, this.radius, this.startAngle, this.endAngle);
    this.waterPath = new Path(
      pathData, {
      left: 100,
      top: 100,
      fill: 'blue',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: false,
      perPixelTargetFind: true,
      lockMovementX: true,
      lockMovementY: true,
    }
  );

    // Create the small circle
    this.small = new Circle({
      radius: 10,
      left: 140, // Set initially on the circumference of the waterPath circle
      top: 100,
      fill: 'blue',
      hasControls: false,
      hasBorders: false,
      originX: 'center',
      originY: 'center',
    });

    // Create 'product' 
    this.product = new Circle({
      radius: 10,
      left: 100, // Set initially on the circumference of the waterPath circle
      top: 100,
      fill: 'green',
      hasControls: false,
      hasBorders: false,
      originX: 'center',
      originY: 'center',
    });

    this.centerX = this.product.getCenterPoint().x;
    this.centerY = this.product.getCenterPoint().y;


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
    // midAngle = util.radiansToDegrees(midAngle);
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


    // Add circles to the group
    
    this.add(this.waterPath);
    this.add(this.startController);
    this.add(this.endController);
    this.add(this.midController);
    this.add(this.product);


    this.on({
      'mousedown': (e) => {console.log(this.getCoords());}
    });
    
    this.small.on('moving', (e) => {
      // this.setPointOnCircumference(e);
    });

    this.startController.on({
      'moving': (e) => {
        this.onControlCircleMoving(e);
      }
    })
    this.endController.on({
      'moving': (e) => {
        this.onControlCircleMoving(e);
      }
    })
    this.midController.on({
      'moving': (e) => {
        this.getRotation(e);
      }
    })

    this.product.on({
      'moving': (e) => {
        this.handleProductMoving(e);
        // this.handleWaterMoving(e);
      }
    });
    // Add the group to the canvas
    this.canvas.add(this);
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

  handleProductMoving(e: any){
    this.waterPath.set({
      left: this.product.left,
      top: this.product.top,
    });
    this.setPointOnCircumference(this.startController, this.startAngle);
    this.setPointOnCircumference(this.endController, this.endAngle);
    this.changeMidControllerPos(this.midController);
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
    console.log(x, y)
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
  };





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
  };

    /**
   * Handles the movement of the start and end controllers
   * @param {evemt} e 
   */
    onControlCircleMoving(e: any) {
      const control = e.transform.target;
      let bigCircleCenterX = this.waterPath.left;
      let bigCircleCenterY = this.waterPath.top;
      let pointerX = control.left;
      let pointerY = control.top;
      let angle = Math.atan2(pointerY - bigCircleCenterY, pointerX - bigCircleCenterX) * (180 / Math.PI);
  
      // Normalize angle
      angle = this.normalizeAngle(angle, false);
  
      // // Check for angles that are omitted
      // angle = this.checkOmittedAngles(angle, control.controllerType);
  
      // // Check for minimum and maximum arcs
      // angle = this.checkArcSettings(angle, control.controllerType);
  
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
      const pathData = ProductGroup.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
      this.waterPath.set({ path: new Path(pathData).path });
      
      // Update element positions to be on the arc
      this.setPointOnCircumference(control, angle);
      this.changeMidControllerPos(this.midController);
      // this.handleInfo();
  
      // Re-render the canvas
      this.setCoords();
      // this.showControls(true);
      this.canvas.renderAll();
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
    const pathData = ProductGroup.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
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
    // if(distanceApart < this.minRadius * (1-this.minScaling)){
    //   this.scale(((1-this.minScaling)*this.minRadius)/radiusScale);
    //   this.changeMidControllerPos(this.midController);
    // } 
    // else if(distanceApart > this.maxRadius){
    //   this.scale(this.maxRadius/radiusScale);
    //   this.changeMidControllerPos(this.midController);
    // }
    
    // Update the positions for startControl and endControl
    this.setPointOnCircumference(startControl, util.radiansToDegrees(newStartAngle));
    this.setPointOnCircumference(endControl, util.radiansToDegrees(newEndAngle));
    // this.handleInfo();
    this.canvas.renderAll();
  };


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
  };
    
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
  };


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
  };
}