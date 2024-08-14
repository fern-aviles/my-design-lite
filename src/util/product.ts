import { Circle, FabricText, type TOriginX, type TOriginY } from 'fabric';
import { Water } from './water';
import data from "./data.json";


export interface AngleDetails {
  radius: number;
  gpm: number;
  precip_sq: number;
  precip_tri: number;
  gph?: number;
}

export interface Angles {
  [angle: string]: {
    [pressure: string]: AngleDetails;
  };
}

export interface NozzleModel {
  minArc: number;
  maxArc: number;
  minRadius: number;
  maxRadius: number;
  arcSettings: { [arc: string]: number };
  color?: string;
  angles: Angles;
}

export interface NozzleTypes {
  [model: string]: NozzleModel;
}

export interface Nozzles {
  [type: string]: {
    omittedAngles: any;
    minScaling: any;
    model: NozzleTypes;
  };
}

export interface ProductType {
  name: string;
  fixedArc: boolean;
  minArc: number;
  maxArc: number;
  minRadius: number;
  maxRadius: number;
  recPressure: string;
  nozzles: Nozzles;
}

export interface Products {
  [productID: string]: ProductType;
}


/**
 * Creates a HunterProduct object which filters data and
 * allows users to customize the object's water radius
 * and arc angle
 * 
 * @extends Circle
 */
export class HunterProduct extends Circle {
  text: FabricText;
  data: any;
  water: Water;
  name: string;
  productID: string;
  minRadius: number;
  maxRadius: number;
  minArc: number;
  maxArc: number;
  fixedArc: boolean;
  nozzleOptions: any;
  selectedNozzle: string;
  pressure: string;
  nozzleInfo: string;
  autoSelectable: any;
  omittedAngles: any;

