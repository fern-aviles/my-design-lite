import {Path, Circle, Canvas, util} from 'fabric'

export class Water extends Path {
  startController: Circle;
  endController: Circle;
  midController: Circle;
  rotor: Circle;
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

  declare canvas: Canvas;

  constructor(options: any, rotor: Circle) {
    const startAngle = options.startAngle;
    const endAngle = options.endAngle;
    const centerX = options.centerX;
    const centerY = options.centerY;
    const radius = options.radius;
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
    const pathData = Water.generatePathData(centerX, centerY, radius, startAngle, endAngle);
    super(pathData, options);
    
    // Set instance variables
    this.rotor = rotor;
    this.selected = selected;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.centerX = rotor.getCenterPoint().x;
    this.centerY = rotor.getCenterPoint().y;
    this.radius = radius;
    this.canvas = canvas;
    this.minArc = options.minArc;
    this.maxArc = options.maxArc;
    this.minRadius = options.minRadius;
    this.maxRadius = options.maxRadius;
    this.fixedArc = options.fixedArc;
    this.midAngle = 0;
    this.sweepAngle = this.getSweepAngle(startAngle, endAngle);
    this.set({left: centerX, top: centerY});
    console.log(options)
    // Add control circles
    const endControlXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(endAngle));
    this.endController = new Circle({
      left: endControlXY.x + centerX,
      top: endControlXY.y + centerY,
      radius: 5,
      fill: 'red',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: true,
      controllerType: 'end',
    });

    const startControlXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(startAngle));
    this.startController = new Circle({
      left: startControlXY.x + centerX,
      top: startControlXY.y + centerY,
      radius: 5,
      fill: 'red',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: true,
      controllerType: 'start',
    });

    const midAngle = this.computeMidAngle(startAngle, endAngle);
    this.midAngle = util.radiansToDegrees(midAngle);
    const midControllerXY = this.getPointOnCircumference(this.radius, util.degreesToRadians(midAngle));
    this.midController = new Circle({
      left: midControllerXY.x + centerX,
      top: midControllerXY.y + centerY,
      radius: 5,
      fill: 'red',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: true,
      controllerType: 'mid',
    });

    // Add water and the control circles to the canvas
    this.canvas.insertAt(0, this) // This line is used to put the water in the back - used to make rotors always clickable
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
    this.rotor.on({
      'moving': (e) => {this.set({left: this.rotor.left, top: this.rotor.top}), this.handleWaterMoving(e), this.updateBoundingBox()},
      'selected': (e) => {this.showControls(true)},
      'deselected': (e) => {this.showControls(false)},
    });
    this.canvas.renderAll()
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
    console.log(this.sweepAngle * (180/Math.PI))
    // if(util.radiansToDegrees(this.sweepAngle) > this.maxArc){
    //   this.sweepAngle = util.degreesToRadians(this.maxArc)
    //   console.log("Returning")
    //   return
    // }
    if(this.handleMaxArc()){
      console.log("returning........")
      return
    }
    const control = e.transform.target;
    const { x, y } = e.pointer;
    const centerX = this.getCenterPoint().x,
          centerY = this.getCenterPoint().y
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);

    // Check what controller is being used based on the controllerType
    if (control.controllerType === 'end'){
      this.endAngle = angle >= 0 ? angle : 360 + angle; // Normalize angle
      angle = this.endAngle;

    }
    else if (control.controllerType === 'start'){
      this.startAngle = angle >= 0 ? angle : 360 + angle; // Normalize angle
      angle = this.startAngle;
    }
    this.sweepAngle = this.getSweepAngle(this.startAngle, this.endAngle)
    // Update the path data based on the new control circle position
    if (this.handleMaxArc()){
      console.log("true")
      return
    }
    const pathData = Water.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.set({ path: new Path(pathData).path });
    
    // Update control circle position to be on the arc
    this.setPointOnCircumference(control, angle);

    // console.log(this.startAngle, this.endAngle);
    this.changeMidControllerPos(this.midController);

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

    // Update the positions for startControl and endControl
    this.setPointOnCircumference(startControl, util.radiansToDegrees(newStartAngle));
    this.setPointOnCircumference(endControl, util.radiansToDegrees(newEndAngle));

    // Change the angles of the controllers and radius
    this.startAngle = this.normalizeAngle(util.radiansToDegrees(newStartAngle), false);
    this.endAngle = this.normalizeAngle(util.radiansToDegrees(newEndAngle), false);

    // Create the new pathData object to use as the new arc
    const pathData = Water.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.set({ path: new Path(pathData).path });

    // Handling scaling
    const midControllerCoords = this.midController.getCenterPoint();
    const waterCoords = this.getCenterPoint();
    this.scale(this.findDistancefromPoint(midControllerCoords.x, midControllerCoords.y, waterCoords.x, waterCoords.y)/this.radius);

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
    const pathData = Water.generatePathData(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.set({ path: new Path(pathData).path });
    this.canvas.renderAll();
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
  }
/**
 * handleMaxArc makes sure the arc is not modified it 
 * the sweepAngle is bigger than the maxArc (returns true)
 * If the sweepAngle is within the maxArc, then the arc
 * can be modified.
 */
  handleMaxArc(){
    const sweepAngle = util.radiansToDegrees(this.sweepAngle);
    // console.log(sweepAngle)
    if(sweepAngle > this.maxArc){
      this.setPointOnCircumference(this.startController, this.startAngle);
      this.setPointOnCircumference(this.endController, this.endAngle);
      this.sweepAngle = util.degreesToRadians(this.maxArc)
      return true;
    }
    return false;
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
   * @param {number} radius: the radius of the rotor
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
   * @param {number} controller: the radius of the rotor
   * @param {number} angle: the angle (in radians) of where the point is at
   * 
   * @returns {null}
   */
  setPointOnCircumference(controller: Circle, angle: number){
    angle = util.degreesToRadians(angle)
    const centerX = this.getCenterPoint().x,
          centerY = this.getCenterPoint().y
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
}
export default Water;