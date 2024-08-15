import { Circle,
         FabricText, 
         type TOriginX, 
         type TOriginY,
         Path,
         Canvas, 
         Line,
         Rect} from 'fabric';
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
  waterScale: number = 20;
  side: string = "left";
  nozzleOptions: any = [];
  canvas: Canvas;
  pressure: any;
  productID: string;
  data: any;
  constructor(options: any){

    // Setting options for product
    options.radius = 10;
    options.originX = 'center';
    options.originY = 'center';
    options.hasControls = false;
    options.fill = 'gray'
    super(options);

    // Setting options for product water
    options.selectable = false;
    options.originX = this.side;
    options.originY = 'bottom';
    options.width *= this.waterScale;
    options.height *= this.waterScale;
    options.product = this;

    // Gather information from data
    this.data = data;
    this.pressure = options.pressure;
    this.productID = options.productID;
    const productData = data[this.productID];
    const nozzlesData = productData.nozzles
    const nozzle = nozzlesData[this.side]
    console.log(nozzlesData, nozzle, this.pressure)
    const pressureData = nozzle[this.pressure]
    const width = pressureData['width'] * this.waterScale
    const height = pressureData['height'] * this.waterScale
    
    options.width = width
    options.height = height
    const water = new MPStripwater(options);
    this.waterScale = options.waterScale;
    this.side = options.side;
    this.canvas = options.canvas;

    this.canvas.add(water);

  }
}

export class MPStripwater extends Rect{
  product: MPStrip; 
  pressure: string;

  constructor(options: any){
    options.fill = 'rgba(0, 0, 255, .2)';
    super(options);
    this.product = options.product
    this.pressure = '';

    this.product.on({
      'moving': (e) => {this.set({left: this.product.left, top: this.product.top});   
                        this.setCoords();},
      // 'selected': (e) => {this.showControls(true)},
      // 'deselected': (e) => {this.showControls(false)},
    });
  }
}