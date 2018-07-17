<template>
  <svg class="ring-chart" viewBox="0 0 100 100"/>
</template>

<script>
import * as d3 from "d3";

const identity = d => d;

const EMPTY_SLICE = {
  startAngle: Math.PI * 2,
  endAngle: Math.PI * 2,
  value: 0
};

export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    selection: Object,
    autoselect: {
      type: Boolean,
      default: true
    }
  },
  data: () => {
    const data = {
      chart: null
    };
    data.mountedPromise = new Promise(resolve => {
      data.mountedPromiseResolve = resolve;
    });
    return data;
  },
  mounted() {
    this.chart = new Chart(
      this.$el,
      sliceData => {
        this.$emit("select", sliceData);
      },
      this.format,
      this.value
    );
    this.chart.renderOrUpdate(this.data);
    if (this.autoselect && this.data.length > 0) {
      this.chart.selectSlice(0);
    }
    this.mountedPromiseResolve();
  },
  watch: {
    data() {
      this.mountedPromise.then(() => {
        this.chart.renderOrUpdate(this.data);
        if (this.autoselect && !this.select && this.data.length > 0) {
          this.chart.selectSlice(0);
        }
      });
    },
    selection(item, previousItem) {
      if (item) {
        this.chart.selectSlice(item.index);
      } else if (previousItem) {
        this.chart.selectSlice(-1);
      }
    }
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Chart {
  constructor(chartElement, selectSliceCallback) {
    this.mainGroup = null;
    this.chartElement = chartElement;
    this.selectSliceCallback = selectSliceCallback;
    this.selectedIndex = -1;
    this.format = item => item.percent;
    this.value = item => item.value;
    this.current = {};

    const innerRadius = 36;
    const defaultRadius = 45;
    const selectedRadius = 50;

    const arc = t =>
      d3
        .arc()
        .outerRadius(defaultRadius + (selectedRadius - defaultRadius) * t)
        .innerRadius(innerRadius);

    this.arcTween = (previousSelection, newSelection) => {
      return (d, index) => {
        const previousValue = this.current[index] || EMPTY_SLICE;
        const previousRadius = previousSelection === index ? 1 : 0;
        const newValue = d;
        const newRadius = newSelection === index ? 1 : 0;
        const value = d3.interpolate(previousValue, newValue);
        const radius = d3.interpolate(previousRadius, newRadius);
        this.current[index] = newValue;
        return t => arc(radius(t))(value(t), index);
      };
    };

    this.defaultArcTween = (d, index) =>
      this.arcTween(this.selectedIndex, this.selectedIndex)(d, index);

    this.defaultArc = (d, index) =>
      arc(index === this.selectedIndex ? 1 : 0)(d, index);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  renderOrUpdate(data) {
    const width = 100;
    const height = 100;

    const pie = d3
      .pie()
      .sort(d => d.index)
      .value(this.value);

    if (!this.mainGroup) {
      this.mainGroup = d3
        .select(this.chartElement)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);
    }

    if (this.selectedIndex >= data.length) {
      this.selectedIndex = data.length - 1;
    }

    const pieData = pie(data);
    const chartSliceGroup = this.mainGroup
      .selectAll(".structure-chart-slice")
      .data(pieData);

    const classes = d => {
      if (d.data) {
        const enabled = d.data.enabled !== false ? ["enabled"] : [];
        return (d.data.classes || []).concat(enabled);
      }
      return [];
    };

    // update existing slices
    chartSliceGroup
      .attr("class", d => ["slice", ...classes(d)].join(" "))
      .select("path")
      .on(
        "click",
        (d, index) => d.data.enabled !== false && this.selectSlice(index)
      )
      .transition(2000)
      .attrTween("d", this.defaultArcTween);

    // add missing slices
    chartSliceGroup
      .enter()
      .append("g")
      .attr("class", d => ["slice", ...classes(d)].join(" "))
      .append("path")
      .on(
        "click",
        (d, index) => d.data.enabled !== false && this.selectSlice(index)
      )
      .transition(2000)
      .attrTween("d", this.defaultArcTween);

    // remove superfluous slices
    chartSliceGroup
      .exit()
      .transition(2000)
      .remove()
      .select("path")
      .attrTween("d", (d, index) => {
        const startAngle = angleFor(index);
        const endAngle = startAngle;
        return this.defaultArcTween({ startAngle, endAngle, value: 0 }, index);
      });

    function angleFor(index) {
      if (pieData[index]) {
        return pieData[index].startAngle;
      }
      if (pieData[index - 1]) {
        return pieData[index - 1].endAngle;
      }
      return Math.PI * 2;
    }

    // remove inner circle texts, when a user still hovers over a slice while the pie is updated.
    // Otherwise he'll most probably see old, confusing values
    this.mainGroup.selectAll(".inner-name, .inner-percent").remove();
    if (this.selectedIndex >= 0) {
      this.highlightSlice(this.selectedIndex);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  selectSlice(index) {
    this.removeHighlighting(this.selectedIndex);
    if (index !== this.selectedIndex) {
      this.updatePaths(this.selectedIndex, index);
      this.selectedIndex = index;
    }
    if (index >= 0) {
      this.highlightSlice(this.selectedIndex);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  updatePaths(previousSelection, newSelection) {
    this.mainGroup
      .selectAll(".slice")
      .select("path")
      .transition(2000)
      .attrTween("d", this.arcTween(previousSelection, newSelection));
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  highlightSlice(index) {
    const path = this.mainGroup.select(`.slice:nth-child(${index + 1}) > path`);
    const d = path.datum();
    const classes = (d.data && d.data.classes) || [];

    this.mainGroup
      .append("text")
      .attr("class", ["inner-name", ...classes].join(" "))
      .html(d.data.name);
    const percentWrapper = this.mainGroup
      .append("text")
      .attr("class", ["inner-percent", ...classes].join(" "));

    percentWrapper.append("tspan").text(this.format(d.data));
    percentWrapper
      .append("tspan")
      .text("%")
      .attr("class", "inner-percent-symbol");
    this.selectSliceCallback(d.data);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  removeHighlighting(index) {
    // TODO: can the statement removed, or does "select" have any side-effects?
    this.mainGroup.select(`.slice:nth-child(${index + 1}) > path`);

    this.mainGroup.selectAll(".inner-name, .inner-percent").remove();
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/common.scss";

.ring-chart {
  width: 100%;
  height: 100%;

  .slice.enabled {
    cursor: pointer;
  }

  .inner-percent {
    font-size: 0.7em;

    transform: translateY(-0.5em);

    text-anchor: middle;
  }

  .inner-percent-symbol {
    font-size: 0.6em;
  }

  .inner-name {
    font-size: 0.3em;

    transform: translateY(0.5em);

    text-anchor: middle;
  }

  .slice {
    > path {
      transition: $rfs-transition-duration fill;

      stroke: #fff;
      stroke-width: 0.5px;
    }
  }

  @for $i from 1 through length($rfs-properties-palette) {
    $color: nth($rfs-properties-palette, $i);
    $alternative-color: nth($rfs-properties-palette-alternative, $i);

    .slice.item-#{$i} {
      > path {
        fill: $color;
      }

      &.alternative > path {
        fill: $alternative-color;
      }
    }
  }
}
</style>
