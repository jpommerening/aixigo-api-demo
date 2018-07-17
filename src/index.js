import Vue from "vue";
import App from "./App";
import api from "./api";

const config = {
  debug: false,
  host: "http://ppcm029.ac.aixigo.de:8000"
};

/* eslint-disable no-new */
new Vue({
  el: "#app",
  render: h => h(App, { props: { api: api(config), config } })
});
