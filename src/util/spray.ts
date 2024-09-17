import { Canvas, util, Control, Circle, type TPointerEvent, Group } from "fabric";

export class Spray extends Circle {
  startAngle: number;
  endAngle: number;
  radius: number;
  sweepAngle: number;
  midAngle: number;
  minArc: number = 90;
  maxArc: number = 360;
  declare product: Mover;
  declare canvas: Canvas;
  selected: boolean = false;
  omittedAngles: any = [270, 360];
  prevSnap!: number | null;
  waterScale: number = 20;
  prevDistance: any;
  fixedArc: boolean = true;
  maxRadius: number = 20;
  minRadius: number = 5;

  constructor(options: any) {
    options.radius = 300;
    options.startAngle = 0;
    options.endAngle = 270;
    options.fill = 'gray';
    options.stroke = 'black';
    options.originX = 'center';
    options.originY = 'center';
    options.objectCaching = true;
    options.perPixelTargetFind = true;
    options.hasBorders = false;
    super(options);
    this.selectable = false;
    this.lockMovementX = true;
    this.lockMovementY= true;

    this.startAngle = options.startAngle;
    this.endAngle = options.endAngle;
    this.radius = options.radius;
    this.midAngle = (this.endAngle + this.startAngle) / 2;
    this.sweepAngle = this.endAngle - this.startAngle;

    this.canvas = options.canvas;
    this.setControlsVisibility({
      mt: false,
      mb: false, 
      mtr: false,
      tr: false, 
      tl: false, 
      mr: false, 
      ml: false, 
      br: false, 
      bl: false, 
    });
    this.setWaterArc(this.startAngle, this.endAngle, 10);
    this.setUpCustomControls();

    this.on({
      'selected': (e) => {
        this.selected = true;
      },
      'deselected': (e) => {
        this.selected = false;
      },
      'modified': (e) => {
        this.canvas.bringObjectToFront(this.product);
        this.canvas.requestRenderAll();
      }
    })

  }

  /**
   * Sets up creation of custom controls
   * @returns {null}
   */
  setUpCustomControls(): void{
    this.controls.start = new Control({
      x: this.getControllerX(this.startAngle),
      y: this.getControllerY(this.startAngle),
      sizeX: 50,
      sizeY: 50,
      cursorStyle: 'pointer',
      withConnection: true,
      actionHandler: (eventData, transform) => {
        this.handleControls(eventData, 'start');
        return true;
      },
      render: this.renderControllerIcon,
    });
    this.controls.end = new Control({
      x: this.getControllerX(this.endAngle),
      y: this.getControllerY(this.endAngle),
      sizeX: 50,
      sizeY: 50,
      cursorStyle: 'pointer',
      withConnection: true,
      actionHandler: (eventData, transform) => {
        this.handleControls(eventData, 'end');
        return true;
      },
      render: this.renderControllerIcon,
    });
    this.controls.middle = new Control({
      x: this.getControllerX(this.sweepAngle/2),
      y: this.getControllerY(this.sweepAngle/2),
      sizeX: 50,
      sizeY: 50,
      cursorStyle: 'pointer',
      withConnection: true,
      actionHandler: (eventData, transform, x, y) => {
        this.handleMidControl(eventData);
        this.handleMidControlScale(eventData, transform, x, y);
        return true;
      },
      render: this.renderControllerIcon,
    });
  }

