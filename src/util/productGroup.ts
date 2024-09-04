import { Canvas, Circle, Group, Path, util } from "fabric";

export class ProductGroup extends Group {
  big: Path;
  small: Circle;
  product: Circle;
  canvas: Canvas;

  constructor(options: any) {
    super([], options);

    // Set the canvas
    this.canvas = options.canvas;

    this.subTargetCheck = true;
    this.hasControls = false;
    this.interactive = true;
    this.hasBorders = true;
    this.perPixelTargetFind = true;

    // Creat Water Path
    const pathData = ProductGroup.generatePathData(100, 100, 40, 0, 360);
    this.big = new Path(
      pathData, {
      left: 100,
      top: 100,
      fill: 'red',
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
      left: 140, // Set initially on the circumference of the big circle
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
      left: 100, // Set initially on the circumference of the big circle
      top: 100,
      fill: 'green',
      hasControls: false,
      hasBorders: false,
      originX: 'center',
      originY: 'center',
    });

    // Add circles to the group
    
    this.add(this.big);
    this.add(this.small);
    this.add(this.product)


    this.on({
      'mousedown': (e) => {console.log(this.getCoords());}
    });
    
    this.small.on('moving', (e) => {
      this.setPointOnCircumference(e);
    });

    this.product.on({
      'moving': (e) => {
        // console.log(this.product.getCenterPoint());
        // this.set({left: this.product.left, top: this.product.top});
        // this.setCoords();
        this.handleProductMoving(e);
        // this.canvas.setActiveObject(this, e.e);
      }
    });
    // Add the group to the canvas
    this.canvas.add(this);
  }

  setPointOnCircumference(e: any) {
    let bigCircleCenterX = this.big.left;
    let bigCircleCenterY = this.big.top;
    let bigCircleRadius = 40;
    let pointerX = this.small.left;
    let pointerY = this.small.top;
    const angle = Math.atan2(pointerY - bigCircleCenterY, pointerX - bigCircleCenterX);

    // Calculate the new position on the circumference
    const newX = bigCircleCenterX + bigCircleRadius * Math.cos(angle);
    const newY = bigCircleCenterY + bigCircleRadius * Math.sin(angle);

    this.small.set({left: newX, top: newY});
    this.small.setCoords();
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
    // const pointer = this.canvas.getPointer(e.e);
    // console.log(pointer)
    // const dx = pointer.x - this.product.left!;
    // const dy = pointer.y - this.product.top!;
    // console.log(dx, dy)

    // // Move the entire group
    // this.left! = this.product.left;
    // this.top! = this.product.top;

    // Ensure the product circle stays in the middle of the big circle
    // this.product.set({
    //   left: this.big.left!,
    //   top: this.big.top!,
    // });

    this.big.set({
      left: this.product.left,
      top: this.product.top,
    });

    this.setPointOnCircumference(e);
    // this.big.setCoords();
    // this.setCoords();
    // this.canvas.renderAll();
  }
}