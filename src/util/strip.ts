import { Circle,
         Canvas, 
         Rect,
         util,
         type BasicTransformEvent,
         Control } from 'fabric';
import data from "./data.json";

export class MPStrip extends Circle{
  water: MPStripwater;
  waterScale: number = 20;
  side: string = "left";
  nozzleOptions: any = [];
  canvas: Canvas;
  pressure: any;
  productID: string;
  data: any;
  selectedNozzle: string;
  nozzleInfo!: string;
  nozzleLookUp: any =  {
    'left': 'Left Strip', 
    'right': 'Right Strip',
    'center': 'Side Strip'
    };
  reverseNozzleLookUp: any =  {
    'Left Strip': 'left',
    'Right Strip': 'right',
    'Side Strip': 'center'
    };
                    
  constructor(options: any){
    // Setting options for product
    options.radius = 10;
    options.originX = 'center';
    options.originY = 'center';
    options.hasControls = false;
    options.hasBorders = false;
    options.fill = 'gray';
    super(options);
    this.strokeWidth = 50;
    this.stroke = 'transparent';

    // Setting options for product water
    options.selectable = true;
    options.side = this.side;
    options.originX = this.side;
    options.originY = 'bottom';
    options.product = this;

    // Gather information from data
    this.data = data;
    this.productID = options.productID;
    const id = this.productID;
    const productData = this.data[id];
    this.pressure = options.pressure === "PSI" ?
                    productData.recPressure: options.pressure;
    const nozzlesData = productData.nozzles;
    const pressures = nozzlesData[this.nozzleLookUp[this.side]]['pressures'];
    const pressureData = pressures[this.roundPressure(Object.keys(pressures))];
    const height = pressureData['height'] * this.waterScale;
    const width = pressureData['width'] * this.waterScale;
    this.createNozzleDictionary(productData);
    options.width = width;
    options.height = height;
    options.hasControls = true;
    const water = new MPStripwater(options);

    this.selectedNozzle = this.reverseNozzleLookUp[this.side];
    this.water = water;
    this.waterScale = options.waterScale;
    this.side = options.side;
    this.canvas = options.canvas;
    this.setSelectedNozzle(this.nozzleLookUp[this.side]);
    this.canvas.insertAt(0, water);

    
    this.on({
      'mouseup': (e) => {
        this.canvas.setActiveObject(this.water);
        this.canvas.requestRenderAll();
      },
      'moving': (e) => {
        this.water.set({left: this.left, top: this.top});
        this.water.setCoords();
      },
    });
    this.water.on({
      'modified': () => {
        console.log(this.nozzleInfo);
      }
    })
  }

  /**
   * Renders the MP Strip object with custom icon
   * @param ctx 
   * @returns 
   */
  render(ctx : CanvasRenderingContext2D): void{
    super.render(ctx);
    ctx.save();

    const matrix = this.calcTransformMatrix();
    ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);

