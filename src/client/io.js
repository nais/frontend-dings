const loadStuffFromApi = async () => {
    const response = await fetch('/api/getstuff')
    if (response.status >= 400) {
        throw `HTTP error: ${response.status}`
    }

    return {
        status: response.status,
        data: await response.text(),
    }
}

export default loadStuffFromApi