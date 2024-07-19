
<template>
  <div>
    <TestingBoard/>
    <Board/>
  </div>
</template>
  
<script>
  import Board from './components/Board.vue';
  import TestingBoard from './components/TestingBoard.vue';

  export default{
    components: {
      Board,
      TestingBoard
    }
  }


</script>

<style scoped>
</style>
