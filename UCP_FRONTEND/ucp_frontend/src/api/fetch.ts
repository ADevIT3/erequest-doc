const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
    status: number
    response: Response

    constructor(message: string, status: number, response: Response) {
        super(message)
        this.status = status
        this.response = response
    }
}

export const apiFetch = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${ BASE_URL }/${ path }`, {
        ...options,
        credentials: 'include',
        
        /*headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },*/
    })

    if (response.status === 401) {
        window.location.href = '/'
        throw new ApiError('SESSION_EXPIRED', 401, response)
    }

    if (!response.ok) {
        throw new ApiError(`HTTP error! Status: ${ response.status }`, response.status, response)
    }

    return response
}