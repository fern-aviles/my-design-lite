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
    var circle = obj.target.item(1),
        group = obj.target;
    circle.scaleX = 1 / group.scaleX;
    circle.scaleY = 1 / group.scaleY;
  }
  
  /**
   * Checks to see if all selected elements are rotors.
   * If they're all rotors, the user can't scale the
   * rotors.
   * Else, they selected an individual rotor and can
   * change its size.
   */
  const checkRotors = () => {
    var group = c.getActiveObject();
    let allRotors = true;
    group.forEachObject((obj) => {
      allRotors = allRotors && obj.rotor;
    })
    if (allRotors){
      group.setControlsVisibility({
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
    }
  }

  /**
   * Adds a rotor to the canvas.
   * @param event : event
   * @returns null
   */
  const addRotor = (object) => {
    const circle = new fabric.Circle({
      left: object.offsetX,
      top: object.offsetY,
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
      left: object.offsetX,
      top: object.offsetY,
      originX: 'center',
      originY: 'center',
      fill: 'skyblue',
      radius: 20,
    });

    const rotor = new fabric.Group([rotorRadius, circle], {
      left: object.offsetX,
      top: object.offsetY,
      originX: 'center',
      originY: 'center',
    });
    rotor.set({
      rotor: true,
    })
    c.add(rotor);
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
      'selection:created': checkRotors,
      'object:scaling': onChange,
    });
  });
</script>