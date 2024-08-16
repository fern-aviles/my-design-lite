import { Circle,
         FabricText, 
         type TOriginX, 
         type TOriginY,
         Path,
         Canvas, 
         Line,
         Rect,
         Control,
         controlsUtils,
         util} from 'fabric';
import { type Products,
         type ProductType,
         type Nozzles,
         type NozzleTypes,
         type NozzleModel,
         type Angles,
         type AngleDetails
         } from './huntertypes';
import data from "./data.json";
import { Controller } from './controller';

const INCREASE_ONE_END = true;

export class MPStrip extends Circle{
  water: MPStripwater;
  waterScale: number = 20;
  side: string = "right";
  nozzleOptions: any = [];
  canvas: Canvas;
  pressure: any;
  productID: string;
  data: any;
  selectedNozzle: string;
  nozzleLookUp: any =  {'left': 'Left Strip', 
                     'right': 'Right Strip',
                     'center': 'Side Strip'
                    };
  reverseNozzleLookUp: any =  {'Left Strip': 'left',
                      'Right Strip': 'right',
                      'Side Strip': 'center'
                    };
  constructor(options: any){

    // Setting options for product
    options.radius = 10;
    options.originX = 'center';
    options.originY = 'center';
    options.hasControls = false;
    options.fill = 'gray';
    super(options);

    // Setting options for product water
    options.selectable = true;
    options.hasControls = true;
    options.hasBorder = false;
    options.lockMovementX = true;
    options.lockMovementY = true;
    options.centeredRotation = false;
    options.centeredScaling = false;
    options.uniformScaling = true;
    options.lockScalingFlip = true;   // Prevent flipping during scaling
    options.lockUniScaling = true;   // Allow uniform scaling
    options.minScaleLimit = 0.75;
    options.side = this.side;
    options.originX = this.side;
    options.originY = 'bottom';
    options.width *= this.waterScale;
    options.height *= this.waterScale;
    options.product = this;

    // Gather information from data
    this.data = data;
    this.pressure = options.pressure;
    this.productID = options.productID;
    const id = this.productID;
    const productData = this.data[id];
    const nozzlesData = productData.nozzles;
    const pressures = nozzlesData[this.nozzleLookUp[this.side]];
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

    this.canvas.insertAt(0, water);

  }

  createNozzleDictionary(data: any){
    for(let nozzleIdx in data.nozzles){
      let nozzle = data.nozzles[nozzleIdx];
      this.nozzleOptions[nozzleIdx] = {};
      this.nozzleOptions[nozzleIdx].data = nozzle;
      this.nozzleOptions[nozzleIdx].show = true;
      
    }
  }

  getSelectedNozzle(): string{
    return this.nozzleLookUp[this.side];
  }

  setSelectedNozzle(nozzle: string): void{
    this.selectedNozzle = this.reverseNozzleLookUp[nozzle];
    this.side = this.reverseNozzleLookUp[nozzle];
    this.water.setSide(this.side);

    const pressures = Object.keys(this.nozzleOptions[nozzle].data);
    const pressure = this.roundPressure(pressures);
    const {width, height} = this.nozzleOptions[nozzle].data[pressure];
    this.water.setWater(width, height);
    this.water.setControls();
    this.set({
      left: this.water.left,
      top: this.water.top,
    });
    this.setCoords();
    this.canvas.renderAll();
  }

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

  constructor(options: any){
    options.fill = 'rgba(0, 0, 255, .2)';
    super(options);
    this.product = options.product;
    this.pressure = '';
    this.side = options.side;
    this.canvas = options.canvas;

    this.setControls();
    this.on('scaling', (event) => {
      // Get current scale factors
      let scaleX = this.scaleX;
      let scaleY = this.scaleY;

      let minScale = this.minScale;
      let maxScale = this.maxScale;
    
      // Enforce minimum and maximum scaling
      if (scaleX < minScale) {
        scaleX = minScale;
      } else if (scaleX > maxScale) {
        scaleX = maxScale;
      }
    
      if (scaleY < minScale) {
        scaleY = minScale;
      } else if (scaleY > maxScale) {
        scaleY = maxScale;
      }
    
      // Apply the constrained scale values
      this.set({
        scaleX: scaleX,
        scaleY: scaleY,
      });
    });
    this.product.on({
      'moving': (e) => {this.set({left: this.product.left, top: this.product.top});   
                        this.setCoords();
                       },
      "mousedblclick": (e) => {console.log(this.product)},
      'selected': () => {
      // Make the rectangle's controls visible
        this.setControlsVisibility({
          tr: this.side === 'left',
          tl: this.side === 'right',
          br: false,
          bl: false,
          mt: this.side === 'center',
          mb: false,
          ml: false,
          mr: false,
          mtr: false,
        });
        this.setCoords(); // Update the rectangle's coordinates
        this.canvas.renderAll(); // Re-render the canvas
      }
    });
  }

