import countryExchangeRates from '../../data/countryExchangeRates.json'

const getDescriptorParts = (descriptor = '') => {
    const lastDashIndex = descriptor.lastIndexOf('-')

    if (lastDashIndex === -1) {
        return {
            country: descriptor,
            currencyName: descriptor,
        }
    }

    return {
        country: descriptor.slice(0, lastDashIndex),
        currencyName: descriptor.slice(lastDashIndex + 1),
    }
}

const compareDatesDesc = (leftDate, rightDate) => {
    const leftTime = new Date(leftDate).getTime()
    const rightTime = new Date(rightDate).getTime()

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
        return 0
    }

    return rightTime - leftTime
}

const normalizeCurrencyEntry = (entry) => {
    const descriptor = entry?.country_currency_desc ?? ''
    const { country, currencyName } = getDescriptorParts(descriptor)
    const exchangeRate = Number(entry?.exchange_rate)

    return {
        id: descriptor,
        descriptor,
        country,
        currencyName,
        symbol: entry?.symbol ?? '$',
        exchangeRate: Number.isFinite(exchangeRate) ? exchangeRate : 1,
        effectiveDate: entry?.effective_date ?? '',
    }
}

const getCurrencies = () => {
    const entries = countryExchangeRates?.data ?? []
    const latestByDescriptor = new Map()

    entries.forEach((rawEntry) => {
        const entry = normalizeCurrencyEntry(rawEntry)
        const existing = latestByDescriptor.get(entry.descriptor)

        if (!existing) {
            latestByDescriptor.set(entry.descriptor, entry)
            return
        }

        const isNewer = compareDatesDesc(existing.effectiveDate, entry.effectiveDate) > 0
        if (isNewer) {
            latestByDescriptor.set(entry.descriptor, entry)
        }
    })

    return [...latestByDescriptor.values()].sort((a, b) => {
        const countrySort = a.country.localeCompare(b.country)
        if (countrySort !== 0) {
            return countrySort
        }

        return a.currencyName.localeCompare(b.currencyName)
    })
}

const getDefaultCurrencyPair = () => {
    const currencies = getCurrencies()
    const usd = currencies.find((item) => item.descriptor === 'United States-Dollar') ?? currencies[0] ?? null
    const euroZone = currencies.find((item) => item.currencyName === 'Euro' || item.descriptor === 'Euro Zone-Euro') ?? currencies[1] ?? usd

    return {
        fromCurrency: usd,
        toCurrency: euroZone,
    }
}

const convertCurrencyAmount = ({ amount, fromCurrency, toCurrency }) => {
    const normalizedAmount = Math.max(0, Number(amount) || 0)
    const fromRate = Number(fromCurrency?.exchangeRate) || 1
    const toRate = Number(toCurrency?.exchangeRate) || 1

    const usdAmount = normalizedAmount / fromRate
    const convertedAmount = usdAmount * toRate

    return {
        inputAmount: normalizedAmount,
        convertedAmount,
    }
}

const getUsdRateLabel = (currency) => {
    if (!currency) {
        return 'Select a currency'
    }

    return `1 USD = ${currency.exchangeRate} ${currency.currencyName}`
}

export {
    getCurrencies,
    getDefaultCurrencyPair,
    convertCurrencyAmount,
    getUsdRateLabel,
}