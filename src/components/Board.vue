<!-- This file contains the canvas the user will be using to design
 their sprinkler layout  -->

 <template>
  <h1>canvas</h1>
  <canvas ref="canvas" height="1000" width="2000"></canvas>
</template>

<script setup lnag="ts">
  import { Canvas, Circle, Path, Group, util } from 'fabric';
  import { ref, onMounted } from 'vue';

  const canvas = ref(null);
  let c = null;
  const radius = 200;
  const RADIUS = 200;
  const STARTANGLE = 315;
  const ENDANGLE = 45;
  let rotors = 0;

  /**
   * Gets the sweep angle beteween 2 points
   * @param {number} startAngle: radians
   * @param {number} endAngle: radians
   * 
   * @returns {number} sweep
   */
  const getSweepAngle = (startAngle, endAngle) => {
    let sweep = endAngle - startAngle;

    // Normalize the sweep angle to ensure it's between 0 and 2*PI radians.
    while (sweep < 0) sweep += 2 * Math.PI;
    while (sweep > 2 * Math.PI) sweep -= 2 * Math.PI;

    return sweep;
  };

  /**
   * The function is used for setting the points on the circumference of the 
   * @param {number} radius: the radius of the rotor
   * @param {number} angleInRadians: the angle (in radians) of where the point is at
   * 
   * @returns {Circle} controller
   */
  const getPointOnCircumference = (radius, angleInRadians) => {
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    return new Circle({
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      radius: 5,
      fill: 'black',
      angle: angleInRadians*(Math.PI/180),
    });
  };

  /**
   * Used for setting the angle between 0 and Math.PI * 2
   * or 0 and 360 depending if the angle is in radians
   * @param {number} angle: in radians
   * 
   * @returns {number} an angle between 0 and 2* PI or 0 and 360
   */
  const normalizeAngle = (angle, radians=true) => {
    if (radians){
      while (angle < 0) {
        angle += Math.PI * 2;
      }
      while (angle >= Math.PI * 2) {
        angle -= Math.PI * 2;
      }
      return angle;
    }
    else{
      while (angle < 0) {
        angle += 360;
      }
      while (angle >= 360) {
        angle -= 360;
      }
      return angle;
    }
  };

 /**
 * This function redraws the rotor whenever it is called.
 * @param {circle} radius: the radius of the rotor
 * 
 * @returns {null}
 */
  const updateArc = (radius) => {
    let arc = radius.getObjects()[1],
        startAngle = normalizeAngle(radius.startAngleDegrees - radius.angle, false), 
        endAngle = normalizeAngle(radius.endAngleDegrees - radius.angle, false),
        rad = radius.radius,
        sweep = getSweepAngle(startAngle * (Math.PI / 180), endAngle * (Math.PI / 180));
    const newPath = createPiePath(startAngle * (Math.PI / 180),
                                   endAngle * (Math.PI / 180), 
                                   200, 200, rad, sweep);
    arc.set({ 
      startAngleDegrees: startAngle,
      startAngleRadians: startAngle * (Math.PI / 180),
      endAngleDegrees: endAngle,
      endAngleRadians: endAngle * (Math.PI / 180),
      path: new Path(newPath).path}),
    arc.setCoords();
    c.renderAll();
  };

  /**
   * Finds the distance from (x1, y2) and (x2, y2).
   * @param {number} x1 
   * @param {number} y1 
   * @param {number} x2 
   * @param {number} y2 
   * 
   * @returns {number}
   */
  const findDistancefromPoint = (x1, y1, x2, y2) => {
    const x_dif = x2-x1;
    const y_dif = y2 - y1;
    const distance = Math.sqrt(Math.pow(x_dif, 2) + Math.pow(y_dif, 2));
    return distance;
  };

  /**
   * Calculates the rotation of the radius in turn, changes control 
   * angles so it reflects the changes properly anytime the radius
   * is being rotated.
   * @param {Circle} midControl 
   * @returns {null}
   */
  const getRotation = (midControl) => {
    const rotor = midControl.parent,
          startControl = rotor.startControl,
          endControl = rotor.endControl,
          centerX = rotor.getCenterPoint().x,
          centerY = rotor.getCenterPoint().y;

    // Calculate the new angle of the midControl
    const midAngle = calculateAngle(midControl);

    // Calculate the initial angles of startControl and endControl
    const initialStartAngle = startControl.angleInRadians;
    const initialEndAngle = endControl.angleInRadians;

    // Calculate the initial angle difference between startControl and endControl
    const initialAngleDifference = getSweepAngle(initialStartAngle, initialEndAngle);

    // Calculate the new angles for startControl and endControl
    const newStartAngle = midAngle - initialAngleDifference / 2;
    const newEndAngle = midAngle + initialAngleDifference / 2;

    // Update the angles for startControl and endControl
    startControl.angleInDegrees = normalizeAngle(newStartAngle * (180 / Math.PI), false);
    startControl.angleInRadians = normalizeAngle(newStartAngle);

    endControl.angleInDegrees = normalizeAngle(newEndAngle * (180 / Math.PI), false);
    endControl.angleInRadians = normalizeAngle(newEndAngle);

    // Update the positions for startControl and endControl
    startControl.set({
      left: centerX + (rotor.scaleX *  rotor.radius) * Math.cos(startControl.angleInRadians),
      top: centerY + (rotor.scaleX *  rotor.radius) * Math.sin(startControl.angleInRadians),
    });
    startControl.setCoords();
    endControl.set({
      left: centerX + (rotor.scaleX *  rotor.radius) * Math.cos(endControl.angleInRadians),
      top: centerY + (rotor.scaleX *  rotor.radius) * Math.sin(endControl.angleInRadians),
    });
    endControl.setCoords();
    // Change the angles of the controllers and radius
    rotor.angle = midControl.angleInDegrees;
    midControl.angleInRadians = midControl.angleInDegrees * (Math.PI / 180);
    rotor.startAngleDegrees = startControl.angleInDegrees;
    rotor.startAngleRadians = startControl.angleInRadians;
    rotor.endAngleDegrees = endControl.angleInDegrees;
    rotor.endAngleRadians = endControl.angleInRadians;
    
    c.renderAll();
  };

  /**
   * Used for calculating the angle for the selected controller
   * @param {Circle} controller: One of the circles that control the arc
   * 
   * @returns {number}
   */
  const calculateAngle = (controller) => {
    let px = controller.left,
        py = controller.top,
        cx = 0,
        cy = 0,
        rotor = null;
    c.getObjects().forEach(obj => {
      if (obj.rotorId === controller.rotor){
        rotor = obj;
        cx = rotor.getCenterPoint().x;
        cy = rotor.getCenterPoint().y;
      }
    });
    const dx = px - cx;
    const dy = py - cy;
    const angle = Math.atan2(dy, dx);
    controller.angleInDegrees = normalizeAngle(angle * (180/Math.PI), false);
    controller.angleInRadians = normalizeAngle(angle);
    return angle;
  };

  /**
   * Changes the position of the middle controller whenever one of the arc
   * controllers change positions
   * @param {Circle} midController: controller that changes the arc's radius
   * @param {Group} arc 
   * 
   * @returns {null}
   */
  const changeMidControllerPos = (midController, arc) => {
    const angleInRadians = computeMidAngle(arc.startAngleRadians, arc.endAngleRadians);
    const cx = arc.getCenterPoint().x;
    const cy = arc.getCenterPoint().y;
    const x = ((arc.scaleX * arc.radius) * Math.cos(angleInRadians)) + cx;
    const y = ((arc.scaleX * arc.radius) * Math.sin(angleInRadians)) + cy;
    midController.set({
      left: x,
      top: y,
      angleInRadians: angleInRadians,
      angleInDegrees: angleInRadians * (180/Math.PI),
    });
    midController.setCoords();
  };

  /**
   * Makes sure the controller is bound to only the circumference
   * of the circle
   * @param {Circle} controller: Selected controller
   * @param {Circle} arc: Arc that belongs to the controller
   * 
   * @returns {null}
   */
  const boundToCircumference = (controller, arc) =>{
    const x = arc.scaleX * (arc.radius * Math.cos(controller.angleInRadians));
    const y = arc.scaleX * (arc.radius * Math.sin(controller.angleInRadians));
    controller.set({
      left: x + arc.getCenterPoint().x,
      top: y + arc.getCenterPoint().y,
    });
  };

  /**
   * Where the majority of functions are called.
   * This handles changes for moving a controller and
   * moving the rotor
   * Use obj.target to select desired object
   * @param {event} obj: Event that occurs
   * 
   * @returns {null}
   */
  const moveControls = (obj) => {
    // Moving the rotor
    if(obj.target.isRotor){
      const radius = obj.target.radiusObject;
      const rotor = obj.target;
      radius.set ({
        left: rotor.left,
        top: rotor.top,
      })
      const newX = radius.getCenterPoint().x;
      const newY = radius.getCenterPoint().y;
      const objects = [radius.startControl, radius.endControl];
      objects.forEach((e) => {
          const x = (radius.scaleX * radius.radius) * Math.cos(e.angleInRadians);
          const y = (radius.scaleX * radius.radius) * Math.sin(e.angleInRadians);
          e.set({
            left: newX + x,
            top: newY + y,
          })
          e.setCoords();
      });
      changeMidControllerPos(radius.midControl, radius);
    }

    // Moving a controller
    else if (obj.target.control){
      const controller = obj.target;
      let radius = controller.parent,
          midController = radius.midControl,
          startController = radius.startControl,
          endController = radius.endControl;
      // If the controller is on the ends, recalculate angles and positions
      if(controller.controlType === 'start' || controller.controlType === 'end'){
        calculateAngle(startController);
        calculateAngle(endController);
        radius.startAngleRadians = normalizeAngle(startController.angleInRadians);
        radius.startAngleDegrees = normalizeAngle(startController.angleInDegrees, false);
        radius.endAngleRadians = normalizeAngle(endController.angleInRadians);
        radius.endAngleDegrees = normalizeAngle(endController.angleInDegrees, false);
        boundToCircumference(startController, radius);
        boundToCircumference(endController, radius);
        changeMidControllerPos(midController, radius);
      }
      // Changes rotation of the radius and how large it is based on the middle controller
      if(controller.controlType === 'middle'){
        calculateAngle(controller);
        getRotation(controller);
        radius.scale(findDistancefromPoint(controller.left, controller.top, radius.left, radius.top)/200);
      }
      updateArc(radius);
      // startController.bringToFront();
      // midController.bringToFront();
      // endController.bringToFront();
      // radius.rotor.bringToFront();
    }
    else return;
  };

  /**
   * Used for getting the angle of the middle controller
   * @param {number} startAngle: in radians
   * @param {number} endAngle: in radians
   * 
   * @returns {number} midAngle: in radians
   */
  const computeMidAngle = (startAngle, endAngle) => {
    startAngle = normalizeAngle(startAngle);
    endAngle = normalizeAngle(endAngle);
    let midAngle;
    if (endAngle < startAngle) {
      midAngle = (startAngle + endAngle + Math.PI * 2) / 2;
    } else {
      midAngle = (startAngle + endAngle) / 2;
    }
    return normalizeAngle(midAngle);
  };

  /**
   * Creates controllers for the selected obj
   * If the object's target's controllers have 
   * not been created, it creates it.
   * If not or the target is not a rotor, it returns.
   * Use obj.target to select desired object
   * @param {event} obj: obj is the event that happend
   * 
   * @returns {null}
   */
  const createControls = (obj) => {
    if(obj == null || obj.controlsCreated || !obj.rotorRadius){
      return;
    }
    const rotorRadius = obj;
    const cX = rotorRadius.getCenterPoint().x;
    const cY = rotorRadius.getCenterPoint().y;
    const arc = obj.getObjects()[1];
    const startDeg = util.degreesToRadians(arc.startAngleDegrees);
    const startControl = getPointOnCircumference(radius, startDeg);
    startControl.set({
      controlType: 'start',
      left: startControl.left + cX,
      top: startControl.top + cY,
      rotor: arc.id,
      control: true,
      angleInDegrees: arc.startAngleDegrees,
      angleInRadians: arc.startAngleRadians,
      radius: 7,
      fill: 'red',
      hasControls: false,
      hasBorders: false,
      originX: 'center',
      originY: 'center',
      parent: obj,
    });
    const endDegree = util.degreesToRadians(arc.endAngleDegrees);
    const endControl = getPointOnCircumference(radius, endDegree);
    endControl.set({
      controlType: 'end',
      left: endControl.left + cX,
      top: endControl.top + cY,
      rotor: arc.id,
      control: true,
      angleInDegrees: arc.endAngleDegrees,
      angleInRadians: arc.endAngleRadians,
      fill: 'red',
      radius: 7,
      hasControls: false,
      hasBorders: false,
      originX: 'center',
      originY: 'center',
      parent: obj,
    });
    const midleAngle = computeMidAngle(arc.startAngleRadians, arc.endAngleRadians);
    const midControl = getPointOnCircumference(radius, midleAngle);
    midControl.set({
      controlType: 'middle',
      left: midControl.left + cX,
      top: midControl.top + cY,
      originX: 'center',
      originY: 'center',
      fill: 'pink',
      radius: 7,
      rotor: arc.id,
      control: true,
      angleInDegrees: midleAngle * (180/Math.PI),
      angleInRadians: midleAngle,
      hasControls: false,
      hasBorders: false,
      parent: obj,
    });
    c.add(startControl);
    c.add(midControl);
    c.add(endControl);
    rotorRadius.set({
      startControl: startControl,
      midControl: midControl,
      endControl: endControl,
    });
    // startControl.bringToFront();
    // midControl.bringToFront();
    // endControl.bringToFront();
    rotorRadius.controlsCreated = true;
  };

  /**
   * Creates the new pathdata anytime the arc is being modified using a controller.
   * 
   * @param {number} startAngle: radians
   * @param {number} endAngle: radians
   * @param {number} cx 
   * @param {number} cy 
   * @param {number} radius 
   * @param {number} sweep: radians
   * 
   * @returns {string} PathData
   */
  const createPiePath = (startAngle, endAngle, cx, cy, radius, sweep) => {
    const startX = cx + radius * Math.cos(startAngle);
    const startY = cy + radius * Math.sin(startAngle);
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy + radius * Math.sin(endAngle);
    const largeArcFlag = sweep <= Math.PI ? 0 : 1;
    const pathData = [
      "M", cx, cy,
      "L", startX, startY,
      "A", radius, radius, 0, largeArcFlag,1,endX, endY,
    ].join(" ");
    return pathData;
  };

  /**
   * Creates an arc to be used for the rotor
   * @param {number} left 
   * @param {number} top 
   * @param {number} startAngle 
   * @param {number} endAngle 
   * @param {number} radius 
   * @param {[key: string]: number | boolean} options 
   * 
   * @returns {Path}
   */
  const createFilledArc = (left, top, startAngle, endAngle, radius, options) => {
    // Convert degrees to radians
    const start = util.degreesToRadians(startAngle);
    const end = util.degreesToRadians(endAngle);

    // Define the path for the filled arc
    const pathData = [
      'M', 
      left, top, // Move to center
      'L', 
      left + radius * Math.cos(start), 
      top + radius * Math.sin(start), // Line to start angle
      'A', 
      radius, 
      radius, 
      0, 
      (end - start) > Math.PI ? 1 : 0, 
      1, 
      left + radius * Math.cos(end), 
      top + radius * Math.sin(end), // Arc to end angle
    ].join(' ');
    const rad = new Path(pathData, options);
    rad.set({
      radius: radius,
      startAngleDegrees: startAngle,
      endAngleDegrees: endAngle,
      startAngleRadians: start,
      endAngleRadians: end,
      id: rotors + 1,
      control: false,
    });
    if (options.id) rad.id = options.id;
    return rad;
  };

  /**
   * Used for creating the arc object.
   * @param {Circle} object 
   * 
   * @returns {Group}
   */
  const createRadius = (object) => {
    // Create a filled arc
    const filledArc = createFilledArc(200, 200, STARTANGLE, ENDANGLE, radius, {
      fill: 'rgba(0, 0, 0, .2)', 
    });
    const boundingCircle = new Circle({
      left: 200, 
      top: 200,
      selectable: false,
      originX: 'center',
      originY: 'center',
      fill:'rgba(0,0,250,0.0)',
      radius: RADIUS,
      boundingCircle: true,
    });
    let group = new Group([boundingCircle, filledArc], {
      left: object.left, 
      top: object.top,
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: false,
      rotorRadius: true,
      controlsCreated: false,
      rotorId: filledArc.id,
      radius: radius,
      startAngleDegrees: STARTANGLE,
      startAngleRadians: STARTANGLE * (Math.PI/180),
      endAngleDegrees: ENDANGLE,
      endAngleRadians: (ENDANGLE) * (Math.PI/180),
      rotor: object,
      startControl: null,
      midControl: null,
      endControl: null,
      isRadius: true,
    });
    rotors += 1;
    c.add(group);
    // bringToFront(group)
    createControls(group);
    // group.startControl.bringToFront();
    // group.midControl.bringToFront();
    // group.endControl.bringToFront();
    return group
  };

  /**
   * Adds a rotor to the canvas.
   * @param {event} event: event
   * 
   * @returns {null}
   */
  const addRotor = (object) => {
    const rotor = new Circle({
      left: object.offsetX,
      top: object.offsetY,
      originX: 'center',
      originY: 'center',
      fill: 'gray',
      radius: 7,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      isRotor: true,
      radiusObject: null,
    });
    rotor.radiusObject = createRadius(rotor);
    c.add(rotor);
    // bringToFront(rotor)
  };

  /**
   * Creates the canvas and sets its width and height to the 
   * user's window size.
   */
  onMounted(() => {
    const canvasValue = canvas.value;
    c = new Canvas(canvasValue, {
      preserveObjectStacking: false,
    });
    c.on({
      'mouse:up': (options) => {
        console.log(options)
        if(options.isClick && (!options.target || options.target.isRadius)){
          addRotor(options.e);
        }
      },
      'object:moving': moveControls,
    });
  });
</script>