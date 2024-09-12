<template>
  <div>
    <canvas ref="canvas" width="5000" height="5000"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { Canvas, Circle, FabricImage, FabricText, Group, Line, Path } from 'fabric';
  import { Item, Obj1, Spray2 } from '@/util/test';
  import { HunterProduct } from '@/util/product';
  import { Spray, Mover, ProductGroup } from '@/util/spray';
  const canvas = ref();
  let c = null as Canvas | null;
  let waterScale = 20;
  let counter = 0;
  let p = new Group([], {
    subTargetCheck: true,
    interactive: true, 
    originX: 'center', 
    originY: 'center', 
    perPixelTargetFind: true, 
    objectCaching: true,
    selectable: false,
  });
  const createRotor = (e: any) => {

    // const rotor = new HunterProduct({
    //   productID: '461006',
    //   pressure: '40' + "PSI",
    //   left: e.offsetX,
    //   top: e.offsetY,
    //   canvas: c,
    // });
    // const rotor = new Item({
    //   productID: '461006',
    //   pressure: '40' + "PSI",
    //   left: e.offsetX,
    //   top: e.offsetY,
    //   canvas: c,
    // });
    const rotor = new Spray({
      productID: '461006',
      pressure: '40' + "PSI",
      // left: e.offsetX,
      // top: e.offsetY,
      left: 500,
      top: 500,
      canvas: c,
    });
    // c!.add(rotor); 
    // c?.setActiveObject(rotor);
    return rotor;
  }

  const addImage = () => {
    let imageObj = new Image();
    imageObj.src = "src/assets/landscape.png";
    let image = new FabricImage(imageObj);
    image.set({
      angle: 0,
      padding: 10,
      cornersize:10,
      height:c!.height,
      width:c!.width,
      selectable: false,
    });

    FabricImage.fromURL(imageObj.src).then((image) => {
      c!.backgroundImage = image;
      c!.requestRenderAll();
    });
  }

  onMounted(() => {
  const canvasValue = canvas.value;
  c = new Canvas(canvasValue, {
    preserveObjectStacking: false,
    // selection: false,
  });

  // addImage();
  // createRotor({offsetX: 200, offsetY: 200});
  c.on({
    'mouse:up': (options) => {
      // Clicking on no objects/water object
      if(counter >= 2){
        p = new Group([], {
          subTargetCheck: true,
          interactive: true, 
          originX: 'center', 
          originY: 'center', 
          perPixelTargetFind: true, 
          objectCaching: true
        });
        counter = 0;
        console.log('new group');
      }
      if(options.isClick && !(options.target instanceof Spray)){
        console.log(options.target)
        if(counter == 0){
          // console.log('added group to canvas')
          // c?.add(p)
        }
        for(let j = 0; j < 100; j++){
          const r = createRotor(options.e); 
          c?.add(r);
          // p.add(r);
          // c?.remove(r);
          // counter++;
        }
        console.log(c?.getObjects())
      }
    }
  });

  c.off({
    'mouse:up': (options) => {
    },
    'mouse:down': () => {
    },
    'object:moving': () => {
    },

  })
  c.requestRenderAll();
  })
</script>

<style>
p{
  display: inline;
}
</style>