import { Circle, FabricText, Gradient, type TOriginX, type TOriginY } from 'fabric';
import { Water } from './water';
import data from "./data.json";


interface AngleDetails {
  radius: number;
  gpm: number;
  precip_sq: number;
  precip_tri: number;
  gph?: number;
}

interface Angles {
  [angle: string]: {
    [pressure: string]: AngleDetails;
  };
}

interface NozzleModel {
  minArc: number;
  maxArc: number;
  minRadius: number;
  maxRadius: number;
  arcSettings: { [arc: string]: number };
  color?: string;
  angles: Angles;
}

interface NozzleTypes {
  [model: string]: NozzleModel;
}

interface Nozzles {
  [type: string]: {
    model: NozzleTypes;
  };
}

interface ProductType {
  name: string;
  fixedArc: boolean;
  minArc: number;
  maxArc: number;
  minRadius: number;
  maxRadius: number;
  recPressure: string;
  omittedRanges: any;
  nozzles: Nozzles;
}

interface Products {
  [productID: string]: ProductType;
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
    this.nozzleOptions = {};
    this.selectedNozzle = "";
    this.nozzleInfo = "No nozzle selected";
    this.pressure = waterOptions.pressure || product.recPressure;
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
    console.log(waterOptions)

    // Create the Water instance
    this.water = new Water(temp, this);

