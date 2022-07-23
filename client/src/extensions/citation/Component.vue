<template>
  <node-view-wrapper as="span" class="citation" draggable="true" data-drag-handle>
    www{{ node.attrs.id }}
    <!-- <button @click="process">{{ node.attrs.id }}</button> -->
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3';

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  // updateAttributes: {
  //   type: Function,
  //   required: true,
  // }
});

// const process = () => {
  // props.updateAttributes({
  //   count: props.node.attrs.count + 1,
  // })
//   console.log(props.node.attrs.id);
// };

</script>

<style lang="scss">
.citation {
  margin: 0px 5px;
  background: silver;
  padding: 0px 5px;
  border-radius: 5px;
  border: 1px solid black;
}
</style>