    const centerX = 0;
    const centerY = 0;

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.radius-6, 0, Math.PI * 2);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.radius-1, 0, Math.PI * 2);
    ctx.strokeStyle = "gray";
    ctx.stroke();
    ctx.closePath();

    ctx.restore()
  }

  /**
   * Iterates through the data to make a nozzles dictionary
   * @param {any} data 
   * 
   * @returns {null}
   */
  createNozzleDictionary(data: any){
    for(let nozzleIdx in data.nozzles){
      let nozzle = data.nozzles[nozzleIdx];
      this.nozzleOptions[nozzleIdx] = {};
      this.nozzleOptions[nozzleIdx].pressures = nozzle['pressures'];
      this.nozzleOptions[nozzleIdx].color = nozzle['color'];
      this.nozzleOptions[nozzleIdx].show = true;
    }
  }

  /**
   * Returns selected nozzle
   * @returns {string}
   */
  getSelectedNozzle(): string{
    return this.nozzleLookUp[this.side];
  }

  /**
   * Sets nozzle
   * @param {string} selectedNozzle 
   * @returns {null}
   */
  setSelectedNozzle(nozzle: string): void{
    this.selectedNozzle = this.reverseNozzleLookUp[nozzle];
    this.side = this.reverseNozzleLookUp[nozzle];
    this.water.setSide(this.side);
    const data = this.nozzleOptions[nozzle];
    const pressuresKeys = Object.keys(data.pressures);
    const pressure = this.roundPressure(pressuresKeys);
    const {width, height, gpm, precip_sq, precip_tri} = data.pressures[pressure];
    this.water.setWaterDimensions(width, height);
    this.set({fill: data.color});

    this.nozzleInfo = 
      `Nozzle selected: ${this.nozzleLookUp[this.selectedNozzle]}\n` +
      `Flow: ${gpm} GPM, ` +
      `Square Precip: ${(precip_sq).toFixed(2)} in/hr, ` +
      `Triangle Precip: ${(precip_tri).toFixed(2)} in/hr`;
    console.log(this.nozzleInfo);
  
    this.setCoords();
    this.canvas.renderAll();
  }

  /**
   * Rounds the pressure up or down depending on
   * which one it is closer to.
   * @param pressures string array of pressures
   * @returns {string}
   */
  roundPressure(pressures: string[]): string{
    let closestPressure = pressures[0];
    let closestmodel = parseInt(pressures[0]);
    let minDifference = Math.abs(parseInt(this.pressure) - closestmodel);
    for (let i = 1; i < pressures.length; i++) {
      const currentmodel = parseInt(pressures[i]);
      const currentDifference = Math.abs(parseInt(this.pressure) - currentmodel);
      if (currentDifference < minDifference) {
        closestPressure = pressures[i];
        minDifference = currentDifference;
      }
    }
    return closestPressure;
  }
}

export class MPStripwater extends Rect{
  product: MPStrip;
  pressure: string;
  side: string;
  canvas: Canvas;
  waterScale: number = 20;
  initial: boolean = true;
  maxScale: number = 1;
  minScale: number = 0.75;
  initialCoords: any;
  initialDistanceDiagonal: number;
  initialDistanceHeight!: number;
  initialAngle: number = 0;
  initialAngleRight!: number;
  initialAngleLeft!: number;
  selected: boolean = false;

  constructor(options: any){
    options.fill = 'rgba(0, 0, 255, .2)';
    super(options);
    this.product = options.product;
    this.pressure = '';
    this.side = options.side;
    this.canvas = options.canvas;
    this.objectCaching = true;
    this.lockMovementX = true;
    this.lockScalingY = true;
    this.selectable = false;

    // Adding controller to proper coordinates
    let controllerCoords = {x:0, y:0};
    const waterCoords = this.getCoords();
    if(this.side === 'right'){
      controllerCoords = waterCoords[0];
    }
    else if(this.side === 'left'){
      controllerCoords = waterCoords[1];
    }
    else{
      controllerCoords.x = (waterCoords[0].x + waterCoords[1].x)/2;
      controllerCoords.y = (waterCoords[0].y + waterCoords[1].y)/2;
    }
    this.initialCoords = controllerCoords;
    
    // Setting initial distance for scaling
    const distX = this.initialCoords.x - this.left;
    const distY = this.initialCoords.y - this.top;
    this.initialDistanceDiagonal = Math.sqrt(distX * distX + distY * distY);
    this.initialDistanceHeight = this.height;
    this.setControlsVisibility({
      mt: this.side === 'center',
      mb: false,
      ml: false,
      mr: false,
      tl: this.side === 'right',
      tr: this.side === 'left',
      bl: false,
      br: false,
      mtr: false,
    });
    

    this.initializeAngles();
    this.setUpCustomControls();
    this.on({
      'selected': (e) => {
        this.selected = true;
      },
      'deselected': (e) => {
        this.selected = false;
      },
    })
  }

