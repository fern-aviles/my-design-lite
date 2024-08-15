import { Circle,
         FabricText, 
         type TOriginX, 
         type TOriginY,
         Path,
         Canvas, 
         Line,
         Rect,
         Control,
         controlsUtils} from 'fabric';
import { type Products,
         type ProductType,
         type Nozzles,
         type NozzleTypes,
         type NozzleModel,
         type Angles,
         type AngleDetails
         } from './huntertypes';
import data from "./data.json";
import { h } from 'vue';

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
    options.fill = 'gray'
    super(options);

    // Setting options for product water
    options.selectable = true;
    options.hasControls = true;
    options.hasBorder = false;
    options.centeredRotation = false;
    options.centeredScaling = false;
    options.uniformScaling = true;
    options.lockScalingFlip = true;   // Prevent flipping during scaling
    options.lockUniScaling = true;   // Allow uniform scaling
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
    const productData = data[id];
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

    this.canvas.add(water);

  }

  createNozzleDictionary(data: Products){
    for(let nozzleIdx in data.nozzles){
      let nozzle = data.nozzles[nozzleIdx];
      this.nozzleOptions[nozzleIdx] = {};
      this.nozzleOptions[nozzleIdx].data = nozzle;
      this.nozzleOptions[nozzleIdx].show = true;
      
    }
  }

  getSelectedNozzle(): string{
    return this.nozzleLookUp[this.side]
  }

  setSelectedNozzle(nozzle: string): void{
    this.selectedNozzle = this.reverseNozzleLookUp[nozzle];
    this.side = this.reverseNozzleLookUp[nozzle];
    this.water.setSide(this.side);

    const pressures= Object.keys(this.nozzleOptions[nozzle].data);
    const pressure = this.roundPressure(pressures);
    const {width, height} = this.nozzleOptions[nozzle].data[pressure];
    this.water.setWater(width, height);
    this.water.setControls();
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

  constructor(options: any){
    options.fill = 'rgba(0, 0, 255, .2)';
    super(options);
    this.product = options.product;
    this.pressure = '';
    this.side = options.side;
    this.canvas = options.canvas;
    this.setControls();
    this.product.on({
      'moving': (e) => {this.set({left: this.product.left, top: this.product.top});   
                        this.setCoords();},
      "mousedblclick": (e) => {console.log(this.product)},
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
      console.log("center")
      this.controls.mt = new Control({
        x: 0,
        y: -0.5,
        offsetY: 0,
        offsetX: 0,
        actionName: 'scaleRotate',
        cursorStyle: 'pointer',
        withConnection: true,
        actionHandler(eventData, transform, x, y) {
          controlsUtils.rotationWithSnapping(eventData, transform, x, y);
          // controlsUtils.scalingEqually(eventData, transform, x, y);
          return true;
        }
      });
    }

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
    this.set({originX: this.side});
    this.setCoords();
    this.canvas.renderAll();
  }

  setSide(side: string): void{
    this.side = side;
  }

  setWater(width: number, height: number): void{
    this.set({
      scaleX: 1,
      scaleY: 1,
      width: width*this.waterScale,
      height: height*this.waterScale
    });
    this.setCoords();
    this.canvas.renderAll();
  }
}