    this.text = new FabricText("Nozzle Options: \n", {
      left: 30,
      top: 0,
      fontSize: 25,
    });
    this.createNozzlesDictionary(this.data);
    this.findNozzlesWithRadius(this.data, this.minRadius);
    this.water.midController.on({
      'moving': () => {
        this.findNozzlesWithRadius(this.data, this.water.getRadius());
        this.deselectNozzle(this.water.getRadius(), this.water.getArcAngle());
      },
      'modified': () => {
        console.log(this.nozzleInfo);
      },
    });
    this.water.startController.on({
      'moving': () => {
        this.findNozzlesWithRadius(this.data, this.water.getRadius());
        this.deselectNozzle(this.water.getRadius(), this.water.getArcAngle());
        },
      'modified': () => {
        console.log(this.nozzleInfo);
      },
    });
    this.water.endController.on({
      'moving': () => {
        this.findNozzlesWithRadius(this.data, this.water.getRadius());
        this.deselectNozzle(this.water.getRadius(), this.water.getArcAngle());
        },
      'modified': () => {
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
      },
    });
  }


  render(ctx : CanvasRenderingContext2D){
    super.render(ctx);
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

    for(let nozzle in nozzles){ 
      const numbers = nozzles[nozzle].model;
      for(let number in numbers){ 
        const pressures = numbers[number];
        const key = `${nozzle}, ${number}`;
        this.nozzleOptions[key] = {
          show: false,
          number: number,
          data: pressures, 
          pressure: this.pressure,
          arcSettings: pressures.arcSettings,
          minArc: pressures.minArc || 0,
          maxArc: pressures.maxArc || 360,
          inArc: false,
          inRadius: false,
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
          this.selectNozzleSettings(e);
          this.nozzleOptions[key].text.set({stroke: 'green'});
          console.log(this.selectedNozzle, this.nozzleInfo);
        });
        this.water.canvas.add(this.nozzleOptions[key].text);
      }
    }
  }

  /**
   * Iterates through the data to find the nozzles available to use
   * @param {Products} data 
   * @param {number} targetRadius 
   * 
   * @returns {null}
   */
  findNozzlesWithRadius(data: Products, targetRadius: number): void {
    const id = this.productID;
    const nozzles = data[id].nozzles;
    let mainMaxArc = 0;
    for(let nozzle in nozzles){
      const numbers = nozzles[nozzle].model;
      for(let number in numbers){
        const key = `${nozzle}, ${number}`;

        const pressures = numbers[number];
        let prefPressure = null;
        let tempKey = number; 
        if (Object.keys(pressures.angles).length === 1){
          tempKey = Object.keys(pressures.angles)[0];
        }
        prefPressure = this.roundPressure(Object.keys(pressures.angles[tempKey]));

        // Setting a new pressure in case the nozzle doesn't 
        // have the same pressure availble
        this.nozzleOptions[key].pressure = prefPressure;

        const radius = pressures.angles[tempKey][prefPressure].radius;

        // Check if targetRadius is within the range of the current nozzle
        if (targetRadius >= radius*.75 &&
            targetRadius <= radius) {
          if(this.selectedNozzle !== key){
            
            // Check if the arcAngle is within min and max arc
            let arcAngle = this.water.getArcAngle();
            let minArc = pressures.minArc;
            let maxArc = pressures.maxArc;
            if (arcAngle <= maxArc && arcAngle >= minArc){
              this.nozzleOptions[key].text.set({stroke: 'black'});
              this.nozzleOptions[key].show = true;
              this.nozzleOptions[key].inArc = true;
              this.nozzleOptions[key].inRadius = true;
              if (!this.selectedNozzle) {
                this.setNozzle(key);
              }
              if (pressures.maxArc >= mainMaxArc){
                mainMaxArc = pressures.maxArc;
              }
              const constraints = {
                maxArc: mainMaxArc,
                minArc: this.minArc,
                maxRadius: this.maxRadius,
                minRadius: this.minRadius
              };
              this.water.setConstraints(constraints);
            }
            else{
              this.nozzleOptions[key].text.set({stroke: 'orange'});
              this.nozzleOptions[key].show = false;
              this.nozzleOptions[key].inArc = false;
              this.nozzleOptions[key].inRadius = true;

            }
          }
        }
        else{
          this.nozzleOptions[key].show = false;
          this.nozzleOptions[key].text.set({stroke: 'red'});
          this.nozzleOptions[key].inArc = false;
          this.nozzleOptions[key].inRadius = false;
        }
      }
    }
    let selected = null;
    if(!this.selectedNozzle){
      for(let n in this.nozzleOptions){
        let nozzle = this.nozzleOptions[n];
        let nozzleArc = parseInt(nozzle.data.maxArc);
        if(!nozzle.inArc && nozzle.inRadius && nozzleArc > mainMaxArc){
          selected = n;
          mainMaxArc = nozzleArc;
        }
      }
      if(selected){
        if (this.water.getArcAngle() > mainMaxArc){
          let newArc = Math.abs(this.water.getArcAngle() - mainMaxArc);
          const constraints = {
            maxArc: mainMaxArc,
            minArc: this.minArc,
            maxRadius: this.maxRadius,
            minRadius: this.minRadius
          };
          const newStart = this.water.startAngle + (newArc/2);
          const newEnd = this.water.endAngle - (newArc/2);
          this.water.setWater(newStart, newEnd);
          this.setNozzle(selected);
          this.water.setConstraints(constraints);
        }
      }
    }
  }

  /**
   * Deselects the selected nozzle once it's no longer
   * within its range.
   * 
   * @param {number} radius 
   * @returns {null}
   */
  deselectNozzle(radius: number, angle: number): void{
    if(!this.selectedNozzle){
      return;
    }
    let deselect = false;
    const nozzle = this.nozzleOptions[this.selectedNozzle];

    // Access current PSI settings
    const angleOptions = nozzle.data.angles;
    const pressure = nozzle.pressure;
    let number = nozzle.number;
    if (Object.keys(angleOptions).length === 1){
      number = Object.keys(angleOptions)[0];
    }

    // Check if the current radius is within the selected 
    // nozzle at pressure's radius
    const nozzleRadius = angleOptions[number][pressure].radius;
    if(radius > nozzleRadius || nozzleRadius*.75 > radius){
      deselect = true;
    }

    // Checking if the angle of the current arc
    // is greater than the nozzle's minArc or 
    // is less than the maxArc
    let minArc = nozzle.minArc || 0;
    let maxArc = nozzle.maxArc || 360;
    if (minArc > angle || angle > maxArc){
      deselect = true;
    }

    if (deselect){
      this.selectedNozzle = "";
      this.water.setConstraints({
        maxArc: this.maxArc,
        minArc: this.minArc,
        maxRadius: this.maxRadius,
        minRadius: this.minRadius,
      });
      this.set({ fill: "white"});
      this.nozzleInfo = "No nozzle selected";
    }
  }


  /**
   * Selects the settings that are appropriate
   * according to the arc's configuration
   * @param e 
   */
  selectNozzleSettings(e: any): void{
    let nozzle = this.nozzleOptions[e.target.text];
    if (e instanceof Object){

    }

    // Finding the best nozzle setting according 
    // to the arc's angle
    let angles = nozzle.arcSettings;
    const key = this.roundAngle(Object.keys(angles));

    // Finding suitable pressure
    let pressures = Object.keys(nozzle.data.angles[key]);
    const closestPressure = this.roundPressure(pressures);

    // Selecting and outputting nozzle information
    this.selectedNozzle = e.target.text;
    let gpm = nozzle.data.angles[key][closestPressure].gpm;
    let precip_sq = nozzle.data.angles[key][closestPressure].precip_sq;
    let precip_tri = nozzle.data.angles[key][closestPressure].precip_tri;
    this.nozzleInfo = 
      `Nozzle selected: ${this.selectedNozzle}\n` +
      `Flow: ${gpm} GPM, ` +
      `Square Precip: ${(precip_sq).toFixed(2)} in/hr, ` +
      `Triangle Precip: ${(precip_tri).toFixed(2)} in/hr`;
  }


  /**
   * Rounds the pressure up or down depending on
   * which one it is closer to.
   * @param pressures string array of pressures
   * @returns {string}
   */
  roundPressure(pressures: string[]): string{
    let closestPressure = pressures[0];
    let closestNumber = parseInt(pressures[0]);
    let minDifference = Math.abs(parseInt(this.pressure) - closestNumber);
    for (let i = 1; i < pressures.length; i++) {
      const currentNumber = parseInt(pressures[i]);
      const currentDifference = Math.abs(parseInt(this.pressure) - currentNumber);
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
      return "360"
    }
    const angle = this.water.getArcAngle();
    let closestPressure = angles[0];
    let closestNumber = parseInt(angles[0]);
    let minDifference = Math.abs(angle - closestNumber);
    for (let i = 1; i < angles.length; i++) {
      const currentNumber = parseInt(angles[i]);
      const currentDifference = Math.abs(angle - currentNumber);
      if (currentDifference < minDifference) {
        closestPressure = angles[i];
        minDifference = currentDifference;
      }
    }
    return closestPressure;
  }

  setNozzle(e: string){ 
    this.selectedNozzle = e;
    let nozzle = this.nozzleOptions[e];
    
    let angles = nozzle.arcSettings;
    const key = this.roundAngle(Object.keys(angles));

    // Finding suitable pressure
    let pressures = Object.keys(nozzle.data.angles[key]);
    const closestPressure = this.roundPressure(pressures);

    // Selecting and outputting nozzle information
    this.selectedNozzle = e;
    let gpm = nozzle.data.angles[key][closestPressure].gpm;
    let precip_sq = nozzle.data.angles[key][closestPressure].precip_sq;
    let precip_tri = nozzle.data.angles[key][closestPressure].precip_tri;
    this.nozzleInfo = 
      `Nozzle selected: ${this.selectedNozzle}\n` +
      `Flow: ${gpm} GPM, ` +
      `Square Precip: ${(precip_sq).toFixed(2)} in/hr, ` +
      `Triangle Precip: ${(precip_tri).toFixed(2)} in/hr`;

    this.set({ fill: nozzle.data.color});
    this.water.canvas.renderAll();
  }

  getSelectedNozzle(){
    return this.selectedNozzle;
  }
}