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

export class MPStrip extends Circle{
  water: Rect;
  waterScale: number = 20;
  side: string = "right";
  nozzleOptions: any = [];
  canvas: Canvas;
  pressure: any;
  productID: string;
  data: any;
  nozzleMap: any =  {'left': 'Left Strip', 
                     'right': 'Right Strip',
                     'center': 'Side Strip'
                    }
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
    const id = this.productID
    const productData = data[id];
    const nozzlesData = productData.nozzles;
    const nozzle = nozzlesData[this.nozzleMap[this.side]];
    console.log(nozzlesData, nozzle, this.pressure);
    const pressureData = nozzle[this.pressure];
    const height = pressureData['length'] * this.waterScale;
    const width = pressureData['width'] * this.waterScale;
    
    options.width = height;
    options.height = width;
    options.hasControls = true;
    const water = new MPStripwater(options);
    this.water = water;
    this.waterScale = options.waterScale;
    this.side = options.side;
    this.canvas = options.canvas;

    this.canvas.add(water);

  }
}

export class MPStripwater extends Rect{
  product: MPStrip; 
  pressure: string;
  side: string;

  constructor(options: any){
    options.fill = 'rgba(0, 0, 255, .2)';
    super(options);
    this.product = options.product;
    this.pressure = '';
    this.side = options.side;
    console.log(this.side)
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

    this.setControlsVisibility({
      tr: this.side === 'left',
      tl: this.side === 'right',
      br: false,
      bl: false,
      mt: this.side === 'center',
      mb: false,
      ml: false,
      mr: false,
      mtr: false, // Hide the default rotation control
    });

    this.product.on({
      'moving': (e) => {this.set({left: this.product.left, top: this.product.top});   
                        this.setCoords();},
      "mousedblclick": (e) => {console.log(this.product)},
      // 'selected': (e) => {this.showControls(true)},
      // 'deselected': (e) => {this.showControls(false)},
    });
  }
}