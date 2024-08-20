import { Circle,
         Canvas, 
         Rect,
         FabricText,
         Line,
         util,
         type BasicTransformEvent} from 'fabric';
import data from "./data.json";
import { Controller } from './controller';

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
    options.selectable = false;
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
      this.nozzleOptions[nozzleIdx].data = nozzle;
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

    const pressures = Object.keys(this.nozzleOptions[nozzle].data);
    const pressure = this.roundPressure(pressures);
    const {width, height} = this.nozzleOptions[nozzle].data[pressure];
    this.water.setWaterDimensions(width, height);

    this.setCoords();
    
    this.water.updateControlCoords();
    this.water.updateInfo();
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
  controller: Controller;
  initialDistanceDiagonal: number;
  initialDistanceHeight!: number;
  initialAngle: number = 0;
  widthInfoLine: Line;
  heightInfoLine: Line;
  widthInfoText: FabricText;
  heightInfoText: FabricText;

  constructor(options: any){
    options.fill = 'rgba(0, 0, 255, .2)';
    super(options);
    this.product = options.product;
    this.pressure = '';
    this.side = options.side;
    this.canvas = options.canvas;

    // Adding controller to proper coordinates
    this.controller = new Controller({
      radius: 10,
      fill: 'red',
      water: this,
    });
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
    this.controller.set({left: controllerCoords.x, top: controllerCoords.y});
    
    // Setting initial distance for scaling
    const distX = this.controller.left - this.left;
    const distY = this.controller.top - this.top;
    this.initialDistanceDiagonal = Math.sqrt(distX * distX + distY * distY);
    this.initialDistanceHeight = this.height;

    // Adding Line and Info Text
    this.widthInfoLine = new Line(
      [waterCoords[2].x, waterCoords[2].y, waterCoords[3].x, waterCoords[3].y],
      {
        stroke: 'red',
        hasBorders: false,
        selectable: false,
      });
    this.heightInfoLine = new Line(
      [waterCoords[0].x, waterCoords[0].y, waterCoords[3].x, waterCoords[3].y],
      {
        stroke: 'red',
        hasBorders: false,
        selectable: false,
      });

    this.widthInfoText = new FabricText(
      `${Math.round(this.width*this.scaleX/20).toFixed(2)} ft`, {
      left: this.widthInfoLine.getCenterPoint().x,
      top: this.widthInfoLine.getCenterPoint().y,
      angle: 0,
      fontSize: 15,
      fill: 'red',
      originX: 'center',
      selectable: false,
    });
    this.heightInfoText = new FabricText(
      `${Math.round(this.height*this.scaleX/20).toFixed(2)} ft`, {
      left: this.heightInfoLine.getCenterPoint().x,
      top: this.heightInfoLine.getCenterPoint().y,
      angle: 0,
      fontSize: 15,
      fill: 'red',
      originX: 'center',
      selectable: false,
    });

    // Adding event listeners
    this.product.on({
      'moving': (e) => {this.set({left: this.product.left, top: this.product.top});
                        this.setCoords();
                        this.updateControlCoords();  
                        this.updateInfo();
                       },
      "mousedblclick": (e) => {console.log(this.product)},
    });
    this.controller.on({
      'moving': (e) => {
                         this.handleScaling();
                         this.handleRotation(e);
                         this.updateInfo();
                       },
    })

    // Add elements
    this.canvas.add(this.widthInfoLine);
    this.canvas.add(this.heightInfoLine);
    this.canvas.add(this.widthInfoText);
    this.canvas.add(this.heightInfoText);
    this.canvas.add(this.controller);

  }

  /**
   * Sets the side of the water
   * @param {string} side where product is placed
   * @returns {null}
   */
  setSide(side: string): void{
    this.side = side;
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
   * Updates the control coordinates
   * @returns {null}
   */
  updateControlCoords(): void{
    this.set({originX: this.side});
    this.setCoords();
    this.setControllerOnWater();
  }

  updateInfo(){
    const waterCoords = this.getCoords()
    if(this.side === "left"){
      this.widthInfoLine.set({ x1: waterCoords[2].x, y1:waterCoords[2].y,
                               x2: waterCoords[3].x, y2: waterCoords[3].y
                             })
      this.heightInfoLine.set({ x1: waterCoords[0].x, y1:waterCoords[0].y,
                                x2: waterCoords[3].x, y2: waterCoords[3].y
      })
    }
    else if(this.side === "right"){
      this.widthInfoLine.set({ x1: waterCoords[2].x, y1:waterCoords[2].y,
                               x2: waterCoords[3].x, y2: waterCoords[3].y
                             })
      this.heightInfoLine.set({ x1: waterCoords[1].x, y1:waterCoords[1].y,
                                x2: waterCoords[2].x, y2: waterCoords[2].y
      })
    }
    else if(this.side === 'center'){
      this.widthInfoLine.set({ x1: waterCoords[2].x, y1:waterCoords[2].y,
                               x2: waterCoords[3].x, y2: waterCoords[3].y
                             })
      this.heightInfoLine.set({ x1: waterCoords[1].x, y1:waterCoords[1].y,
                                x2: waterCoords[2].x, y2: waterCoords[2].y
      })
    }
    this.widthInfoText.set({
      text: `${(this.width*this.scaleX/20).toFixed(2)} ft`,
      left: this.widthInfoLine.getCenterPoint().x,
      top: this.widthInfoLine.getCenterPoint().y,
    })
    this.heightInfoText.set({
      text: `${(this.height*this.scaleX/20).toFixed(2)} ft`,
      left: this.heightInfoLine.getCenterPoint().x,
      top: this.heightInfoLine.getCenterPoint().y,
    })

  }

  /**
   * Handle scaling of the water
   * @returns {null}
   */
  handleScaling(): void{
    const distX = this.controller.left - this.left;
    const distY = this.controller.top - this.top;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    // initialDistance depends on the side
    let initialDistance = this.initialDistanceDiagonal;
    if (this.side === 'center'){
      initialDistance = this.initialDistanceHeight;
    }

    // Use distance as a scale factor
    let scaleFactor = distance / initialDistance;
    if(scaleFactor > 1){
      scaleFactor = 1;
    }
    else if(scaleFactor < this.minScale){
      scaleFactor = this.minScale;
    }
    this.scale(scaleFactor);
    this.setControllerOnWater();
    
    this.setCoords();
    this.canvas.renderAll();
  }

  /**
   * Handles rotation of the water
   * @param {BasicTransformEvent} e
   * @returns {null} 
   */
  handleRotation(e: BasicTransformEvent):void {
    const pointer = e.pointer;
    const centerPoint = this.product.getCenterPoint();
  
    // Calculate the angle based on the current pointer position relative to the center
    let currentAngle = Math.atan2(pointer.y - centerPoint.y, pointer.x - centerPoint.x);
    currentAngle = util.radiansToDegrees(currentAngle);
  
    // Apply offsets
    if(this.side === 'center'){
      currentAngle += 90;
    }
    else if(this.side === 'left'){
      currentAngle += 18;
    }
    else{
      currentAngle += 161;
    }

    // Update changes
    this.set({angle: currentAngle});
    this.setCoords();
    this.setControllerOnWater();
    this.canvas.renderAll();
  }

  /**
   * Sets the controller on the water
   * depending on what side it is on
   * @returns {null}
   */
  setControllerOnWater(): void{
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
    this.controller.set({left: controllerCoords.x, top: controllerCoords.y});
    this.controller.setCoords();
  }
}