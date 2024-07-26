import { Circle, FabricText, type TOriginX, type TOriginY } from 'fabric';
import { Water } from './water';
import data from "./data.json";

export interface NozzleData {
  radius: number;
  flow: number;
  precip_sq: number;
  precip_tri: number;
}

export interface PerformanceData {
  [nozzleNumber: string]: {
    [pressure: string]: NozzleData;
  };
}

export interface ProductInfo {
  name: string;
  fixedArc: boolean;
  minArc: number;
  maxArc: number;
  minRadius: number;
  maxRadius: number;
  performanceData: {
    standard: PerformanceData;
    [key: string]: PerformanceData;
  };
}

export interface ProductData {
  [productId: string]: ProductInfo;
}


/**
 * Creates a Product object which filters data and
 * allows users to customize the object's water radius
 * and arc angle
 * 
 * @extends Circle
 */
export class Product extends Circle {
  text: FabricText;
  data: ProductData;
  water: Water;
  name: string;
  productID: string;
  minRadius: number;
  maxRadius: number;
  minArc: number;
  maxArc: number;
  fixedArc: boolean;
  nozzleOptions: any;
  selectedNozzle: any;
  pressure: number;
  nozzleInfo: string;

  /**
   * Constructs the Product object and is using 
   * waterOptions to create a Water object to allow for
   * customization
   * 
   * @param {any} waterOptions 
   */
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
    this.nozzleOptions = [];
    this.selectedNozzle = null;
    this.nozzleInfo = "No nozzle selected";
    this.pressure = 40;
    console.log(this.name);
    waterOptions.minRadius = this.minRadius;
    waterOptions.maxRadius = this.maxRadius;
    waterOptions.minArc = this.minArc;
    waterOptions.maxArc = this.maxArc;
    waterOptions.fixedArc = this.fixedArc;
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