  /**
   * Changes angle position of start or end angles
   * Updates sweep and middle control
   * @param {TPointerEvent} eventData 
   * @param {string} control 
   * @returns {null}
   */
  handleControls(eventData: TPointerEvent, control: string): void {
    const pointer = this.canvas.getPointer(eventData);
    let angle = Math.atan2(pointer.y - this.top  , pointer.x - this.left) * (180/Math.PI);
    
    // If it's grouped
    if (this.parent){
      angle = Math.atan2(pointer.y - this.parent.top  , pointer.x - this.parent.left) * (180/Math.PI);
    }

    if(control === 'start'){
      // Normalize
      this.startAngle = angle >= 0 ? angle : 360 + angle;
      this.sweepAngle = this.endAngle - this.startAngle;

      // Prevents sweepAngle from going to -80deg
      this.sweepAngle = this.sweepAngle >= 0 ? this.sweepAngle : 360 + this.sweepAngle;

      this.startAngle = this.checkMinAndMaxArcs(this.sweepAngle, 'start');
      this.startAngle = this.checkOmittedAngles(this.startAngle, 'start');

      this.controls.start.x = this.getControllerX(this.startAngle);
      this.controls.start.y = this.getControllerY(this.startAngle);
    }

    else{
      // Normalize
      this.endAngle = angle >= 0 ? angle : 360 + angle;
      this.sweepAngle = this.endAngle - this.startAngle;

      // Prevents sweepAngle from going to -80deg
      this.sweepAngle = this.sweepAngle >= 0 ? this.sweepAngle : 360 + this.sweepAngle;

      this.endAngle = this.checkMinAndMaxArcs(this.sweepAngle, 'end');
      this.endAngle = this.checkOmittedAngles(this.endAngle, 'end');

      this.controls.end.x = this.getControllerX(this.endAngle);
      this.controls.end.y = this.getControllerY(this.endAngle);
      
    }
    this.controls.middle.x = this.getControllerX((this.sweepAngle / 2) + this.startAngle);
    this.controls.middle.y = this.getControllerY((this.sweepAngle / 2) + this.startAngle);

    this.setCoords();
    this.canvas.requestRenderAll();
  }

  /**
   * Changes rotation of water
   * @param {TPointerEvent} eventData 
   * @returns {null}
   */
  handleMidControl(eventData: TPointerEvent): void{
    const pointer = this.canvas.getPointer(eventData);
    let angle = Math.atan2(pointer.y - this.top  , pointer.x - this.left) * (180/Math.PI);
    
    if (this.parent){
      angle = Math.atan2(pointer.y - this.parent.top  , pointer.x - this.parent.left) * (180/Math.PI);
    }

    // Update middle controller position
    this.controls.middle.x = this.getControllerX(angle);
    this.controls.middle.y = this.getControllerY(angle);

    // Update start control position
    this.startAngle = angle - this.sweepAngle/2;

    // Normalize
    this.startAngle = this.startAngle >= 0 ? this.startAngle : 360 + this.startAngle;
    this.controls.start.x = this.getControllerX(this.startAngle);
    this.controls.start.y = this.getControllerY(this.startAngle);
    
    // Update end control position
    this.endAngle = angle + this.sweepAngle/2;
    
    // Normalize
    this.endAngle = this.endAngle >= 0 ? this.endAngle : 360 + this.endAngle;
    this.controls.end.x = this.getControllerX(this.endAngle);
    this.controls.end.y = this.getControllerY(this.endAngle);
    
    // Redraw everything
    this.setCoords();
    this.canvas.requestRenderAll();
  }

  /**
   * Changes water radius
   * @param {TPointerEvent} eventData 
   * @param {any} transform 
   * @param {number} x 
   * @param {number} y 
   * @returns {null}
   */
  handleMidControlScale(eventData: TPointerEvent, transform: any, x: any, y: any): void{
    const target = transform.target;
    const canvasPointer = target.canvas.getPointer(eventData);
    let distance = Math.sqrt(
      Math.pow(canvasPointer.x - target.left, 2) +
      Math.pow(canvasPointer.y - target.top, 2)
    );

    if (this.parent){
      distance = Math.sqrt(
        Math.pow(canvasPointer.x - this.parent.left, 2) +
        Math.pow(canvasPointer.y - this.parent.top, 2)
      );
    }
    // Update radius of Water
    target.set('radius', distance / target.scaleX);
    target.setCoords();
  }
  
  /**
   * Sets the x position of the controller
   * @param {number} angle 
   * @returns {number}
   */
  getControllerX(angle: number): number{
    return (this.radius * Math.cos(util.degreesToRadians(angle))) / this.width;
  }

