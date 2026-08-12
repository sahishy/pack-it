const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
    },
})

const getAllowedOrigin = (request, env) => {
    const origin = request.headers.get('Origin')

    if (!origin) {
        return null
    }

    const allowedOrigins = String(env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

    return allowedOrigins.includes(origin) ? origin : null
}

const getCorsHeaders = (request, env) => {
    const origin = getAllowedOrigin(request, env)

    return origin ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Firebase-AppCheck, X-Guest-Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    } : {}
}

const withCors = (response, request, env) => {
    const next = new Response(response.body, response)

    for (const [name, value] of Object.entries(getCorsHeaders(request, env))) {
        next.headers.set(name, value)
    }

    return next
}

export { getAllowedOrigin, getCorsHeaders, json, withCors }
