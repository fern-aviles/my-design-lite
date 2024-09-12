
<template>
  <div>
    <!-- <TestBoard/> -->
    <TestBoard/>
  </div>
</template>
  
<script>
  import Board from './components/Board.vue';
  import ProductBoard from './components/ProductBoard.vue';
import TestBoard from './components/TestBoard.vue';
  import TestingBoard from './components/TestingBoard.vue';

  export default{
    components: {
      Board,
      TestingBoard,
      ProductBoard,
      TestBoard
    }
  }


</script>

<style scoped>
</style>