  /**
   * Constructs the HunterProduct object and is using 
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
      radius: 10,
      fill: 'white',
      hasControls: false,
    };

    super(options);

    this.productID = waterOptions.productID;
    this.data = data;
    const product = this.data[this.productID]
    this.name = product.name;
    this.minRadius = product.minRadius;
    this.maxRadius = product.maxRadius;
    this.minArc = product.minArc;
    this.maxArc = product.maxArc;
    this.fixedArc = product.fixedArc;
    this.autoSelectable = product.autoSelect;
    this.nozzleOptions = {};
    this.selectedNozzle = "";
    this.nozzleInfo = "No nozzle selected";
    this.pressure = waterOptions.pressure || product.recPressure;
    this.omittedAngles = product.omittedAngles;
    console.log(this.name);
    console.log("Selected Pressure:", this.pressure)
    waterOptions.minRadius = this.minRadius;
    waterOptions.maxRadius = this.maxRadius;
    waterOptions.minArc = this.minArc;
    waterOptions.maxArc = this.maxArc;
    waterOptions.fixedArc = this.fixedArc;
    waterOptions.omittedAngles = product.omittedAngles;
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
            omittedAngles: waterOptions.omittedAngles,
    };

    // Create the Water instance
    this.water = new Water(temp, this);

    this.text = new FabricText("Nozzle Options: \n", {
      left: 30,
      top: 0,
      fontSize: 25,
    });
    this.createNozzlesDictionary(this.data);
    this.findNozzles(this.data, this.minRadius);
    this.water.midController.on({
      'moving': () => {
        this.findNozzles(this.data, this.water.getRadius());
      },
      'modified': () => {
        this.setNozzle(this.selectedNozzle);
        console.log(this.nozzleInfo);
      },
    });
    this.water.startController.on({
      'moving': () => {
        this.findNozzles(this.data, this.water.getRadius());
        },
      'modified': () => {
        this.setNozzle(this.selectedNozzle);
        console.log(this.nozzleInfo);
      },
    });
    this.water.endController.on({
      'moving': () => {
        this.findNozzles(this.data, this.water.getRadius());
        },
      'modified': () => {
        this.setNozzle(this.selectedNozzle);
        console.log(this.nozzleInfo);
      },
    });
    this.on({
      'mousedblclick': () => {
        console.log(this)
        this.water.setConstraints({
          maxArc: this.maxArc,
          minArc: this.minArc,
          maxRadius: this.maxRadius,
          minRadius: this.minRadius
        });
        console.log(this.water.maxArc)
      },
    });
  }

  /**
   * Renders the HunterProduct object
   * @param ctx 
   * @returns 
   */
  render(ctx : CanvasRenderingContext2D): void{
    super.render(ctx);
    if(this.name !== "Standard MP Rotator"){
      return;
    }
    ctx.save();

    ctx.translate(this.left, this.top);
    ctx.rotate(this.angle * Math.PI / 180);

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
   * @param {Products} data 
   * 
   * @returns {null}
   */
  createNozzlesDictionary(data: Products): void{
    let xOffset = 0;
    let yOffset = 30;
    const id = this.productID;
    const nozzles = data[id].nozzles;
    let minScaling = 0.25;

    // Iterate through nozzles
    // ex. standard, mp1000
    for(let nozzle in nozzles){ 
      const models = nozzles[nozzle].model;
      const omittedAngles = nozzles[nozzle].omittedAngles;

      // Iterate through the models
      // ex. 1.5, 90
      for(let model in models){ 
        const data = models[model];
        const key = `${nozzle}, ${model}`;

        // Set the minimum scaling for the water object
        if (nozzles[nozzle].minScaling > minScaling){
          minScaling = nozzles[nozzle].minScaling;
        }
        this.nozzleOptions[key] = {
          show: false,
          model: model,
          data: data, 
          pressure: this.pressure,
          arcSettings: data.arcSettings,
          minArc: data.minArc || 0,
          maxArc: data.maxArc || 360,
          minScaling: nozzles[nozzle].minScaling || 0.25,
          inArc: false,
          inRadius: false,
          omittedAngles: omittedAngles || [],
          text: new FabricText(`${key}`, {
            left: xOffset,
            top: yOffset,
            fontSize: 15,
            lockMovementX: true,
            lockMovementY: true,
            hasControls: false,
            selectable: false,
            stroke: "red",
          })
        };
        yOffset += 15;
        if(yOffset+30 > this.water.canvas.getHeight()) {
          yOffset = 0;
          xOffset += 175;
        }
        
        // Add event listeners to text to see which nozzle is selected
        this.nozzleOptions[key].text.on('mousedown', (e: any) => {
          this.nozzleOptions[key].text.set({stroke: 'green'});
          console.log(this.selectedNozzle, this.nozzleInfo);
        });
        this.water.canvas.add(this.nozzleOptions[key].text);
      }
    }
    this.water.setMinScaling(minScaling);
  }

  /**
   * Iterates through the data to find the nozzles available to use
   * @param {Products} data 
   * @param {number} targetRadius 
   * 
   * @returns {null}
   */
  findNozzles(data: Products, targetRadius: number): void {

    // Helper function to find nozzles in radius
    this.findNozzlesRadius(data, targetRadius);

    // Helper function to find nozzles in arc
    this.findNozzlesArc();

    // Select a nozzle
    if (!this.selectedNozzle && this.autoSelectable){
      this.selectNozzle();
    }

  }

  /**
   * Selects the most optimal nozzle
   * 
   * @returns {null}
   */
  selectNozzle(): void {
    // Available nozzle ranking
    // Sorts by radius and then by arc and then by string
    let nozzleRanking = [];

    // If there are no available nozzles,
    // then candidate nozzles which are nozzles that
    // don't work with the current arc setting but work
    // with the radius setting are next
    let candidateNozzleRanking = [];
    
    for(let model in this.nozzleOptions){
      let modelObj = this.nozzleOptions[model];

      // Setting the proper angle setting
      const anglesInModel = modelObj.data.angles
      let currAngle = this.roundAngle(Object.keys(anglesInModel)); 
      if (Object.keys(anglesInModel).length === 1){
        currAngle = Object.keys(anglesInModel)[0];
      }

      // Setting a new pressure in case the nozzle doesn't 
      // have the same pressure available
      let prefPressure = null;
      prefPressure = this.roundPressure(Object.keys(anglesInModel[currAngle]));
      modelObj.pressure = prefPressure;
      let pressureData = anglesInModel[currAngle][prefPressure];
      let modelRadius = pressureData.radius;

      const arcAngle = this.water.getArcAngle();
      const arcRadius = this.water.getRadius();

      // Checking if the current arc setting works
      // if it does, it goes to nozzleRanking
      if(modelObj.inRadius && modelObj.inArc){
        let radiusDif = Math.abs(arcRadius-modelRadius) as number;
        let angleDif = Math.abs(parseInt(currAngle)-arcAngle) as number;

        nozzleRanking.push([radiusDif, angleDif, model]);
      }

      // If it doesn't but it's within the radius, then it
      // goes to candidateNozzles
      else if (modelObj.inRadius && !modelObj.inArc){
        let radiusDif = Math.abs(arcRadius-modelRadius) as number;
        let angleDif = Math.abs(parseInt(currAngle)-arcAngle) as number;

        candidateNozzleRanking.push([radiusDif, angleDif, model]);
      }
    }

    // If there are nozzles to choose from
    // select one of them
    if(nozzleRanking.length > 0){
      nozzleRanking.sort((a, b) => {
        // Compare the first elements, which are numbers
        if (a[0] !== b[0]) {
          return (a[0] as number) - (b[0] as number);
        }
        // Compare the second elements, which are also numbers
        if (a[1] !== b[1]) {
          return (a[1] as number) - (b[1] as number);
        }
        // Compare the third elements, which are strings
        return (a[2] as string).localeCompare(b[2] as string);
      });
      this.setNozzle(nozzleRanking[0][2] as string);
    }

    // If there are no nozzles to choose from,
    // select from the candidate ranking
    else if (candidateNozzleRanking.length > 0){
      candidateNozzleRanking.sort((a, b) => {

        // Compare the first elements, which are numbers
        if (a[0] !== b[0]) {
          return (a[0] as number) - (b[0] as number);
        }

        // Compare the second elements, which are also numbers
        if (a[1] !== b[1]) {
          return (a[1] as number) - (b[1] as number);
        }

        // Compare the third elements, which are strings
        return (a[2] as string).localeCompare(b[2] as string);
      });
      this.setNozzle(candidateNozzleRanking[0][2] as string);

      // Change arc setting if it's out of bounds with candidate nozzle
      if(this.maxArc != 0 && this.maxArc < this.water.getArcAngle() ){
        let newArc = Math.abs(this.water.getArcAngle() - this.maxArc);
        const newStart = this.water.startAngle + (newArc/2);
        const newEnd = this.water.endAngle - (newArc/2);
        this.water.setWater(newStart, newEnd);
        this.water.setConstraints({
          maxArc: this.maxArc,
          minArc: this.minArc,
          maxRadius: this.maxRadius,
          minRadius: this.minRadius,
        });
      }
    }
  }

  /**
   * Checks for nozzles that work for the current radius
   * @param data 
   * @param targetRadius 
   * @returns {null}
   */
  findNozzlesRadius(data: any, targetRadius: number): void {
    const id = this.productID;
    const nozzles = data[id].nozzles;
    for(let nozzle in nozzles){
      const models = nozzles[nozzle].model;
      for(let model in models){
        const key = `${nozzle}, ${model}`;
        const data = models[model];
        
        // Setting the proper angle setting
        let currAngle = this.roundAngle(Object.keys(this.nozzleOptions[key].data.angles)); 
        if (Object.keys(data.angles).length === 1){
          currAngle = Object.keys(data.angles)[0];
        }

        // Setting a new pressure in case the nozzle doesn't 
        // have the same pressure available
        let prefPressure = null;
        prefPressure = this.roundPressure(Object.keys(data.angles[currAngle]));
        this.nozzleOptions[key].pressure = prefPressure;

        const radius = data.angles[currAngle][prefPressure].radius;

        // Check if targetRadius is within the range of the current nozzle
        let roundedMinRadius = radius*(1-this.nozzleOptions[key].minScaling);
        if (targetRadius >= roundedMinRadius &&
            targetRadius <= radius) {
              this.nozzleOptions[key].inRadius = true;
        }
        else{
          if(key === this.selectedNozzle){
            this.deselectNozzle();
          }
          this.nozzleOptions[key].inRadius = false;
          this.nozzleOptions[key].text.set({stroke: 'red'});
          this.nozzleOptions[key].show = false;
        }
      }
    }
  }

  /**
   * Checks for nozzles that work with the current arc setting
   * @returns {null}
   */
  findNozzlesArc(): void {
    let maxArc = 0;
    let currentOmittedAngles = [];
    for(let model in this.nozzleOptions){
      const modelObj = this.nozzleOptions[model];

      // Setting the proper angle setting
      const anglesInModel = modelObj.data.angles;
      let currAngle = this.roundAngle(Object.keys(anglesInModel)); 
      if (Object.keys(anglesInModel).length === 1){
        currAngle = Object.keys(anglesInModel)[0];
      }

      // Setting a new pressure in case the nozzle doesn't 
      // have the same pressure available
      let prefPressure = null;
      prefPressure = this.roundPressure(Object.keys(anglesInModel[currAngle]));
      modelObj.pressure = prefPressure;

      // if nozzle is within radius
      if (modelObj.inRadius) {
        const modelMaxArc = modelObj.maxArc;
        const modelMinArc = modelObj.minArc;

        // out of the nozzles that work with the radius,
        // make sure to set the maxArc for water to be the
        // largest arc of one of the nozzles
        if (modelMaxArc > maxArc){
          maxArc = modelMaxArc;
        }
        const arcAngle = this.water.getArcAngle();
        const modelOmittedAngles = modelObj.omittedAngles;
        if(modelOmittedAngles.length > 0){
          currentOmittedAngles.push(...modelObj.omittedAngles);
        }
        else if(this.omittedAngles){
          currentOmittedAngles.push(...this.omittedAngles);
        }

        // Check if the current nozzle is selectable with the current arc
        if (modelMinArc <= arcAngle && arcAngle <= modelMaxArc){
          modelObj.text.set({stroke: 'black'});
          modelObj.inArc = true;
          modelObj.show = true;
        }
        else{
          if(model === this.selectedNozzle){
            this.deselectNozzle();
          }
          modelObj.text.set({stroke: 'orange'});
          modelObj.inArc = false;
          modelObj.show = false;
        }
      }
    }

    // If the selected nozzle doesn't have nozzles at a specific angle,
    // remove the option to select that angle
    currentOmittedAngles = Array.from(new Set(currentOmittedAngles));
    this.water.setOmittedAngles(currentOmittedAngles);

    this.maxArc = maxArc;
  }

  /**
   * Deselects the selected nozzle once it's no longer
   * within its range.
   * @param {number} radius 
   * @returns {null}
   */
  deselectNozzle(): void{
    this.selectedNozzle = "";
    this.water.setConstraints({
      maxArc: this.maxArc,
      minArc: this.minArc,
      maxRadius: this.maxRadius,
      minRadius: this.minRadius,
    });
    this.water.setOmittedAngles(this.omittedAngles);
    this.set({ fill: "white"});
    this.nozzleInfo = "No nozzle selected";
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


  /**
   * Rounds the angle up or down depending on
   * which one it is closer to.
   * @param angles string array of angles
   * @returns {string}
   */
  roundAngle(angles: string[]): string{
    if(angles[0] === "0" && angles[1] === "360"){
      return "360";
    }
    const angle = this.water.getArcAngle();
    let closestAngle = angles[0];
    let closestmodel = parseInt(angles[0]);
    let minDifference = Math.abs(angle - closestmodel);
    for (let i = 1; i < angles.length; i++) {
      const currentmodel = parseInt(angles[i]);
      const currentDifference = Math.abs(angle - currentmodel);
      if (currentDifference < minDifference) {
        closestAngle = angles[i];
        minDifference = currentDifference;
      }
    }
    return closestAngle;
  }

  /**
   * Sets nozzle
   * @param selectedNozzle 
   * @returns {null}
   */
  setNozzle(selectedNozzle: string): void{ 
    if(!selectedNozzle){
      return;
    }
    this.selectedNozzle = selectedNozzle;
    let nozzle = this.nozzleOptions[selectedNozzle];
    
    let angles = nozzle.arcSettings;
    const key = this.roundAngle(Object.keys(angles));

    // Finding suitable pressure
    let pressures = Object.keys(nozzle.data.angles[key]);
    const closestPressure = this.roundPressure(pressures);

    // Selecting and outputting nozzle information
    this.selectedNozzle = selectedNozzle;
    let gpm = nozzle.data.angles[key][closestPressure].gpm;
    let precip_sq = nozzle.data.angles[key][closestPressure].precip_sq;
    let precip_tri = nozzle.data.angles[key][closestPressure].precip_tri;
    this.nozzleInfo = 
      `Nozzle selected: ${this.selectedNozzle}\n` +
      `Flow: ${gpm} GPM, ` +
      `Square Precip: ${(precip_sq).toFixed(2)} in/hr, ` +
      `Triangle Precip: ${(precip_tri).toFixed(2)} in/hr`;

    this.set({ fill: nozzle.data.color || 'black'});
    this.water.canvas.renderAll();
  }

  /**
   * Gets the currently selected nozzle
   * @returns {string}
   */
  getSelectedNozzle(): string{
    return this.selectedNozzle;
  }

  /**
   * Checks intersection between two sets.
   * @param setA 
   * @param setB 
   * @returns 
   */
  intersection<T>(setA: Set<T>, setB: Set<T>): any {
    const result = new Set<T>();
    for (let item of setA) {
      if (setB.has(item)) {
        result.add(item);
      }
    }

    return Array.from(result);
  }
}