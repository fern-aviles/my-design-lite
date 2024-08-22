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
    omittedAngles?: any;
    minScaling?: any;
    model?: NozzleTypes;
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
