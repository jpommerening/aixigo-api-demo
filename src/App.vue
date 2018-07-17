<template>
  <div id="app">
    <div v-if="error" class="error">
      {{error.message}}
    </div>
    <div v-if="response && config.debug" class="debug">
      {{JSON.stringify(response, true, 2)}}
    </div>
    <div class="container">
      <RingChart
        :data="properties"
        :selection="selection"
        @select="select"
        :labels="labels"/>
      <BarChartTable
        :data="properties"
        :selection="selection"
        @select="select"
        :labels="labels"/>
      <BarChartTable
        :data="holdings | selected(selection)"
        :labels="labels"/>
    </div>
  </div>
</template>

<script>
import RingChart from "./components/RingChart";
import BarChartTable from "./components/BarChartTable";

import { asPalette, toPercent, byProportion } from "./utils";

export default {
  name: "App",
  props: {
    api: {
      type: Object,
      required: true
    },
    config: {
      type: Object
    }
  },
  data: () => ({
    selection: null,
    resources: {
      structure: null,
      aggregation: null
    },
    error: null
  }),
  components: {
    RingChart,
    BarChartTable
  },
  created() {
    this.api
      .structure()
      .then(res => {
        this.resources.structure = res;
        return this.api.holdings(res.holdings);
      })
      .then(res => {
        this.resources.aggregation = res;
      })
      .catch(err => {
        this.error = err;
      });
  },
  methods: {
    select(selection) {
      this.selection = selection;
    }
  },
  filters: {
    selected(item, selection) {
      if (!selection) {
        return [];
      }
      const { key } = selection;
      return item.filter(({ properties }) => properties.some(p => p === key));
    }
  },
  computed: {
    properties() {
      if (!this.resources.structure) {
        return [];
      }
      return this.resources.structure.properties
        .slice()
        .sort(byProportion)
        .map((item, index) => ({
          index,
          key: item.propertyId,
          name: item.propertyName.replace("/", "/\u{200B}"),
          value: item.totalProportion,
          percent: toPercent(item.totalProportion),
          classes: [
            `item-property-${item.propertyId}`,
            `item-${asPalette(item.propertyName)}`
          ]
        }));
    },
    holdings() {
      if (!(this.resources.structure && this.resources.aggregation)) {
        return [];
      }

      return this.resources.structure.holdings
        .slice()
        .sort(byProportion)
        .map((item, index) => {
          const classes = item.properties
            .map(p => [
              `item-property-${p.propertyId}`,
              `item-${asPalette(p.propertyName)}`
            ])
            .reduce((a, b) => [...a, ...b]);
          const properties = item.properties.map(p => p.propertyId);
          const holding = Object.keys(item.holdingId)
            .map(
              k =>
                this.resources.aggregation[k]
                  ? this.resources.aggregation[k]
                      .filter(h => h.id === item.holdingId[k])
                      .map(h => ({
                        key: `${k}:${h.id}`,
                        name: h.shortName
                      }))
                  : [
                      {
                        key: `${k}:${item.holdingId[k]}`,
                        name: `${k} ${item.holdingId[k]}`
                      }
                    ]
            )
            .reduce((a, b) => [...a, ...b])
            .pop();

          return {
            index,
            ...holding,
            properties,
            value: item.totalProportion,
            percent: toPercent(item.parentProportion),
            classes
          };
        });
    },
    labels() {
      return {};
    }
  }
};
</script>

<style lang="scss" scoped>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.error {
  color: red;
}

.debug {
  font-family: "Courier New", Courier, monospace;
  white-space: pre;
  text-align: left;
}

.container {
  display: flex;
  margin: 2em;

  & > * {
    width: 33%;
  }
}
</style>