  /**
   * Sets the y position of the controller
   * @param {number} angle 
   * @returns {number}
   */
  getControllerY(angle: number): number{
    return (this.radius * Math.sin(util.degreesToRadians(angle))) / this.width;
  }

  /**
   * Checks the water object is not under the minimum or 
   * over the maximum arc angle
   * @param {number} sweepAngle 
   * @param {string} control 
   * @returns {number}
   */
  checkMinAndMaxArcs(sweepAngle: number, control: string): number{
    let angle = control === 'start' ? this.startAngle : this.endAngle;
    if(sweepAngle <= this.minArc){
      if(control === 'start'){
        angle = this.endAngle - this.minArc;
      }
      else{
        angle = this.startAngle + this.minArc;
      }
      this.sweepAngle = this.minArc;
    }

    if(sweepAngle >= this.maxArc){
      if(control === 'start'){
        angle = this.endAngle - this.maxArc;
      }
      else{
        angle = this.startAngle + this.maxArc;
      }
        this.sweepAngle = this.maxArc;
    }

    // Normalize
    angle = angle >= 0 ? angle : 360 + angle;
    return angle;
  }

  /**
   * Ensures arc omits angles
   * @param angle 
   * @param control 
   * @returns {number}
   */
  checkOmittedAngles(angle: number, control: string): number{
    if(this.omittedAngles.length === 0){
      return angle;
    }
    let sweepAngle = this.sweepAngle;

    if(this.sweepAngle < this.omittedAngles[0]-5){
      return control === 'start' ? this.startAngle : this.endAngle;
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
    this.sweepAngle = sweepAngle;    
    
    // Normalize
    angle = angle >= 0 ? angle : 360 + angle;
    return angle;
  }

  /**
   * Renders how the controls look
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} left 
   * @param {number} top 
   */
  renderControllerIcon(ctx: CanvasRenderingContext2D, left: number, top: number) {
    ctx.beginPath();
    ctx.arc(left, top, 7, 0, Math.PI * 2, false);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  /**
   * Sets the water object to a specific arc
   * @param start 
   * @param end 
   */
  setWaterArc(start: number, end: number, distance: number=this.radius / this.waterScale){
    // Normalize
    this.startAngle = start >= 0 ? start : 360 + start;
    this.endAngle = end >= 0 ? end : 360 + end;

    this.radius = distance * this.waterScale;
    this.midAngle = (this.endAngle + this.startAngle) / 2;
    this.sweepAngle = this.endAngle - this.startAngle;

    // Re-render the canvas
    this.setCoords();
    this.canvas.requestRenderAll();
  }


  /**
   * Renders the circle, info line and text of the object
   * @param ctx 
   * @returns {null}
   */
  override render(ctx: CanvasRenderingContext2D) {
    // Save the current canvas state
    ctx.save();

    // Apply transformation (translation, scaling, rotation)
    if(this.parent || this.group){
      this.transform(ctx);
    }
  
    let left = this.left;
    let top = this.top ;

    // Ensure close angles => 360 deg circle
    if(Math.abs(this.endAngle - this.startAngle) <= .0001){
      this.startAngle -= 360;
    }

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.arc(
      left,
      top,
      this.radius,
      this.startAngle * (Math.PI/180),
      this.endAngle * (Math.PI/180),
      false
    );
    ctx.lineTo(left, top);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 255, .2)';
    ctx.fill();
  
    // Restore the previous canvas state
    ctx.restore();

    // If not selected,
    // do not render information
    if (!this.selected){
      return;
    }

    // Adding infoline
    const x1 = left;
    const y1 = top;

    const midAngle = this.startAngle + this.sweepAngle / 2;

    const x2 = left + this.radius * Math.cos(util.degreesToRadians(midAngle));
    const y2 = top + this.radius * Math.sin(util.degreesToRadians(midAngle));

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'red';
    ctx.stroke();

    // Adding infoText
    // Calculate midpoint for the text
    const textX = (x1 + x2) / 2;
    const textY = (y1 + y2) / 2;

    // Calculate the angle of the line
    let angle = Math.atan2(y2 - y1, x2 - x1);

    // Save current context before rotating
    ctx.save();

    // Translate to the midpoint of the line and rotate
    ctx.translate(textX, textY);

    // Normalize
    angle = angle >= 0 ? angle : Math.PI*2 + angle;
    if(Math.PI*1.5 > angle && angle > Math.PI*.5){
      angle += Math.PI;
    }
    ctx.rotate(angle);

    // Add text parallel to the line
    ctx.font = '13px Arial';
    ctx.fillStyle = 'black';
    let sweepAngle = this.sweepAngle
    if(sweepAngle === 0){
      sweepAngle = 360;
    }
    const text = `${(this.radius / this.waterScale).toFixed(2)} ft, ${(sweepAngle).toFixed(0)}°`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -10);

    // Restore the context after drawing the text
    ctx.restore();
  }
  