  /**
   * Renders the circle, info line and text of the object
   * @param ctx 
   * @returns {null}
   */
  render(ctx: CanvasRenderingContext2D) {
    // Call the default render method to draw the rectangle
    super.render(ctx);

    if(!this.selected){
      return;
    }

    // Save the current context state (to apply transformations correctly)
    const waterCoords = this.getCoords();
    let widthCoords = { x1: 0, y1: 0, x2: 0, y2: 0 };
    let heightCoords = { x1: 0, y1: 0, x2: 0, y2: 0 };
  
    if (this.side === "left") {
      widthCoords = {
        x1: waterCoords[2].x,
        y1: waterCoords[2].y,
        x2: waterCoords[3].x,
        y2: waterCoords[3].y
      };
      heightCoords = {
        x1: waterCoords[0].x,
        y1: waterCoords[0].y,
        x2: waterCoords[3].x,
        y2: waterCoords[3].y
      };
    } else if (this.side === "right") {
      widthCoords = {
        x1: waterCoords[2].x,
        y1: waterCoords[2].y,
        x2: waterCoords[3].x,
        y2: waterCoords[3].y
      };
      heightCoords = {
        x1: waterCoords[1].x,
        y1: waterCoords[1].y,
        x2: waterCoords[2].x,
        y2: waterCoords[2].y
      };
    } else if (this.side === "center") {
      widthCoords = {
        x1: waterCoords[2].x,
        y1: waterCoords[2].y,
        x2: waterCoords[3].x,
        y2: waterCoords[3].y
      };
      heightCoords = {
        x1: waterCoords[1].x,
        y1: waterCoords[1].y,
        x2: waterCoords[2].x,
        y2: waterCoords[2].y
      };
    }
  
    ctx.save();
  
    // Move to the center of the object, since Fabric.js objects are drawn from their origin
    ctx.translate(0, 0);
  
    // Set line color and width
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
  
    // Draw a line on the bottom of the rectangle
    ctx.beginPath();
    ctx.moveTo(widthCoords.x1, widthCoords.y1);
    ctx.lineTo(widthCoords.x2, widthCoords.y2);
    ctx.stroke();
  
    // Draw a line on the left side of the rectangle
    ctx.beginPath();
    ctx.moveTo(heightCoords.x1, heightCoords.y1);
    ctx.lineTo(heightCoords.x2, heightCoords.y2);
    ctx.stroke();
  
    // Calculate midpoints for both lines
    const midWidthX = (widthCoords.x1 + widthCoords.x2) / 2;
    const midWidthY = (widthCoords.y1 + widthCoords.y2) / 2;
  
    const midHeightX = (heightCoords.x1 + heightCoords.x2) / 2;
    const midHeightY = (heightCoords.y1 + heightCoords.y2) / 2;
  
    // Set font for the text
    ctx.font = '16px Arial';
    ctx.fillStyle = 'red';
  
    // Centering the text for width line
    const widthText = `${(this.width*this.scaleX/20).toFixed(2)} ft`;
    const widthTextMeasurement = ctx.measureText(widthText);
    const widthTextX = midWidthX - widthTextMeasurement.width / 2;
    const widthTextY = midWidthY - 3;
  
    // Centering the text for height line
    const heightText = `${(this.height*this.scaleX/20).toFixed(2)} ft`
    const heightTextMeasurement = ctx.measureText(heightText);
    const heightTextX = midHeightX - heightTextMeasurement.width / 2;
    const heightTextY = midHeightY;
  
    // Draw text in the middle of the width line
    ctx.fillText(widthText, widthTextX, widthTextY);
  
    // Draw text in the middle of the height line
    ctx.fillText(heightText, heightTextX, heightTextY);
  
    // Restore the context to its previous state
    ctx.restore();
  }

  
  /**
   * Sets up creation of custom controls
   * @returns {null}
   */
  setUpCustomControls(){
    this.controls.tr = new Control({
      x: 0.5,
      y: -0.5,
      cursorStyle: 'pointer',
      actionName: 'rotateAndScale',
      sizeX: 50,
      sizeY: 50,
      actionHandler: (eventData, transform, x, y) => {
        this.handleRotation(x, y);
        this.handleScaling(x, y);
        return true;
      },
      // Customize control rendering
      render: this.renderControllerIcon,
    });

    this.controls.tl = new Control({
      x: -0.5,
      y: -0.5,
      cursorStyle: 'pointer',
      actionName: 'rotateAndScale',
      sizeX: 50,
      sizeY: 50,
      actionHandler: (eventData, transform, x, y) => {
        this.handleRotation(x, y);
        this.handleScaling(x, y);
        return true;
      },
      // Customize control rendering
      render: this.renderControllerIcon,
    });

    this.controls.mt = new Control({
      x: 0,
      y: -0.5,
      cursorStyle: 'pointer',
      actionName: 'rotateAndScale',
      sizeX: 50,
      sizeY: 50,
      actionHandler: (eventData, transform, x, y) => {
        this.handleRotation(x, y);
        this.handleScaling(x, y);
        return true;
      },
      // Customize control rendering
      render: this.renderControllerIcon,
    });
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
   * Sets the side of the water
   * @param {string} side where product is placed
   * @returns {null}
   */
  setSide(side: string): void{
    this.side = side;
    this.set({originX: this.side});
    this.setControlsVisibility({
      mt: this.side === 'center',
      mb: false,
      ml: false,
      mr: false,
      tl: this.side === 'right',
      tr: this.side === 'left',
      bl: false,
      br: false,
      mtr: false,
    });
    this.setCoords();
  }

  /**
   * Sets the new water dimension based on the nozzle
   * @param {number} width 
   * @param {number} height 
   * @returns {null}
   */
  setWaterDimensions(width: number, height: number): void{
    this.set({
      width: width*this.waterScale,
      height: height*this.waterScale
    });
    this.setCoords();
    this.canvas.renderAll();
  }

  /**
   * Handle scaling of the water
   * @param {number} x
   * @param {number} y
   * @returns {null}
   */
  handleScaling(x: number, y: number): void{
    const distX = x - this.left;
    const distY = y - this.top;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    // initialDistance depends on the side
    let initialDistance = this.initialDistanceDiagonal;
    if (this.side === 'center'){
      initialDistance = this.initialDistanceHeight;
    }
    // Use distance as a scale factor
    let scaleFactor = distance / initialDistance;
    if(this.minScale > scaleFactor){
      this.scale(this.minScale);
    }
    else if (scaleFactor > 1){
      this.scale(1);
    }
    else{
      this.scale(scaleFactor);
    }
    this.setCoords();
  }

  /**
   * Handles rotation of the water
   * @param {number} x
   * @param {number} y
   * @returns {null} 
   */
  handleRotation(x: number, y: number): void {
    const centerPoint = this.product.getCenterPoint();
  
    // Calculate the angle based on the current pointer position relative to the center
    let currentAngle = Math.atan2(y - centerPoint.y, x - centerPoint.x);
    currentAngle = util.radiansToDegrees(currentAngle);
    let offset = currentAngle - this.initialAngle;
  

    // Apply offsets
    if(this.side === 'right'){
      currentAngle = this.initialAngle + offset - this.initialAngleRight;
    }
    else if (this.side === 'left'){
      currentAngle = this.initialAngle + offset - this.initialAngleLeft;
    }
    else{
      currentAngle = this.initialAngle + offset + 90;
    }

    // Update changes
    this.set({angle: currentAngle});
    this.setCoords();
  }

  /**
   * Updates the inital angle for rotation
   * @param {BasicTransformEvent} e 
   * @returns {null}
   */
  updateInitialAngle(e: BasicTransformEvent): void{    
    const pointer = e.transform.target.getCenterPoint();
    const centerPoint = this.product.getCenterPoint();
  
    // Calculate the angle based on the current pointer position relative to the center
    let currentAngle = Math.atan2(pointer.y - centerPoint.y, pointer.x - centerPoint.x);
    currentAngle = util.radiansToDegrees(currentAngle);
    this.initialAngle = currentAngle;
  }

  /**
   * Initializes angles for left and right nozzles for proper rotation
   * 
   * @returns {null}
   */
  initializeAngles(): void{
    const originalSide = this.side;
    
    // Change to left and get its inital angle
    this.setSide('left');
    let pointer = this.initialCoords;
    let centerPoint = this.product.getCenterPoint();
  
    // Calculate the angle based on the current pointer position relative to the center
    let currentAngle = Math.atan2(pointer.y - centerPoint.y, pointer.x - centerPoint.x);
    currentAngle = util.radiansToDegrees(currentAngle);
    this.initialAngleLeft = currentAngle;


    // Change to right and get its inital angle
    this.setSide('right');
    this.initialCoords.x -= (this.width * 2);
    pointer = this.initialCoords;
    centerPoint = this.product.getCenterPoint();

    // Calculate the angle based on the current pointer position relative to the center
    currentAngle = Math.atan2(pointer.y - centerPoint.y, pointer.x - centerPoint.x);
    currentAngle = util.radiansToDegrees(currentAngle);
    this.initialAngleRight = currentAngle;

    // Set back to original side
    this.setSide(originalSide);
  }
}