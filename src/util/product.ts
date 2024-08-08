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
    minScaling: any;
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
  autoSelectable: any;

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
    this.autoSelectable = product.autoSelect;
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
        this.deselectNozzle(this.water.getRadius(), this.water.getArcAngle());
        this.findNozzlesWithRadius(this.data, this.water.getRadius());
      },
      'modified': () => {
        this.setNozzle(this.selectedNozzle);
        console.log(this.nozzleInfo);
      },
    });
    this.water.startController.on({
      'moving': () => {
        this.deselectNozzle(this.water.getRadius(), this.water.getArcAngle());
        this.findNozzlesWithRadius(this.data, this.water.getRadius());
        },
      'modified': () => {
        this.setNozzle(this.selectedNozzle);
        console.log(this.nozzleInfo);
      },
    });
    this.water.endController.on({
      'moving': () => {
        this.deselectNozzle(this.water.getRadius(), this.water.getArcAngle());
        this.findNozzlesWithRadius(this.data, this.water.getRadius());
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
      },
    });
  }

  /**
   * Renders the Product object
   * @param ctx 
   * @returns 
   */
  render(ctx : CanvasRenderingContext2D): void{
    super.render(ctx);
    if(this.name === "PGP Ultra"){
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
  findNozzlesWithRadius(data: Products, targetRadius: number): void {
    const id = this.productID;
    const nozzles = data[id].nozzles;
    let maxArc = 0;
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
        const roundedMinRadius = parseInt((radius*(1-this.nozzleOptions[key].minScaling)).toFixed(2));
        if (targetRadius >= roundedMinRadius &&
            targetRadius <= radius) {
          if(this.selectedNozzle !== key){
            
            // Check if the arcAngle is within min and max arc
            let arcAngle = this.water.getArcAngle();
            let nozzleMinArc = data.minArc;
            let nozzleMaxArc = data.maxArc;
            if (arcAngle <= nozzleMaxArc && arcAngle >= nozzleMinArc){
              this.nozzleOptions[key].text.set({stroke: 'black'});
              this.nozzleOptions[key].show = true;
              this.nozzleOptions[key].inArc = true;
              this.nozzleOptions[key].inRadius = true;
              if (!this.selectedNozzle && this.autoSelectable) {
                this.setNozzle(key);
              }
              if (data.maxArc >= maxArc){
                maxArc = data.maxArc;
              }
              const constraints = {
                maxArc: maxArc,
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
          if(this.selectedNozzle === key){
            // Deselecting nozzle
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
        let nozzleMaxArc = parseInt(nozzle.data.maxArc);
        if(!nozzle.inArc && nozzle.inRadius && nozzleMaxArc > maxArc){
          selected = n;
          maxArc = nozzleMaxArc;
        }
      }
      if(selected){
        if (this.water.getArcAngle() > maxArc){
          let newArc = Math.abs(this.water.getArcAngle() - maxArc);
          const constraints = {
            maxArc: maxArc,
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
    else{
      
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
    let model = nozzle.model;
    if (Object.keys(angleOptions).length === 1){
      model = Object.keys(angleOptions)[0];
    }
    else if(!Object.keys(angleOptions).includes(model)){
      model = this.roundAngle(Object.keys(angleOptions))
    }

    // Check if the current radius is within the selected 
    // nozzle at pressure's radius
    const nozzleRadius = angleOptions[model][pressure].radius;
    if(radius > nozzleRadius || nozzleRadius*(1-nozzle.data.minScaling) > radius){
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
      return "360"
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

    this.set({ fill: nozzle.data.color || 'white'});
    this.water.canvas.renderAll();
  }

  /**
   * Gets the currently selected nozzle
   * @returns {string}
   */
  getSelectedNozzle(): string{
    return this.selectedNozzle;
  }
}