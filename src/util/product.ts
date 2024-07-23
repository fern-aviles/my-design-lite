import { Circle, Canvas, util, type TOriginX, type TOriginY } from 'fabric';
import { Water } from './water';
import data from "./data.json";

interface Nozzle {
  Product: string;
  Nozzle: number;
  Color: string;
  Pressure: number;
  Radius: number;
  Flow: number;
  "Precip in/hr (low)": number;
  "Precip in/hr (high)": number;
}

interface Data {
  [key: string]: { // Use string as the key type here
      name: string;
      fixedArc: boolean;
      minArc: number;
      maxArc: number;
      minRadius: number;
      maxRadius: number;
      nozzles: Nozzle[];
  };
}

export class Product extends Circle {
  data: Data;
  water: Water;
  name: string;
  productID: string;
  minRadius: number;
  maxRadius: number;
  minArc: number;
  maxArc: number;
  fixedArc: boolean;

  constructor(waterOptions: any) {
    const options = {
      left: waterOptions.left,
      top: waterOptions.top,  
      originX: 'center' as TOriginX,
      originY: 'center' as TOriginY,
      radius: 7,
      fill: 'gray',
      hasControls: false,
    };

    super(options);

    this.productID = waterOptions.productID;
    this.data = data;
    this.name = this.data[this.productID].name;
    this.minRadius = this.data[this.productID].minRadius;
    this.maxRadius = this.data[this.productID].maxRadius;
    this.minArc = this.data[this.productID].minArc;
    this.maxArc = this.data[this.productID].maxArc;
    this.fixedArc = this.data[this.productID].fixedArc;
    console.log(this.name);
    waterOptions.minRadius = this.minRadius;
    waterOptions.maxRadius = this.maxRadius;
    waterOptions.minArc = this.minArc;
    waterOptions.maxArc = this.maxArc;
    waterOptions.fixedArc = this.fixedArc;
    console.log(this);
    const temp = {
            startAngle: 0,
            endAngle: 270,
            centerX: waterOptions.left,
            centerY: waterOptions.top,
            radius: waterOptions.minRadius,
            canvas: waterOptions.canvas,
            fill: 'rgba(0, 0, 255, .2)',
            minRadius: this.minRadius,
            maxRadius: this.maxRadius,
            minArc: this.minArc,
            maxArc: this.maxArc,
            fixedArc: this.fixedArc,
    };
    // Create the Water instance
    this.water = new Water(temp, this);
  }
}