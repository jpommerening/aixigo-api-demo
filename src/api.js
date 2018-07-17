export default config => ({
  base: `${config.host}/pms-api`,
  today: new Date().toISOString().split("T")[0],
  options: {
    mode: "cors",
    cache: "no-cache",
    credentials: "omit"
  },
  fetch(path) {
    const url = `${this.base}${path}`;
    return fetch(url, this.options).then(res => {
      if (res.status !== 200) {
        return res.text().then(message => Promise.reject({ message }));
      }
      return res.json();
    });
  },
  structure(when = this.today) {
    // Possible aggregations:
    // aggregation=ASSET
    // aggregation=CONTRACT
    // aggregation=POSITION

    // Possible Properties:
    // propertySource=PROPERTY&propertyType=SECTOR
    // propertySource=PROPERTY&propertyType=REGION
    // propertySource=ASSET_CURRENCY&propertyType=CURRENCY

    const CONTRACTS = [
      "365785522500",
      "426970899400",
      "416688252500",
      "255716884100",
      "156467095700",
      "426729667700",
      "155195039400"
    ];

    return this.fetch(
      "/analytics/one-dimensional-structure-snapshot" +
        `?when=${when}` +
        "&contract=155195039400" +
        "&aggregation=ASSET" +
        "&propertySource=PROPERTY" +
        "&propertyType=SECTOR" +
        "&algorithm=VALUE"
    );
  },
  holdings(holdings, when = this.today) {
    const assets = holdings.map(h => h.holdingId.ASSET).filter(Boolean);
    const contracts = holdings.map(h => h.holdingId.CONTRACT).filter(Boolean);

    return Promise.all([
      this.assets(assets, when).then(res => res.assets),
      this.contracts(contracts, when).then(res => res.contracts)
    ]).then(([ASSET, CONTRACT]) => ({ ASSET, CONTRACT }));
  },
  assets(assets, when = this.today) {
    if (assets.length === 0) {
      return Promise.resolve([]);
    }

    return this.fetch(
      `/analytics/assets?when=${when}&asset=${assets.join("&asset=")}`
    );
  },
  contracts(contracts, when = this.today) {
    if (contracts.length === 0) {
      return Promise.resolve([]);
    }

    return this.fetch(
      "/reports/portfolio-overview" +
        `?when=${when}` +
        `&contract=${contracts.join("&contract=")}` +
        "&aggregation=POSITION"
    );
  }
});
