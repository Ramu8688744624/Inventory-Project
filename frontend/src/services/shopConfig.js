const defaultConfig = {
  name: 'JaiBhajarang Mobiles',
  city: 'Karimnagar',
  currencySymbol: '₹',
}

function loadConfig() {
  try {
    const saved = localStorage.getItem('shop_config')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        name: parsed.name || defaultConfig.name,
        city: parsed.city || defaultConfig.city,
        currencySymbol: parsed.currencySymbol || defaultConfig.currencySymbol,
      }
    }
  } catch {
    // ignore
  }
  return { ...defaultConfig }
}

function saveConfig(config) {
  localStorage.setItem('shop_config', JSON.stringify(config))
}

export const shopConfig = loadConfig()
export const updateShopConfig = (config) => {
  const next = {
    name: config.name || defaultConfig.name,
    city: config.city || defaultConfig.city,
    currencySymbol: config.currencySymbol || defaultConfig.currencySymbol,
  }
  saveConfig(next)
  Object.assign(shopConfig, next)
}

