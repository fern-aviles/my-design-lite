import { Circle } from "fabric";
import type Water from "./water";


/**
 * Used as controllers for Water
 */
export class Controller extends Circle{
  water: Water;
  controllerType: string;

  constructor(options: any){
    super(options)
    this.water = options.water;
    this.controllerType = options.controllerType
  }
}