  setControls(){
    if(this.side === 'right'){
      this.controls.tl = new Control({
        x: -0.5,
        y: -0.5,
        offsetY: 0,
        offsetX: 0,
        actionName: 'scaleRotate',
        cursorStyle: 'pointer',
        withConnection: true,
        actionHandler(eventData, transform, x, y) {
          controlsUtils.rotationWithSnapping(eventData, transform, x, y);
          controlsUtils.scalingEqually(eventData, transform, x, y);
          return true;
        }
      });
    }
    else if(this.side === 'left'){
      this.controls.tr = new Control({
        x: 0.5,
        y: -0.5,
        offsetY: 0,
        offsetX: 0,
        actionName: 'scaleRotate',
        cursorStyle: 'pointer',
        withConnection: true,
        actionHandler(eventData, transform, x, y) {
          controlsUtils.rotationWithSnapping(eventData, transform, x, y);
          controlsUtils.scalingEqually(eventData, transform, x, y);
          return true;
        }
      });
    }
    else{
      this.controls.mt = new Control({
        x: 0,
        y: -0.5,
        offsetY: 0,
        offsetX: 0,
        actionName: 'scaleRotate',
        cursorStyle: 'pointer',
        withConnection: true,
        actionHandler(eventData, transform, x, y) {
          // Perform rotation with snapping
          controlsUtils.rotationWithSnapping(eventData, transform, x, y);
          // Calculate the difference in the y-coordinate from the origin to the current pointer position
          const water: MPStripwater = transform.target as MPStripwater;
          const target = water.product;
          const pointer = target.canvas!.getViewportPoint(eventData);
          
          // Calculate the new scale based on the vertical movement (height)
          const distance = Math.sqrt(
            Math.pow(pointer.x - water.left, 2) +
            Math.pow(pointer.y - water.top, 2)
          );
          const newScale = distance / (target.width * target.scaleX);
          let scaleY = distance / (water.height * water.scaleY);
          const minScale = water.minScaleLimit;
          const maxScale = 1;
        
          if (scaleY < minScale) {
            scaleY = minScale;
          }
          else if (scaleY > maxScale) {
            scaleY = maxScale;
          }
          // Apply scaling uniformly based on height
          water.set({
            scaleY: scaleY,
            scaleX: scaleY
          });
      
      
          water.setCoords();  // Update the object's coordinates
          water.canvas!.requestRenderAll();  // Re-render the canvas
          return true;
        }
      });
    }
    this.changeOrigin();
    this.setCoords();
    this.canvas.renderAll();
  }

  setSide(side: string): void{
    this.side = side;
  }

  setWater(width: number, height: number): void{
    this.set({
      width: width*this.waterScale,
      height: height*this.waterScale
    });
    this.setCoords();
    this.canvas.renderAll();
  }

  changeOrigin() {
    const newOriginX = this.side; // Target origin ('left', 'center', or 'right')
    const currentOriginX = this.originX;
  
    if (currentOriginX === newOriginX) return; // No need to change if already the same
  
    // Calculate the direction and magnitude of the shift
    let currentOffsetFactor = 0;
    let newOffsetFactor = 0;
    
    if (currentOriginX === 'left') {
      currentOffsetFactor = -0.5;
    } else if (currentOriginX === 'center') {
      currentOffsetFactor = 0;
    } else if (currentOriginX === 'right') {
      currentOffsetFactor = 0.5;
    }
    
    if (newOriginX === 'left') {
      newOffsetFactor = -0.5;
    } else if (newOriginX === 'center') {
      newOffsetFactor = 0;
    } else if (newOriginX === 'right') {
      newOffsetFactor = 0.5;
    }

    // Calculate the offset based on width, scale, and angle
    let offsetX = (newOffsetFactor - currentOffsetFactor) * this.width * this.scaleX;
    if(!INCREASE_ONE_END && newOriginX === 'center'){
      offsetX /= 2;
    }
    if(INCREASE_ONE_END && currentOriginX === 'center'){
      offsetX *= 2;
    }
    const angleRad = util.degreesToRadians(this.angle);
  
    // Apply the offset to the left and top positions
    this.set({
      left: this.left + offsetX * Math.cos(angleRad),
      top: this.top + offsetX * Math.sin(angleRad),
      originX: newOriginX,
    });
  
    this.setCoords(); // Update the rectangle's coordinates
    this.canvas.renderAll(); // Re-render the canvas
  }
}