    this.text = new FabricText("Nozzle Options: \n", {
      left: 30,
      top: 0,
      fontSize: 25,
    });
    this.createNozzlesDictionary(data);
    this.findNozzlesWithRadius(data, this.minRadius);
    this.water.midController.on({
      'moving': () => {
        this.findNozzlesWithRadius(data, this.water.getRadius());
        this.deselectNozzle(this.water.getRadius());
      },
      'modified': () => {
          console.log(this.nozzleInfo);
      },
    });
    this.water.startController.on({
      'moving': () => {
        this.findNozzlesWithRadius(data, this.water.getRadius());
        this.deselectNozzle(this.water.getRadius());
        },
      'modified': () => {
        console.log(this.nozzleInfo);
      },
    });
    this.water.endController.on({
      'moving': () => {
        this.findNozzlesWithRadius(data, this.water.getRadius());
        this.deselectNozzle(this.water.getRadius());
        },
      'modified': () => {
        console.log(this.nozzleInfo);
      },
    });
    this.on({
      'mousedblclick': () => {
        this.water.setConstraints({
          maxArc: this.maxArc,
          minArc: this.minArc,
          maxRadius: this.maxRadius,
          minRadius: this.minRadius
        });
      },
    });
  }

  /**
   * Iterates through the data to make a nozzles dictionary
   * @param {ProductData} data 
   * 
   * @returns {null}
   */
  createNozzlesDictionary(data: ProductData){
    let xOffset = 0;
    let yOffset = 30;

    // Iterate through the data to populate a nozzleOptions
    for (const productId in data) {
      const product = data[productId];
      for (const performanceType in product.performanceData) {
        const performanceData = product.performanceData[performanceType];
        for (const nozzleNumber in performanceData) {
          const pressures = performanceData[nozzleNumber];
          for (const pressure in pressures) {
            const nozzleData = pressures[pressure];
            const key = `${performanceType}, ${nozzleNumber}, ${pressure}`;
            this.nozzleOptions[key] = {
              show: false,
              data: nozzleData, 
              text: new FabricText(`${key}`, {
                left: xOffset,
                top: yOffset,
                fontSize: 15,
                lockMovementX: true,
                lockMovementY: true,
                hasControls: false,
              })
            };
              yOffset += 15;
              if(yOffset+30 > this.water.canvas.getHeight()) {
                yOffset = 0;
                xOffset += 150;
              }

              // Add event listeners to text to see which nozzle is selected
              this.nozzleOptions[key].text.on('mousedown', () => {
                this.nozzleOptions[key].text.set({stroke: 'green'});
                this.selectedNozzle = key;
                let scale = 180/this.water.getArcAngle();
                if (this.selectedNozzle.includes("°")){
                  scale = 1;
                }
                this.nozzleInfo = `Nozzle selected: ${performanceType} ${nozzleNumber} @ ${pressure}\n` +
                  `Flow: ${nozzleData.flow} GPM, ` +
                  `Square Precip: ${(nozzleData.precip_sq*scale).toFixed(2)} in/hr, ` +
                  `Triangle Precip: ${(nozzleData.precip_tri*scale).toFixed(2)} in/hr`;
                console.log(this.nozzleInfo);
              });
              this.water.canvas.add(this.nozzleOptions[key].text);
          }
        }
      }
    }
  }

  /**
   * Iterates through the data to find the nozzles available to use
   * @param {ProductData} data 
   * @param {number} targetRadius 
   * 
   * @returns {null}
   */
  findNozzlesWithRadius(data: ProductData, targetRadius: number): void {
    for (const productId in data) {
      const product = data[productId];
      for (const performanceType in product.performanceData) {
        const performanceData = product.performanceData[performanceType];
        for (const nozzleNumber in performanceData) {
          const pressures = performanceData[nozzleNumber];
          for (const pressure in pressures) {
            const nozzleData = pressures[pressure];
            const key = `${performanceType}, ${nozzleNumber}, ${pressure}`

            // Check if the targetRadius is within the range of the current nozzle
            if (targetRadius >= nozzleData.radius*.75 && targetRadius <= nozzleData.radius) {
              if(this.selectedNozzle !== key){
                const angle = key.split(",")[1].slice(1, -1);

                // If the nozzle works with angles only, then make sure to check
                // only the ones that are within the range of the angles [0-90], [91-180], etc
                if (key.split(",")[1].includes('°')){
                  console.log(this.water.getArcAngle(), angle)
                  if(angle === "90" && this.water.getArcAngle() <= 90 && this.water.getArcAngle() >= 0 ){
                    this.nozzleOptions[key].text.set({stroke: 'black'});
                  }
                  else if(angle === "120" && this.water.getArcAngle() <= 120 && this.water.getArcAngle() > 90 ){
                    this.nozzleOptions[key].text.set({stroke: 'black'});
                  }
                  else if(angle === "180" && this.water.getArcAngle() <= 180 && this.water.getArcAngle() > 120 ){
                    this.nozzleOptions[key].text.set({stroke: 'black'});
                  }
                  else if(angle === "360" && this.water.getArcAngle() <= 360 && this.water.getArcAngle() > 180 ){
                    this.nozzleOptions[key].text.set({stroke: 'black'});
                  }
                  else{
                    this.nozzleOptions[key].text.set({stroke: 'red'});
                  }
                }
                else{
                  this.nozzleOptions[key].text.set({stroke: 'black'});
                }
              }
            }
            else{
              this.nozzleOptions[key].text.set({stroke: 'red'})
            }
          }
        }
      }
    }
  }

  /**
   * Deselects the selected nozzle once it's no longer
   * within its range.
   * 
   * @param {number} radius 
   * 
   * @returns {null}
   */
  deselectNozzle(radius: number){
    const nozzleRadius = this.nozzleOptions[this.selectedNozzle]?.data.radius;
    if(this.selectedNozzle && (radius > nozzleRadius || nozzleRadius*.75 > radius)){
      this.selectedNozzle = null;
      this.water.setConstraints({
        maxArc: this.maxArc,
        minArc: this.minArc,
        maxRadius: this.maxRadius,
        minRadius: this.minRadius
      });
      this.nozzleInfo = "No nozzle selected";
    }
  }

}