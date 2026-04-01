import commonTravelLiquids from '../../data/commonTravelLiquids.json'

const OUNCES_TO_ML = 29.5735
const CARRY_ON_LIMIT_ML = 100

const getCommonLiquids = () => {

    return (commonTravelLiquids ?? []).map((item) => ({
        item: item?.item ?? '',
        volumeMl: Number(item?.volume_ml) || 0,
    }))

}

const convertToMl = (value, unit) => {

    const numericValue = Number(value)

    if(!Number.isFinite(numericValue)) {
        return null
    }

    if(unit === 'ounces') {
        return numericValue * OUNCES_TO_ML
    }

    return numericValue

}

const getAllowanceStatus = (value, unit) => {

    if(value === '' || value === null || value === undefined) {
        return null
    }

    const mlValue = convertToMl(value, unit)

    if(!Number.isFinite(mlValue)) {
        return null
    }

    if(mlValue <= CARRY_ON_LIMIT_ML) {
        return {
            allowed: true,
            title: 'Allowed',
            message: 'This container can go in your carry-on.',
            mlValue,
        }
    }

    return {
        allowed: false,
        title: 'Not Allowed',
        message: 'This container is over the carry-on liquid limit.',
        mlValue,
    }

}

const isItemAllowed = (volumeMl) => {
    return Number(volumeMl) <= CARRY_ON_LIMIT_ML
}

export {
    CARRY_ON_LIMIT_ML,
    getCommonLiquids,
    convertToMl,
    getAllowanceStatus,
    isItemAllowed,
}