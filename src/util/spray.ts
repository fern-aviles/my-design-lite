import { Canvas, util, Control, Circle, type TPointerEvent, Group } from "fabric";

export class Spray extends Circle {
  startAngle: number;
  endAngle: number;
  radius: number;
  sweepAngle: number;
  midAngle: number;
  declare product: Mover;
  declare canvas: Canvas;
  selected: boolean = false;
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
    this.selectable = true;
    // this.lockMovementX = true;
    // this.lockMovementY= true;
    this.containsPoint = function(point) {
      const distanceFromCenter = Math.sqrt(
        Math.pow(point.x - this.left, 2) + Math.pow(point.y - this.top, 2)
      );
    
      // Consider a larger radius for interaction
      const interactionRadius = this.radius + 20;
      return distanceFromCenter <= interactionRadius;
    };

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
    this.setUpCustomControls();

    this.on({
      'selected': (e) => {
        this.selected = true;
      },
      'deselected': (e) => {
        this.selected = false;
      },
      'modified': (e) => {
        // console.log(this.canvas.getObjects())
        this.canvas.bringObjectToFront(this.product);
        // console.log(this.canvas.getObjects())
        this.canvas.requestRenderAll();
      }
    })

  }


  setUpCustomControls(){
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
        this.handleMidControlScale(eventData, transform, x, y)
        return true;
      },
      render: this.renderControllerIcon,
    });
  }

  handleControls(eventData: TPointerEvent, control: string): void {
    const pointer = this.canvas.getPointer(eventData);
    const angle = Math.atan2(pointer.y - this.top  , pointer.x - this.left) * (180/Math.PI);
    
    if(control === 'start'){
      this.startAngle = angle >= 0 ? angle : 360 + angle;
      this.controls.start.x = this.getControllerX(this.startAngle);
      this.controls.start.y = this.getControllerY(this.startAngle);
      
    }
    else{
      this.endAngle = angle >= 0 ? angle : 360 + angle;
      this.controls.end.x = this.getControllerX(this.endAngle);
      this.controls.end.y = this.getControllerY(this.endAngle);
    }

    let sweepAngle = this.endAngle - this.startAngle;
    sweepAngle = sweepAngle >= 0 ? sweepAngle : 360 + sweepAngle;
    this.sweepAngle = sweepAngle;
    this.controls.middle.x = this.getControllerX((this.sweepAngle / 2) + this.startAngle);
    this.controls.middle.y = this.getControllerY((this.sweepAngle / 2) + this.startAngle);

    this.setCoords();
    this.canvas.requestRenderAll();
  }

  handleMidControl(eventData: TPointerEvent){
    const pointer = this.canvas.getPointer(eventData);
    const angle = Math.atan2(pointer.y - this.top  , pointer.x - this.left) * (180/Math.PI);
    
    // Update middle controller position
    this.controls.middle.x = this.getControllerX(angle);
    this.controls.middle.y = this.getControllerY(angle);

    // Update start control position
    this.startAngle = angle - this.sweepAngle/2
    this.startAngle = this.startAngle >= 0 ? this.startAngle : 360 + this.startAngle;
    this.controls.start.x = this.getControllerX(this.startAngle);
    this.controls.start.y = this.getControllerY(this.startAngle);
    
    // Update end control position
    this.endAngle = angle + this.sweepAngle/2
    this.endAngle = this.endAngle >= 0 ? this.endAngle : 360 + this.endAngle;
    this.controls.end.x = this.getControllerX(this.endAngle);
    this.controls.end.y = this.getControllerY(this.endAngle);
    
    // Redraw everything
    this.setCoords();
    this.canvas.requestRenderAll();
  }

  handleMidControlScale(eventData: TPointerEvent, transform: any, x: any, y: any){
    const target = transform.target;
    const canvasPointer = target.canvas.getPointer(eventData);
    const distance = Math.sqrt(
      Math.pow(canvasPointer.x - target.left, 2) +
      Math.pow(canvasPointer.y - target.top, 2)
    )

    // Update radius of Water
    target.set('radius', distance / target.scaleX);
    target.setCoords();
  }
  
  getControllerX(angle: number){
    return (this.radius * Math.cos(util.degreesToRadians(angle))) / this.width
  }

  getControllerY(angle: number){
    return (this.radius * Math.sin(util.degreesToRadians(angle))) / this.width
  }

  renderControllerIcon(ctx: CanvasRenderingContext2D, left: number, top: number) {
    ctx.beginPath();
    ctx.arc(left, top, 7, 0, Math.PI * 2, false);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  override render(ctx: CanvasRenderingContext2D) {
    let left = this.left;
    let top = this.top;
    // if(this.parent){
    //   left =  this.parent.left;
    //   top = this.parent.top;
    // }

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.arc(
      left,
      top,
      this.radius,
      util.degreesToRadians(this.startAngle),
      util.degreesToRadians(this.endAngle),
      false
    );
    ctx.lineTo(left, top);  // Connects back to the center
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 255, .2)';
    ctx.fill();

    // If not selected,
    // do not render information
    if (!this.selected){
      return
    }

    // Add line
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

    // Calculate midpoint for the text
    const textX = (x1 + x2) / 2;
    const textY = (y1 + y2) / 2;

    // Calculate the angle of the line
    let angle = Math.atan2(y2 - y1, x2 - x1);

    // Save current context before rotating
    ctx.save();

    // Translate to the midpoint of the line and rotate
    ctx.translate(textX, textY);

    angle = angle >= 0 ? angle : Math.PI*2 + angle;
    if(Math.PI*1.5 > angle && angle > Math.PI*.5){
      angle += Math.PI;
    }
    ctx.rotate(angle);

    // Add text parallel to the line
    ctx.font = '13px Arial';
    ctx.fillStyle = 'black';
    const text = `${(this.radius / 20).toFixed(2)} ft, ${(this.sweepAngle).toFixed(0)}°`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -10)

    // Restore the context after drawing the text
    ctx.restore();
    
  }
}

export class Mover extends Circle {
  canvas: Canvas;
  constructor(options: any) {
    super(options);
    this.canvas = options.canvas;
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

    this.canvas.add(this.water, this.mover)

    this.add(this.water, this.mover);
    
    this.canvas.remove(this.water, this.mover)

    this.canvas.add(this);
    this.mover.on({
      'mouseup': (e) => {

        // this.water.handleControls(e, 'start');
        // this.water.handleControls(e, 'end');
        // this.water.handleMidControl(e);
        this.canvas.setActiveObject(this.water)
      },
      'moving': (e) => {
        this.water.set({
          left: this.mover.left,
          top: this.mover.top,
        });
        this.water.setCoords();
        this.mover.setCoords();
        this.setCoords();
        // console.log(this.water.left + this.left, this.water.top + this.top)
        this.canvas.requestRenderAll();
      },
    })
  }
}