  /**
   * Returns the radius of the water object
   * 
   * @returns {number} angle (in degrees)
   */
  getRadius(): number {
    return this.radius * this.waterScale;
  }
  
  /**
   * Changes the min and max arc and radius of the water
   * object
   * @param {any} constraints
   * @returns {null}
   */
  setConstraints(constraints: any): void{
    this.maxArc = constraints.maxArc || this.maxArc;
    this.minArc = constraints.minArc || this.minArc;
    this.maxRadius = constraints.maxRadius || this.maxRadius;
    this.minRadius = constraints.minRadius || this.minRadius;
  }
  
  /**
   * Returns the arc angle of the water object
   * 
   * @returns {number} arc angle (in degrees)
   */
  getArcAngle(): number {
    return this.sweepAngle;
  }

  /**
   * Sets new omitted angles
   * @param {any} angles 
   * @returns {null}
   */
  setOmittedAngles(angles: any): void {
    this.omittedAngles = angles;
  }
}

export class Mover extends Circle {
  canvas: Canvas;
  water: Spray;
  constructor(options: any) {
    const defValue: any = {
      radius: 10,
      fill: 'gray',
      originX: 'center',
      originY: 'center',
      left: options.left,
      top: options.top,
      hasControls: false,
      hasBorders: false,
      canvas: options.canvas,
      strokeWidth: 50,
      stroke: 'transparent',
    };
    super(defValue);
    this.canvas = options.canvas;
    this.water = new Spray(options);

    this.canvas.insertAt(0, this.water);
    this.on({
      'moving': (e) => {
        this.water.set({
          left: this.left,
          top: this.top,
        });
      },
      'mouseup': (e) => {
        this.canvas.setActiveObject(this.water);
      }
    })
  }

}

export class ProductGroup extends Group{
  mover: Mover;
  water: Spray;
  canvas: Canvas;
  constructor(options: any){
    super([], options);
    this.originX = 'center';
    this.originY = 'center';
    this.subTargetCheck = true;
    this.interactive= true;
    this.selectable = false;
    this.perPixelTargetFind = true;
    this.mover = new Mover({
      radius: 10,
      fill: 'green',
      startAngle: 0,
      endAngle: 360,
      hasBorders: false,
      hasControls: false,
      left: this.left,
      top: this.top,
      originX: 'center',
      originY: 'center',
      canvas: options.canvas,
    });
    this.canvas = options.canvas;

    this.water = new Spray(options);

    this.add(this.water, this.mover);

    this.canvas.add(this);
    this.mover.on({
      'mouseup': (e) => {
        this.canvas.setActiveObject(this.water);
      },
      'moving': (e) => {
        this.set({
          left: this.mover.left + this.left,
          top: this.mover.top + this.top
        });

        this.water.set({
          left: 0,
          top: 0,
        });

        this.mover.set({
          left: 0,
          top: 0,
        });

        this.mover.setCoords();
        this.water.setCoords()
        this.setCoords();
      },
    })

    this.water.on({
      'deselected': (e) => {
        this.canvas.moveObjectTo(this.mover, -1);
      }
    })
  }
}