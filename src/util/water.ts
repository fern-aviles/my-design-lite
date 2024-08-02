import {Path, Circle, Canvas, util, Line, FabricText} from 'fabric'
/**
 * Water and water controls of a product
 * 
 * @extends Path
 */
export class Water extends Path {
  startController: Circle;
  endController: Circle;
  midController: Circle;
  product: Circle;
  infoLine: Line;
  infoText: FabricText;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  sweepAngle: number;
  selected: boolean;
  centerX: number;
  centerY: number;
  radius: number;
  minArc: number;
  maxArc: number;
  minRadius: number;
  maxRadius: number;
  fixedArc: boolean;
  waterScale: number;
  distance: number;

  declare canvas: Canvas;
  /**
   * Constructs a Water object with it's controllers
   * 
   * @param {any} options - The options object for Water.
   * @param {Circle} product 
   */
  constructor(options: any, product: Circle) {
    const startAngle = options.startAngle;
    const endAngle = options.endAngle;
    const centerX = options.centerX;
    const centerY = options.centerY;
    const radius = options.radius;
    
    // Every 20 pixels = 1 ft
    const waterScale = 20; 
    
    const canvas = options.canvas;
    
    let selected = true;
    options.hasBorder = false;
    options.hasControls = false;
    options.perPixelTargetFind = true;
    options.originX = 'center';
    options.originY = 'center';
    options.centeredScaling = true;
    options.selectable = false;
    
    // Generate the path data for the pie slice
    const pathData = Water.generatePathData(centerX, centerY, radius*waterScale, startAngle, endAngle);
    super(pathData, options);
    
    // Set instance variables
    this.product = product;
    this.product = product;
    this.selected = selected;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.centerX = product.getCenterPoint().x;
    this.centerY = product.getCenterPoint().y;
    this.waterScale = waterScale;
    this.radius = radius * this.waterScale;
    this.distance = this.radius;
    this.canvas = canvas;

    // Added constraints
    this.minArc = options.minArc;
    this.maxArc = options.maxArc;
    this.minRadius = options.minRadius;
    this.maxRadius = options.maxRadius;
    this.fixedArc = options.fixedArc;
    this.midAngle = 0;
    this.sweepAngle = this.getSweepAngle(startAngle, endAngle);
    this.set({left: centerX, top: centerY});
    
    // Add control circles
    const endControlXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(endAngle));
    this.endController = new Circle({
      left: endControlXY.x + centerX,
      top: endControlXY.y + centerY,
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

    const startControlXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(startAngle));
    this.startController = new Circle({
      left: startControlXY.x + centerX,
      top: startControlXY.y + centerY,
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

    const midAngle = this.computeMidAngle(startAngle, endAngle);
    this.midAngle = util.radiansToDegrees(midAngle);
    const midControllerXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(midAngle));
    this.midController = new Circle({
      left: midControllerXY.x + centerX,
      top: midControllerXY.y + centerY,
      radius: 7,
      fill: 'red',
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
      `${Math.round(distance/20)} ft, ${Math.round(util.radiansToDegrees(this.sweepAngle))}°`, {
      left: mid.x,
      top: mid.y,
      angle: textAngle,
      fontSize: 15,
      fill: 'red',
      originX: 'center',
      selectable: false,
    });

    // Add water and the control circles to the canvas
    // This line is used to put the water in the back - used to make products always clickable
    this.canvas.insertAt(0, this); 
    this.canvas.add(this.infoLine);
    this.canvas.add(this.infoText);
    this.canvas.add(this.endController);
    this.canvas.add(this.startController);
    this.canvas.add(this.midController);

    // Bind the event handlers to the control circles
    this.endController.on({'moving': (e) => {this.onControlCircleMoving(e)},
                          'deselected': (e) => {this.showControls(false)},
                          });
    this.startController.on({'moving': (e) => {this.onControlCircleMoving(e)},
                            'deselected': (e) => {this.showControls(false)},
                          });
    this.midController.on({'moving': (e) => {this.getRotation(e)},
                           'deselected': (e) => {this.showControls(false)},
                          });
    this.product.on({
      'moving': (e) => {this.set({left: this.product.left, top: this.product.top}), 
                                  this.handleWaterMoving(e), 
                                  this.updateBoundingBox()},
      'selected': (e) => {this.showControls(true)},
      'deselected': (e) => {this.showControls(false)},
    });
    this.canvas.renderAll();
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
  onControlCircleMoving(e: any) {
    const control = e.transform.target;
    const { x, y } = e.pointer;
    const centerX = this.getCenterPoint().x,
          centerY = this.getCenterPoint().y;
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);

    // Normalize angle
    angle = angle >= 0 ? angle : 360 + angle;

    // Snap to full circle
    let sweepAngle = util.radiansToDegrees(this.sweepAngle);
    let prevAngle = angle;
    if((0 <= sweepAngle && sweepAngle <= 5) || (sweepAngle <= 360 && sweepAngle >= 355)){
      if(control.controllerType === 'end'){
        angle = this.startAngle-.01;
        if(Math.abs(prevAngle - this.startAngle) >= 5 && Math.abs(prevAngle - this.startAngle) <= 355){
          angle = prevAngle;
        }
      }
      else{
        angle = this.endAngle+.01;
        if(Math.abs(prevAngle - this.endAngle) >= 5 && Math.abs(prevAngle - this.endAngle) <= 355){
          angle = prevAngle;
        }
      }
    }

    // Check what controller is being used based on the controllerType
    // and make sure it's within the specifications
    if (control.controllerType === 'end'){
      const newEndAngle = angle;
      this.sweepAngle = util.radiansToDegrees(this.getSweepAngle(this.startAngle, newEndAngle));

      // Check if the new angle is within the allowed range
      if (this.sweepAngle > this.maxArc) {
        this.endAngle = this.normalizeAngle(this.startAngle + this.maxArc, false);
      }
      else if (this.sweepAngle < this.minArc){
        this.endAngle = this.normalizeAngle(this.startAngle + this.minArc, false);
      }
      else {
        this.endAngle = this.normalizeAngle(newEndAngle, false);
      }
    }
    else if (control.controllerType === 'start'){
      const newStartAngle = angle;
      this.sweepAngle = util.radiansToDegrees(this.getSweepAngle(newStartAngle, this.endAngle));

      // Check if the new angle is within the allowed range
      if (this.sweepAngle > this.maxArc) {
        // 
        this.startAngle = this.normalizeAngle(this.endAngle - this.maxArc, false);
      }
      else if (this.sweepAngle < this.minArc){
        this.startAngle = this.normalizeAngle(this.endAngle - this.minArc, false);
      }
      else {
        this.startAngle = this.normalizeAngle(newStartAngle, false);
      }
    }

    // Calculate sweep angle
    this.sweepAngle = this.getSweepAngle(this.startAngle, this.endAngle);

    // Redraw path
    const pathData = Water.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.set({ path: new Path(pathData).path });
    
    // Update element positions to be on the arc
    this.setPointOnCircumference(control, angle);
    this.changeMidControllerPos(this.midController);
    this.handleInfo();

    // Re-render the canvas
    this.setCoords();
    this.showControls(true);
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
    this.showControls(true);
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
    const pathData = Water.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.set({ path: new Path(pathData).path });

    // Handling scaling and min/max radius constraints
    const midControllerCoords = this.midController.getCenterPoint();
    const waterCoords = this.getCenterPoint();
    let distanceApart = this.findDistancefromPoint(midControllerCoords.x, 
                                                   midControllerCoords.y, 
                                                   waterCoords.x, 
                                                   waterCoords.y);
    this.scale(distanceApart/this.radius);
    distanceApart = distanceApart/this.waterScale;
    let radiusScale = (this.radius/this.waterScale);
    if(distanceApart < this.minRadius * .75){
      this.scale((.75*this.minRadius)/radiusScale);
      this.changeMidControllerPos(this.midController);
    } 
    else if(distanceApart > this.maxRadius){
      this.scale(this.maxRadius/radiusScale);
      this.changeMidControllerPos(this.midController);
    }
    
    // Update the positions for startControl and endControl
    this.setPointOnCircumference(startControl, util.radiansToDegrees(newStartAngle));
    this.setPointOnCircumference(endControl, util.radiansToDegrees(newEndAngle));
    this.handleInfo();
    this.canvas.renderAll();
  };

/**
 * Handles the water movement which allows the controllers to be in the correct coordinates
 * @param {event} e 
 * @returns {null}
 */
  handleWaterMoving(e: any) { 
    this.setPointOnCircumference(this.startController, this.startAngle);
    this.setPointOnCircumference(this.endController, this.endAngle);
    this.changeMidControllerPos(this.midController);
    this.handleInfo();
    const pathData = Water.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.set({ path: new Path(pathData).path });
    this.canvas.renderAll();
  }

  /**
   * Changes position of the info line to be on the midController and product
   * 
   * @returns null
   */
  handleInfo() {
    // Changing infoLine position
    const productCoords = this.product.getCenterPoint();
    const midControllerCoords = this.midController.getCenterPoint();
    this.infoLine.set({
      x1: productCoords.x,
      y1: productCoords.y,
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
    this.distance = parseFloat((distance/this.waterScale).toFixed(2));
  }

  /**
   * Updates the bounding box for the water
   * @returns {null}
   */
  updateBoundingBox() {
    this.setCoords();
    this.startController.setCoords();
    this.endController.setCoords();
    this.midController.setCoords();
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
   * The function is used for setting the points on the circumference
   * of the circle
   * @param {any} controller: the radius of the product
   * @param {number} angle: the angle (in radians) of where the point is at
   * 
   * @returns {null}
   */
  setPointOnCircumference(controller: any, angle: number){
    angle = util.degreesToRadians(angle);
    const centerX = this.getCenterPoint().x,
          centerY = this.getCenterPoint().y,
          controllerType = controller.controllerType;
    
    // Check if the position of the controller is within
    // the sweep angle for startController or endController
    const sweepAngle = Math.round(util.radiansToDegrees(this.sweepAngle));
    if(sweepAngle >= this.maxArc){
      if(controllerType === 'end'){
        let newAngle = this.startAngle + this.maxArc;
        newAngle = this.normalizeAngle(this.startAngle + this.maxArc, false);
        angle = util.degreesToRadians(newAngle);
      }
      else if ( controllerType === 'start'){
        let newAngle = this.endAngle - this.maxArc;
        newAngle = this.normalizeAngle(newAngle, false);
        angle = util.degreesToRadians(newAngle);
      }
    }
    else if(sweepAngle <= this.minArc){
      if(controllerType === 'end'){
        let newAngle = this.startAngle + this.minArc;
        newAngle = this.normalizeAngle(newAngle, false);
        angle = util.degreesToRadians(newAngle);
      }
      else if ( controllerType === 'start'){
        let newAngle = this.endAngle - this.minArc;
        newAngle = this.normalizeAngle(newAngle, false);
        angle = util.degreesToRadians(newAngle);
      }
    }

    const x = centerX + ((this.scaleX * this.radius) * Math.cos(angle));
    const y = centerY + ((this.scaleX * this.radius) * Math.sin(angle));
    controller.set({ left: x, top: y });
    controller.setCoords();
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
    const angle = this.computeMidAngle(startAngle, endAngle);
    this.midAngle = util.radiansToDegrees(angle);
    const cx = this.getCenterPoint().x;
    const cy = this.getCenterPoint().y;
    const x = ((this.scaleX * this.radius) * Math.cos(angle)) + cx;
    const y = ((this.scaleX * this.radius) * Math.sin(angle)) + cy;
    midController.set({
      left: x,
      top: y,
      angleInRadians: angle,
      angleInDegrees: angle * (180/Math.PI),
    });
    midController.setCoords();
  };

  /**
   * Used for calculating the angle for the selected controller
   * @param {Circle} controller: One of the circles that control the arc
   * 
   * @returns {number}
   */
  calculateAngle(controller: Circle){
    let px = controller.getCenterPoint().x,
        py = controller.getCenterPoint().y,
        cx = this.getCenterPoint().x,
        cy = this.getCenterPoint().y;
    const dx = px - cx;
    const dy = py - cy;
    const angle = Math.atan2(dy, dx);
    return angle;
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
    this.maxArc = constraints.maxArc;
    this.minArc = constraints.minArc;
    this.maxRadius = constraints.maxRadius;
    this.minRadius = constraints.minRadius;
  }
}
export default Water;