<!-- This file contains the canvas the user will be using to design
 their sprinkler layout  -->

 <template>
  <h1>canvas</h1>
  <canvas ref="canvas"></canvas>
</template>

<script setup lnag="ts">
  import { fabric } from 'fabric';
  import { ref, onMounted } from 'vue';

  const canvas = ref(null);
  let c = null;
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  const onChange = (obj) => {
    console.log(obj)
    // console.log("radius", obj.target.item(0))
    // console.log("rotor", obj.target.item(1))
    var circle = obj.target.item(1),
        group = obj.target;
    circle.scaleX = 1 / group.scaleX;
    circle.scaleY = 1 / group.scaleY;
  }

  const afterChange = (obj) => {
    console.log("after change")
    var circle = obj.target.item(1),
        radius = obj.target.item(0),
        group = obj.target;
    // group.set({
    //   scalex: 1,
    //   scaleY: 1
    // });
    // circle.set({
    //   left: 0,
    //   top: 0,
    // });
    // radius.set({
    //   left: 0,
    //   top: 0,
    // });
  }
  /**
   * Adds a rotor to the canvas.
   * @param event : event
   * @returns null
   */
  const addRotor = (event) => {
    const circle = new fabric.Circle({
      left: event.offsetX,
      top: event.offsetY,
      originX: 'center',
      originY: 'center',
      fill: 'black',
      radius: 7,
    });

    circle.setControlsVisibility({
      bl: false,
      br: false,
      mb: false,
      ml: false,
      mr: false,
      mt: false,
      tl: false,
      tr: false,
      mtr: false,
    });

    const rotorRadius = new fabric.Circle({
      left: event.offsetX,
      top: event.offsetY,
      originX: 'center',
      originY: 'center',
      fill: 'skyblue',
      radius: 20,
    });

    const rotor = new fabric.Group([rotorRadius, circle], {
      left: event.offsetX,
      top: event.offsetY,
      originX: 'center',
      originY: 'center',
    });
    c.add(rotor);
    console.log(rotor)
  };

  /**
   * Creates the canvas and sets its width and height to the 
   * user's window size.
   */
  onMounted(() => {
    const canvasValue = canvas.value;
    c = new fabric.Canvas(canvasValue);
    c.setWidth(width.value);
    c.setHeight(height.value);
    c.on({
      'mouse:up': (options) => {
        if(options.isClick && !options.target){
          addRotor(options.e);
        }
      },
      'object:scaling': onChange,
      'object:modified': afterChange,
    });
  });
</script>