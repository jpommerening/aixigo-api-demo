<template>
  <table class="bar-chart-table">
    <tbody>
      <tr v-for="item in data"
          :key="item.key"
          :class="item.classes">
        <td :class="{ active: (item === selection), 'percent-bar': true }"
          :style="{ backgroundSize: `${item.percent}% 100%` }">
          <div class="details-wrapper">
            <span class="details-item name" @click="select(item)">
              {{item.name}}
            </span>
            <span class="details-item percent">
              {{item.percent}}<span class="unit">%</span>
            </span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    selection: Object
  },
  methods: {
    select(item) {
      this.$emit("select", item);
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../styles/common.scss";

.bar-chart-table {
  .details-wrapper {
    display: flex;
    align-items: center;

    line-height: 1.1;
  }

  th .details-wrapper {
    align-items: flex-end;

    margin: 0.05em;
  }

  .details-item {
    margin: 0.3ex 0.6em;

    &:first-child {
      width: 60%;
      margin-right: auto;
    }

    &:not(:first-child) {
      width: 20%;
      margin-left: 0.5rem;

      text-align: right;
    }
  }

  .active {
    font-weight: 700;
  }

  .name {
    word-wrap: break-word;
    cursor: pointer;
    text-align: left;
  }

  .percent-bar {
    position: relative;

    background-image: linear-gradient(
      to right,
      $rfs-inactive-background-color 0%,
      $rfs-inactive-background-color 100%,
      transparent 100%
    );
    background-repeat: no-repeat;
    background-size: 0;

    transition: $rfs-transition-duration background-color,
      $rfs-transition-duration border-color;
  }

  @mixin percent-bar($color) {
    $color-50: transparentize($color, 0.5);
    $color-75: transparentize($color, 0.75);

    border-color: $color;
    &.active {
      background-color: $color-75;
      background-image: linear-gradient(
        to right,
        $color-50 0%,
        $color-50 100%,
        transparent 100%
      );
    }
  }

  @for $i from 1 through length($rfs-properties-palette) {
    $color: nth($rfs-properties-palette, $i);
    $alternative-color: nth($rfs-properties-palette-alternative, $i);

    .item-#{$i} {
      &.percent-bar,
      > .percent-bar {
        @include percent-bar($color);
      }
      &.alternative.percent-bar,
      &.alternative > .percent-bar {
        @include percent-bar($alternative-color);
      }
    }
  }
}
</style>
